import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Backdrop } from "@/components/Backdrop";
import { Sidebar } from "@/components/Sidebar";
import { WeekGrid } from "@/components/WeekGrid";
import { CourseDialog } from "@/components/CourseDialog";
import { AddExtraDialog, type AddInitial } from "@/components/AddExtraDialog";
import { ImportDialog } from "@/components/ImportDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import { ReminderDialog } from "@/components/ReminderDialog";
import { useConfirm } from "@/components/ConfirmProvider";
import { useAppState, useNow } from "@/hooks/useAppState";
import { api } from "@/lib/api";
import { spring } from "@/lib/motion";
import { DAY_NAMES, dayIndex, fmtDM, sessionLabel, uid, weekDates } from "@/lib/time";
import type { Course, Reminder, Session, Settings } from "@/types";

export default function App() {
  const { state, mutate } = useAppState();
  const confirm = useConfirm();
  const now = useNow(30_000);

  const [editing, setEditing] = useState<Course | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addInitial, setAddInitial] = useState<AddInitial | undefined>();
  const [importOpen, setImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const readyCalled = useRef(false);

  const theme = state?.settings.theme ?? "dark";

  const notify = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  // Theme: class "dark" trên <html> + đồng bộ màu thanh tiêu đề cửa sổ
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    getCurrentWindow()
      .setTheme(theme)
      .catch(() => undefined);
  }, [theme]);

  // Cửa sổ chỉ hiện sau khi dữ liệu đã tải xong để không bị nháy trắng
  useEffect(() => {
    if (state && !readyCalled.current) {
      readyCalled.current = true;
      requestAnimationFrame(() => requestAnimationFrame(() => void api.appReady()));
    }
  }, [state]);

  // Nhắc nhở do Rust bắn ra (20h30 hằng ngày, 22h30 Chủ Nhật)
  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | undefined;
    const seen = new Set<string>();
    const push = (r: Reminder) => {
      if (seen.has(r.id)) return;
      seen.add(r.id);
      setReminders((q) => (q.some((x) => x.id === r.id) ? q : [...q, r]));
    };

    api.takePendingReminders().then((list) => !cancelled && list.forEach(push));
    listen<Reminder>("reminder", (e) => {
      push(e.payload);
      void api.takePendingReminders();
    }).then((fn) => {
      if (cancelled) fn();
      else unlisten = fn;
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  if (!state) return <Backdrop />;

  const { courses, todos, settings } = state;
  const todayIdx = dayIndex(now);
  const dates = weekDates(now);
  const mainCount = courses.filter((c) => c.kind === "main").length;
  const extraCount = courses.length - mainCount;
  const pinnedCount = courses.filter((c) => c.pinned).length;

  // ---------- Môn học ----------
  const togglePin = (id: string) =>
    mutate((s) => ({ ...s, courses: s.courses.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)) }));

  const saveCourse = (c: Course) => {
    mutate((s) => ({ ...s, courses: s.courses.map((x) => (x.id === c.id ? c : x)) }));
    setEditing(null);
  };

  const deleteCourse = async (c: Course) => {
    const ok = await confirm({
      title: `Xóa môn "${c.name}"?`,
      description: `${DAY_NAMES[c.day]}, buổi ${sessionLabel(c.session).toLowerCase()}, ${c.start}–${c.end}. Thao tác này không thể hoàn tác.`,
      confirmText: "Xóa môn",
    });
    if (!ok) return;
    mutate((s) => ({ ...s, courses: s.courses.filter((x) => x.id !== c.id) }));
    setEditing(null);
  };

  const clearSession = async (day: number, session: Session) => {
    const ids = courses.filter((c) => c.day === day && c.session === session).map((c) => c.id);
    if (ids.length === 0) return;
    const ok = await confirm({
      title: `Xóa ${ids.length} môn buổi ${sessionLabel(session).toLowerCase()} ${DAY_NAMES[day]}?`,
      description: "Tất cả môn trong buổi này sẽ bị xóa, kể cả môn đã cố định. Thao tác này không thể hoàn tác.",
      confirmText: "Xóa tất cả",
    });
    if (!ok) return;
    mutate((s) => ({ ...s, courses: s.courses.filter((c) => !ids.includes(c.id)) }));
  };

  const resetAll = async () => {
    const removable = courses.filter((c) => !c.pinned).length;
    if (removable === 0) {
      notify("Không có môn nào để xóa. Các môn cố định được giữ nguyên.");
      return;
    }
    const ok = await confirm({
      title: "Reset toàn bộ thời khóa biểu?",
      description: `Xóa ${removable} môn trên bảng.${pinnedCount > 0 ? ` ${pinnedCount} môn cố định sẽ được giữ lại.` : ""} Thao tác này không thể hoàn tác.`,
      confirmText: "Reset",
    });
    if (!ok) return;
    mutate((s) => ({ ...s, courses: s.courses.filter((c) => c.pinned) }));
  };

  const addCourses = (list: Course[]) => {
    mutate((s) => ({ ...s, courses: [...s.courses, ...list] }));
    notify(list.length > 1 ? `Đã thêm ${list.length} lịch học.` : "Đã thêm lịch học.");
  };

  const openAdd = (initial?: AddInitial) => {
    setAddInitial(initial);
    setAddOpen(true);
  };

  const applyImport = (list: Course[], replaceMain: boolean, prompt: string) => {
    mutate((s) => ({
      ...s,
      courses: [...(replaceMain ? s.courses.filter((c) => c.kind !== "main" || c.pinned) : s.courses), ...list],
      settings: { ...s.settings, lastPrompt: prompt },
    }));
    setImportOpen(false);
    notify(`AI đã sắp xếp ${list.length} môn vào thời khóa biểu.`);
  };

  const saveSettings = (patch: Pick<Settings, "apiKey" | "model" | "lastPrompt">) =>
    mutate((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

  const toggleTheme = () =>
    mutate((s) => ({ ...s, settings: { ...s.settings, theme: s.settings.theme === "dark" ? "light" : "dark" } }));

  // ---------- To-do ----------
  const addTodo = (day: number, text: string) =>
    mutate((s) => ({
      ...s,
      todos: s.todos.map((list, i) => (i === day ? [...list, { id: uid(), text, done: false }] : list)),
    }));

  const toggleTodo = (day: number, id: string) =>
    mutate((s) => ({
      ...s,
      todos: s.todos.map((list, i) => (i === day ? list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) : list)),
    }));

  const removeTodo = (day: number, id: string) =>
    mutate((s) => ({
      ...s,
      todos: s.todos.map((list, i) => (i === day ? list.filter((t) => t.id !== id) : list)),
    }));

  return (
    <div className="relative h-full">
      <Backdrop />

      <div className="relative z-10 flex h-full gap-4 p-4">
        <Sidebar
          courses={courses}
          theme={theme}
          now={now}
          onImport={() => setImportOpen(true)}
          onAddExtra={() => openAdd()}
          onSettings={() => setSettingsOpen(true)}
          onReset={resetAll}
          onToggleTheme={toggleTheme}
        />

        <main className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="glass flex items-center justify-between gap-6 rounded-[28px] px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Tuần {fmtDM(dates[0])} – {fmtDM(dates[6])}
              </h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Hôm nay là {DAY_NAMES[todayIdx]}, {fmtDM(now)}/{now.getFullYear()}
              </p>
            </div>
            <p className="max-w-[420px] text-right text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {courses.length === 0
                ? "Bảng đang trống. Nhập file Excel để AI sắp xếp hoặc thêm môn học thêm."
                : `${mainCount} môn chính khóa, ${extraCount} môn học thêm, ${pinnedCount} môn cố định`}
            </p>
          </header>

          <div className="min-h-0 flex-1 overflow-auto pb-2">
            <WeekGrid
              courses={courses}
              todos={todos}
              todayIdx={todayIdx}
              dates={dates}
              onEdit={setEditing}
              onTogglePin={togglePin}
              onAddAt={(day, session) => openAdd({ day, session })}
              onClearSession={clearSession}
              onAddTodo={addTodo}
              onToggleTodo={toggleTodo}
              onRemoveTodo={removeTodo}
            />
          </div>
        </main>
      </div>

      <CourseDialog course={editing} onClose={() => setEditing(null)} onSave={saveCourse} onDelete={deleteCourse} />
      <AddExtraDialog open={addOpen} initial={addInitial} onOpenChange={setAddOpen} onAdd={addCourses} />
      <ImportDialog
        open={importOpen}
        settings={settings}
        onOpenChange={setImportOpen}
        onApply={applyImport}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <SettingsDialog open={settingsOpen} settings={settings} onOpenChange={setSettingsOpen} onSave={saveSettings} />
      <ReminderDialog
        reminder={reminders[0] ?? null}
        onDismiss={() => setReminders((q) => q.slice(1))}
        onImport={() => setImportOpen(true)}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            role="status"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={spring}
            className="glass-panel pointer-events-none fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-2xl px-5 py-3 text-sm font-medium"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
