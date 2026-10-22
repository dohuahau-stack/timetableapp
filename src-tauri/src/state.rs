use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
    sync::{Mutex, MutexGuard},
};

/// Khóa Mutex, bỏ qua trạng thái "poisoned" để app không bao giờ bị kẹt.
pub fn lock<T>(m: &Mutex<T>) -> MutexGuard<'_, T> {
    m.lock().unwrap_or_else(|e| e.into_inner())
}

#[derive(Serialize, Deserialize, Clone, Default, Debug)]
#[serde(rename_all = "camelCase", default)]
pub struct Course {
    pub id: String,
    pub name: String,
    /// 0 = Thứ 2 ... 5 = Thứ 7, 6 = Chủ Nhật
    pub day: u8,
    /// "morning" | "afternoon" | "evening"
    pub session: String,
    pub start: String,
    pub end: String,
    /// "main" (chính khóa) | "extra" (học thêm)
    pub kind: String,
    pub pinned: bool,
    pub note: String,
}

#[derive(Serialize, Deserialize, Clone, Default, Debug)]
#[serde(rename_all = "camelCase", default)]
pub struct Todo {
    pub id: String,
    pub text: String,
    pub done: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase", default)]
pub struct Settings {
    pub api_key: String,
    pub model: String,
    pub last_prompt: String,
    pub theme: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            api_key: String::new(),
            model: "gemini-2.5-flash".into(),
            last_prompt: String::new(),
            theme: "dark".into(),
        }
    }
}

/// Dữ liệu điều phối của bộ lập lịch. Chỉ Rust được phép ghi, frontend gửi lên sẽ bị bỏ qua.
#[derive(Serialize, Deserialize, Clone, Default, Debug)]
#[serde(rename_all = "camelCase", default)]
pub struct Meta {
    pub last_weekly_boundary: Option<i64>,
    pub last_todo_boundary: Option<i64>,
    pub last_evening_reminder: String,
    pub last_sunday_reminder: String,
}

#[derive(Serialize, Deserialize, Clone, Default, Debug)]
#[serde(rename_all = "camelCase", default)]
pub struct AppState {
    pub courses: Vec<Course>,
    /// 7 phần tử, chỉ số 0 = Thứ 2 ... 6 = Chủ Nhật
    pub todos: Vec<Vec<Todo>>,
    pub settings: Settings,
    pub meta: Meta,
}

impl AppState {
    pub fn normalize(&mut self) {
        self.todos.resize_with(7, Vec::new);
    }
}

#[derive(Serialize, Clone, Debug)]
pub struct Reminder {
    pub id: String,
    pub kind: String,
    pub title: String,
    pub lines: Vec<String>,
}

pub struct Store {
    pub state: Mutex<AppState>,
    pub pending: Mutex<Vec<Reminder>>,
    pub path: PathBuf,
}

impl Store {
    pub fn new(state: AppState, path: PathBuf) -> Self {
        Self {
            state: Mutex::new(state),
            pending: Mutex::new(Vec::new()),
            path,
        }
    }

    /// Ghi nguyên tử: ghi file tạm rồi đổi tên để không bao giờ để lại file hỏng nửa chừng.
    pub fn persist(&self, state: &AppState) {
        let tmp = self.path.with_extension("json.tmp");
        if let Ok(text) = serde_json::to_string_pretty(state) {
            if fs::write(&tmp, text).is_ok() {
                let _ = fs::rename(&tmp, &self.path);
            }
        }
    }
}

pub fn load_state(path: &Path) -> AppState {
    let mut st = match fs::read_to_string(path) {
        Ok(text) => match serde_json::from_str::<AppState>(&text) {
            Ok(s) => s,
            Err(_) => {
                // File hỏng: giữ lại bản sao để không mất dữ liệu vĩnh viễn.
                let _ = fs::copy(path, path.with_extension("corrupt.json"));
                AppState::default()
            }
        },
        Err(_) => AppState::default(),
    };
    st.normalize();
    st
}
