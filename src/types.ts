export type Session = "morning" | "afternoon" | "evening";
export type CourseKind = "main" | "extra";
export type Theme = "light" | "dark";

export interface Course {
  id: string;
  name: string;
  /** 0 = Thứ 2 ... 6 = Chủ Nhật */
  day: number;
  session: Session;
  start: string;
  end: string;
  kind: CourseKind;
  pinned: boolean;
  note: string;
}

export interface Todo {
  id: string;
  text: string;
  done: boolean;
}

export interface Settings {
  apiKey: string;
  model: string;
  lastPrompt: string;
  theme: Theme;
}

export interface Meta {
  lastWeeklyBoundary: number | null;
  lastTodoBoundary: number | null;
  lastEveningReminder: string;
  lastSundayReminder: string;
}

export interface AppState {
  courses: Course[];
  /** 7 phần tử, chỉ số 0 = Thứ 2 */
  todos: Todo[][];
  settings: Settings;
  meta: Meta;
}

export interface Reminder {
  id: string;
  kind: "tomorrow" | "sunday";
  title: string;
  lines: string[];
}
