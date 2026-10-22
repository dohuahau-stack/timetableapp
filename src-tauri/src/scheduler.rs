use chrono::{DateTime, Datelike, Duration, Local, NaiveDate, TimeZone, Timelike, Weekday};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_notification::NotificationExt;

use crate::state::{lock, AppState, Course, Reminder, Store};

const DAY_NAMES: [&str; 7] = [
    "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật",
];

fn session_label(s: &str) -> &'static str {
    match s {
        "morning" => "Sáng",
        "afternoon" => "Chiều",
        _ => "Tối",
    }
}

fn session_order(s: &str) -> u8 {
    match s {
        "morning" => 0,
        "afternoon" => 1,
        _ => 2,
    }
}

fn at(date: NaiveDate, h: u32, m: u32) -> Option<DateTime<Local>> {
    Local
        .from_local_datetime(&date.and_hms_opt(h, m, 0)?)
        .earliest()
}

/// Mốc 21:00 Thứ 7 gần nhất (không vượt quá hiện tại).
fn latest_weekly_boundary(now: DateTime<Local>) -> Option<DateTime<Local>> {
    // Thứ 2 = 0 ... Thứ 7 = 5 ... CN = 6
    let days_since_sat = (now.weekday().num_days_from_monday() as i64 + 2) % 7;
    let date = now.date_naive() - Duration::days(days_since_sat);
    let b = at(date, 21, 0)?;
    if b > now {
        at(date - Duration::days(7), 21, 0)
    } else {
        Some(b)
    }
}

/// Mốc 03:00 sáng gần nhất (không vượt quá hiện tại).
fn latest_todo_boundary(now: DateTime<Local>) -> Option<DateTime<Local>> {
    let today = at(now.date_naive(), 3, 0)?;
    if today <= now {
        Some(today)
    } else {
        at(now.date_naive() - Duration::days(1), 3, 0)
    }
}

/// Trả về (meta_đổi, dữ_liệu_đổi). Xóa các môn không cố định sau mỗi 21:00 Thứ 7,
/// kể cả xóa bù khi máy đang tắt đúng thời điểm đó.
fn cleanup_weekly(st: &mut AppState, now: DateTime<Local>) -> (bool, bool) {
    let Some(b) = latest_weekly_boundary(now) else {
        return (false, false);
    };
    let ts = b.timestamp();
    match st.meta.last_weekly_boundary {
        None => {
            st.meta.last_weekly_boundary = Some(ts);
            (true, false)
        }
        Some(last) if last < ts => {
            let before = st.courses.len();
            st.courses.retain(|c| c.pinned);
            st.meta.last_weekly_boundary = Some(ts);
            (true, st.courses.len() != before)
        }
        _ => (false, false),
    }
}

/// Mỗi mốc 03:00 sáng sẽ xóa sạch To-do của ngày hôm trước.
/// Nếu máy tắt nhiều ngày thì xóa bù tất cả các mốc đã bỏ lỡ (tối đa 7).
fn cleanup_todos(st: &mut AppState, now: DateTime<Local>) -> (bool, bool) {
    let Some(t) = latest_todo_boundary(now) else {
        return (false, false);
    };
    let ts = t.timestamp();
    match st.meta.last_todo_boundary {
        None => {
            st.meta.last_todo_boundary = Some(ts);
            (true, false)
        }
        Some(last) if last < ts => {
            let t_date = t.date_naive();
            let span = Local
                .timestamp_opt(last, 0)
                .single()
                .map(|d| (t_date - d.date_naive()).num_days())
                .unwrap_or(7)
                .clamp(1, 7);
            let mut data_changed = false;
            for i in 0..span {
                let cleared = t_date - Duration::days(i + 1);
                let idx = cleared.weekday().num_days_from_monday() as usize;
                if idx < st.todos.len() && !st.todos[idx].is_empty() {
                    st.todos[idx].clear();
                    data_changed = true;
                }
            }
            st.meta.last_todo_boundary = Some(ts);
            (true, data_changed)
        }
        _ => (false, false),
    }
}

