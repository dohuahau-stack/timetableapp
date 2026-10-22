use calamine::{open_workbook_auto, Data, Reader};
use serde_json::{json, Value};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use crate::state::Course;

const MAX_TABLE_CHARS: usize = 60_000;

const SYSTEM_PROMPT: &str = "Bạn là bộ máy sắp xếp thời khóa biểu chính khóa. \
Đọc dữ liệu bảng Excel và trích xuất MỌI buổi học thành danh sách JSON theo đúng schema.\n\
Quy ước:\n\
- day: 0 = Thứ 2, 1 = Thứ 3, 2 = Thứ 4, 3 = Thứ 5, 4 = Thứ 6, 5 = Thứ 7, 6 = Chủ Nhật.\n\
- session: morning (sáng, trước 12:00), afternoon (chiều, 12:00 đến 17:59), evening (tối, từ 18:00).\n\
- start và end là giờ 24h dạng HH:MM.\n\
- Nếu file chỉ ghi số tiết, hãy dùng bảng giờ của từng tiết có trong file hoặc trong câu lệnh của người dùng. \
Nếu không có, dùng mặc định: tiết 1 bắt đầu 07:00, mỗi tiết 45 phút, giải lao 5 phút giữa các tiết, \
buổi chiều bắt đầu 13:00.\n\
- Một môn học nhiều ngày thì tạo nhiều phần tử riêng. Các tiết liền kề của cùng một môn trong cùng ngày gộp thành một phần tử.\n\
- name: tên môn ngắn gọn, giữ nguyên tiếng Việt có dấu. note: phòng học hoặc giáo viên nếu có, nếu không có để chuỗi rỗng.\n\
- Không bịa ra môn không có trong dữ liệu. Câu lệnh của người dùng có độ ưu tiên cao nhất \
(ví dụ bỏ qua một môn, đổi giờ, chỉ lấy một lớp).";

fn cell_text(c: &Data) -> String {
    match c {
        Data::Empty => String::new(),
        Data::String(s) => s.replace(['\n', '\r'], " / ").trim().to_string(),
        Data::Float(f) => {
            if f.fract() == 0.0 {
                format!("{}", *f as i64)
            } else {
                f.to_string()
            }
        }
        other => format!("{}", other).trim().to_string(),
    }
}

/// Trích dữ liệu thô của mọi sheet thành văn bản gọn nhẹ: mỗi hàng một dòng, các ô cách nhau bằng " | ".
pub fn excel_to_text(path: &str) -> Result<String, String> {
    let mut wb = open_workbook_auto(path).map_err(|e| format!("Không mở được file Excel: {e}"))?;
    let names: Vec<String> = wb.sheet_names().to_vec();
    let mut out = String::new();

    for name in names {
        let range = match wb.worksheet_range(&name) {
            Ok(r) => r,
            Err(_) => continue,
        };
        let mut block = String::new();
        for row in range.rows() {
            let cells: Vec<String> = row.iter().map(cell_text).collect();
            if let Some(last) = cells.iter().rposition(|c| !c.is_empty()) {
                block.push_str(&cells[..=last].join(" | "));
                block.push('\n');
            }
        }
        if !block.is_empty() {
            out.push_str(&format!("## Sheet: {name}\n{block}\n"));
        }
        if out.chars().count() > MAX_TABLE_CHARS {
            break;
        }
    }

    if out.trim().is_empty() {
        return Err("File Excel không có dữ liệu.".into());
    }
    if out.chars().count() > MAX_TABLE_CHARS {
        out = out.chars().take(MAX_TABLE_CHARS).collect();
    }
    Ok(out)
}

fn schema() -> Value {
    json!({
        "type": "OBJECT",
        "properties": {
            "courses": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "name": { "type": "STRING" },
                        "day": { "type": "INTEGER" },
                        "session": { "type": "STRING", "enum": ["morning", "afternoon", "evening"] },
                        "start": { "type": "STRING" },
                        "end": { "type": "STRING" },
                        "note": { "type": "STRING" }
                    },
                    "required": ["name", "day", "session", "start", "end"]
                }
            }
        },
        "required": ["courses"]
    })
}

async fn post(
    client: &reqwest::Client,
    url: &str,
    key: &str,
    body: &Value,
) -> Result<(u16, String), String> {
    let resp = client
        .post(url)
        .header("x-goog-api-key", key)
        .json(body)
        .send()
        .await
        .map_err(|e| format!("Không kết nối được Gemini: {e}"))?;
    let status = resp.status().as_u16();
    let text = resp
        .text()
        .await
        .map_err(|e| format!("Lỗi đọc phản hồi từ Gemini: {e}"))?;
    Ok((status, text))
}

fn api_error(status: u16, text: &str) -> String {
    let msg = serde_json::from_str::<Value>(text)
        .ok()
        .and_then(|v| v["error"]["message"].as_str().map(String::from))
        .unwrap_or_else(|| text.chars().take(300).collect());
    format!("Gemini trả về lỗi {status}: {msg}")
}

