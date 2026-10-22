import { invoke } from "@tauri-apps/api/core";
import type { AppState, Course, Reminder } from "@/types";

export const api = {
  getState: () => invoke<AppState>("get_state"),
  saveState: (state: AppState) => invoke<void>("save_state", { state }),
  importExcel: (path: string, prompt: string) => invoke<Course[]>("import_excel", { path, prompt }),
  takePendingReminders: () => invoke<Reminder[]>("take_pending_reminders"),
  appReady: () => invoke<void>("app_ready"),
  testReminder: () => invoke<void>("test_reminder"),
};

export function errorMessage(e: unknown): string {
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  return "Đã có lỗi không xác định.";
}
