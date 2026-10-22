import type { Course, Session } from "@/types";

export const DAY_NAMES = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
export const DAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export const SESSIONS: { key: Session; label: string }[] = [
  { key: "morning", label: "Sáng" },
  { key: "afternoon", label: "Chiều" },
  { key: "evening", label: "Tối" },
];

export function sessionLabel(s: Session): string {
  return SESSIONS.find((x) => x.key === s)?.label ?? "";
}

export function toMinutes(t: string): number {
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
}

export function sessionFromTime(t: string): Session {
  const h = Math.floor(toMinutes(t) / 60);
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

export function defaultTimes(session?: Session): { start: string; end: string } {
  if (session === "morning") return { start: "08:00", end: "09:30" };
  if (session === "afternoon") return { start: "14:00", end: "15:30" };
  return { start: "19:00", end: "20:30" };
}

/** Thứ 2 = 0 ... Chủ Nhật = 6 */
export function dayIndex(d: Date = new Date()): number {
  return (d.getDay() + 6) % 7;
}

export function weekDates(d: Date = new Date()): Date[] {
  const idx = dayIndex(d);
  return Array.from({ length: 7 }, (_, i) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - idx + i));
}

export function fmtDM(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function byStart(a: Course, b: Course): number {
  return toMinutes(a.start) - toMinutes(b.start);
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface NextCourse {
  course: Course;
  /** 0 = hôm nay, 1 = ngày mai ... */
  offset: number;
  ongoing: boolean;
}

/** Tìm môn đang học hoặc môn sắp tới gần nhất trong 7 ngày tới. */
export function findNextCourse(courses: Course[], now: Date): NextCourse | null {
  const today = dayIndex(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  for (let offset = 0; offset < 7; offset++) {
    const day = (today + offset) % 7;
    const list = courses.filter((c) => c.day === day).sort(byStart);
    for (const c of list) {
      if (offset === 0) {
        const s = toMinutes(c.start);
        const e = toMinutes(c.end);
        if (nowMin >= s && nowMin < e) return { course: c, offset, ongoing: true };
        if (s > nowMin) return { course: c, offset, ongoing: false };
      } else {
        return { course: c, offset, ongoing: false };
      }
    }
  }
  return null;
}