fn build_tomorrow(courses: &[Course], date: NaiveDate, id: String) -> Reminder {
    let idx = date.weekday().num_days_from_monday() as u8;
    let mut list: Vec<&Course> = courses.iter().filter(|c| c.day == idx).collect();
    list.sort_by(|a, b| {
        (session_order(&a.session), a.start.as_str()).cmp(&(session_order(&b.session), b.start.as_str()))
    });
    let title = format!(
        "Ngày mai, {} ({:02}/{:02})",
        DAY_NAMES[idx as usize % 7],
        date.day(),
        date.month()
    );
    let lines = if list.is_empty() {
        vec!["Ngày mai bạn không có môn học nào.".to_string()]
    } else {
        list.iter()
            .map(|c| {
                format!(
                    "{} {}–{}: {}",
                    session_label(&c.session),
                    c.start,
                    c.end,
                    c.name
                )
            })
            .collect()
    };
    Reminder {
        id,
        kind: "tomorrow".into(),
        title,
        lines,
    }
}

/// Trả về (meta_đổi, danh_sách_nhắc_nhở).
fn collect_reminders(st: &mut AppState, now: DateTime<Local>) -> (bool, Vec<Reminder>) {
    let mut out = Vec::new();
    let mut changed = false;
    let today = now.date_naive();
    let today_s = today.format("%Y-%m-%d").to_string();
    let minutes = now.hour() * 60 + now.minute();

    if minutes >= 20 * 60 + 30 && st.meta.last_evening_reminder != today_s {
        st.meta.last_evening_reminder = today_s.clone();
        changed = true;
        out.push(build_tomorrow(
            &st.courses,
            today + Duration::days(1),
            format!("tomorrow-{today_s}"),
        ));
    }

    if now.weekday() == Weekday::Sun
        && minutes >= 22 * 60 + 30
        && st.meta.last_sunday_reminder != today_s
    {
        st.meta.last_sunday_reminder = today_s.clone();
        changed = true;
        out.push(Reminder {
            id: format!("sunday-{today_s}"),
            kind: "sunday".into(),
            title: "Đến lúc điền thời khóa biểu tuần mới".into(),
            lines: vec![
                "Tải file Excel lên để AI sắp xếp, hoặc thêm môn học cho tuần sau.".into(),
            ],
        });
    }
    (changed, out)
}

pub fn dispatch(app: &AppHandle, r: Reminder) {
    let store = app.state::<Store>();
    lock(&store.pending).push(r.clone());
    let _ = app
        .notification()
        .builder()
        .title(r.title.clone())
        .body(r.lines.join("\n"))
        .show();
    let _ = app.emit("reminder", r);
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.unminimize();
        let _ = w.show();
    }
}

/// Gửi thử thông báo "ngày mai học gì" ngay lập tức (không ảnh hưởng lịch nhắc thật).
pub fn fire_test(app: &AppHandle) {
    let store = app.state::<Store>();
    let tomorrow = Local::now().date_naive() + Duration::days(1);
    let r = {
        let st = lock(&store.state);
        build_tomorrow(
            &st.courses,
            tomorrow,
            format!("test-{}", Local::now().timestamp_millis()),
        )
    };
    dispatch(app, r);
}

fn tick(app: &AppHandle) {
    let store = app.state::<Store>();
    let now = Local::now();

    let (snapshot, reminders) = {
        let mut st = lock(&store.state);
        let (m1, d1) = cleanup_weekly(&mut st, now);
        let (m2, d2) = cleanup_todos(&mut st, now);
        let (m3, reminders) = collect_reminders(&mut st, now);
        if m1 || m2 || m3 {
            store.persist(&st);
        }
        let snapshot = if d1 || d2 { Some(st.clone()) } else { None };
        (snapshot, reminders)
    };

    if let Some(s) = snapshot {
        let _ = app.emit("state-updated", s);
    }
    for r in reminders {
        dispatch(app, r);
    }
}

/// Chạy nền mỗi 20 giây: dọn dẹp bù, xóa theo mốc giờ và bắn nhắc nhở.
pub fn start(app: AppHandle) {
    std::thread::spawn(move || loop {
        tick(&app);
        std::thread::sleep(std::time::Duration::from_secs(20));
    });
}