fn norm_time(s: &str) -> Option<String> {
    let cleaned = s.trim().replace(['h', 'H', '.'], ":");
    let mut it = cleaned.split(':');
    let h: u32 = it.next()?.trim().parse().ok()?;
    let m: u32 = match it.next() {
        Some(x) if !x.trim().is_empty() => x.trim().parse().ok()?,
        _ => 0,
    };
    if h < 24 && m < 60 {
        Some(format!("{h:02}:{m:02}"))
    } else {
        None
    }
}

fn add_minutes(t: &str, add: u32) -> String {
    let h: u32 = t[0..2].parse().unwrap_or(0);
    let m: u32 = t[3..5].parse().unwrap_or(0);
    let total = (h * 60 + m + add).min(23 * 60 + 59);
    format!("{:02}:{:02}", total / 60, total % 60)
}

fn session_from_start(t: &str) -> &'static str {
    let h: u32 = t[0..2].parse().unwrap_or(7);
    if h < 12 {
        "morning"
    } else if h < 18 {
        "afternoon"
    } else {
        "evening"
    }
}

fn parse_courses(raw: &str) -> Result<Vec<Course>, String> {
    let cleaned = raw
        .trim()
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim();
    let v: Value = serde_json::from_str(cleaned)
        .map_err(|e| format!("Không đọc được kết quả JSON từ AI: {e}"))?;
    let items = if v.is_array() {
        v.as_array().cloned().unwrap_or_default()
    } else {
        v["courses"].as_array().cloned().unwrap_or_default()
    };

    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);

    let mut courses = Vec::new();
    for (i, it) in items.iter().enumerate() {
        let name = it["name"].as_str().unwrap_or("").trim().to_string();
        let day = it["day"].as_i64().unwrap_or(-1);
        if name.is_empty() || !(0..=6).contains(&day) {
            continue;
        }
        let declared = it["session"].as_str().unwrap_or("");
        let default_start = match declared {
            "afternoon" => "13:00",
            "evening" => "18:00",
            _ => "07:00",
        };
        let start = it["start"]
            .as_str()
            .and_then(norm_time)
            .unwrap_or_else(|| default_start.to_string());
        let end = it["end"]
            .as_str()
            .and_then(norm_time)
            .filter(|e| e.as_str() > start.as_str())
            .unwrap_or_else(|| add_minutes(&start, 45));
        let session = match declared {
            "morning" | "afternoon" | "evening" => declared,
            _ => session_from_start(&start),
        };
        courses.push(Course {
            id: format!("m{nanos}-{i}"),
            name,
            day: day as u8,
            session: session.to_string(),
            start,
            end,
            kind: "main".into(),
            pinned: false,
            note: it["note"].as_str().unwrap_or("").trim().to_string(),
        });
    }

    if courses.is_empty() {
        return Err(
            "AI không tìm thấy môn học nào trong file. Hãy thử mô tả rõ hơn trong ô câu lệnh.".into(),
        );
    }
    Ok(courses)
}

pub async fn call_gemini(
    api_key: &str,
    model: &str,
    prompt: &str,
    table: &str,
) -> Result<Vec<Course>, String> {
    let model = model.trim().trim_start_matches("models/");
    let url = format!("https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent");

    let user_text = format!(
        "Câu lệnh của người dùng:\n{prompt}\n\nDữ liệu Excel (mỗi dòng là một hàng, các ô cách nhau bằng \" | \"):\n{table}"
    );

    let mut body = json!({
        "systemInstruction": { "parts": [{ "text": SYSTEM_PROMPT }] },
        "contents": [{ "role": "user", "parts": [{ "text": user_text }] }],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": schema(),
            "temperature": 0.1,
            "thinkingConfig": { "thinkingBudget": 0 }
        }
    });

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(120))
        .build()
        .map_err(|e| e.to_string())?;

    // Thử tắt "suy nghĩ" để nhanh nhất. Model nào không hỗ trợ sẽ báo 400 → gửi lại không kèm tham số này.
    let (mut status, mut text) = post(&client, &url, api_key, &body).await?;
    let lower = text.to_lowercase();
    if status == 400 && (lower.contains("think") || lower.contains("budget")) {
        if let Some(g) = body["generationConfig"].as_object_mut() {
            g.remove("thinkingConfig");
        }
        let retry = post(&client, &url, api_key, &body).await?;
        status = retry.0;
        text = retry.1;
    }
    if !(200..300).contains(&status) {
        return Err(api_error(status, &text));
    }

    let v: Value = serde_json::from_str(&text).map_err(|e| format!("Phản hồi Gemini không hợp lệ: {e}"))?;
    let parts = v["candidates"][0]["content"]["parts"]
        .as_array()
        .ok_or_else(|| {
            let reason = v["promptFeedback"]["blockReason"].as_str().unwrap_or("không rõ lý do");
            format!("Gemini không trả về nội dung ({reason}).")
        })?;

    let mut out = String::new();
    for p in parts {
        if p["thought"].as_bool() == Some(true) {
            continue;
        }
        if let Some(t) = p["text"].as_str() {
            out.push_str(t);
        }
    }
    parse_courses(&out)
}
