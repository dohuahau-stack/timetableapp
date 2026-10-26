mod excel_ai;
mod scheduler;
mod state;

use std::fs;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, State, WindowEvent,
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};

use state::{lock, AppState, Course, Reminder, Store};

pub struct LaunchFlags {
    pub minimized: bool,
}

fn show_main(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.unminimize();
        let _ = w.show();
        let _ = w.set_focus();
    }
}

#[tauri::command]
fn get_state(store: State<'_, Store>) -> AppState {
    lock(&store.state).clone()
}

/// Thay thế dữ liệu người dùng (môn học, to-do, cài đặt). Dữ liệu điều phối `meta` luôn do Rust giữ.
#[tauri::command]
fn save_state(store: State<'_, Store>, state: AppState) -> Result<(), String> {
    let mut incoming = state;
    let mut guard = lock(&store.state);
    incoming.meta = guard.meta.clone();
    incoming.normalize();
    store.persist(&incoming);
    *guard = incoming;
    Ok(())
}

#[tauri::command]
fn take_pending_reminders(store: State<'_, Store>) -> Vec<Reminder> {
    std::mem::take(&mut *lock(&store.pending))
}

#[tauri::command]
fn app_ready(app: AppHandle, flags: State<'_, LaunchFlags>) {
    if !flags.minimized {
        show_main(&app);
    }
}

#[tauri::command]
fn test_reminder(app: AppHandle) {
    scheduler::fire_test(&app);
}

#[tauri::command]
async fn import_excel(
    store: State<'_, Store>,
    path: String,
    prompt: String,
) -> Result<Vec<Course>, String> {
    let (key, model) = {
        let st = lock(&store.state);
        (st.settings.api_key.clone(), st.settings.model.clone())
    };
    if key.trim().is_empty() {
        return Err("Chưa có Groq API Key. Mở Cài đặt để nhập key.".into());
    }
    if model.trim().is_empty() {
        return Err("Chưa có tên model. Mở Cài đặt để nhập tên model.".into());
    }

    let table = tauri::async_runtime::spawn_blocking(move || excel_ai::excel_to_text(&path))
        .await
        .map_err(|e| e.to_string())??;

    let prompt = if prompt.trim().is_empty() {
        "Sắp xếp toàn bộ các môn học trong file vào đúng thứ, buổi và khung giờ.".to_string()
    } else {
        prompt
    };

    excel_ai::call_groq(key.trim(), &model, &prompt, &table).await
}

pub fn run() {
    let minimized = std::env::args().any(|a| a == "--minimized");

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            show_main(app);
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .manage(LaunchFlags { minimized })
        .setup(|app| {
            let dir = app.path().app_data_dir()?;
            fs::create_dir_all(&dir)?;
            let path = dir.join("state.json");
            let first_run = !path.exists();
            let loaded = state::load_state(&path);
            app.manage(Store::new(loaded, path));

            // Lần chạy đầu tiên của bản cài đặt: bật tự khởi động cùng Windows.
            if first_run && !cfg!(debug_assertions) {
                let _ = app.autolaunch().enable();
            }

            let show = MenuItem::with_id(app, "show", "Mở Thời Khóa Biểu", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Thoát hoàn toàn", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            let mut tray = TrayIconBuilder::new()
                .tooltip("Thời Khóa Biểu")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => show_main(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main(tray.app_handle());
                    }
                });
            if let Some(icon) = app.default_window_icon() {
                tray = tray.icon(icon.clone());
            }
            tray.build(app)?;

            scheduler::start(app.handle().clone());
            Ok(())
        })
        .on_window_event(|window, event| {
            // Bấm X chỉ ẩn xuống khay hệ thống, app vẫn chạy ngầm để nhắc lịch.
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_state,
            save_state,
            take_pending_reminders,
            app_ready,
            test_reminder,
            import_excel
        ])
        .run(tauri::generate_context!())
        .expect("không thể khởi chạy ứng dụng Tauri");
}
