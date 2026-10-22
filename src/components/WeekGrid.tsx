import { Fragment, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { ListTodo, Moon, Plus, Sun, Sunrise, Trash2 } from "lucide-react";
import { CourseCard } from "@/components/CourseCard";
import { TodoPanel } from "@/components/TodoPanel";
import { cn } from "@/lib/utils";
import { DAY_NAMES, SESSIONS, byStart, fmtDM } from "@/lib/time";
import type { Course, Session, Todo } from "@/types";

const SESSION_ICON = { morning: Sunrise, afternoon: Sun, evening: Moon } as const;

interface Props {
  courses: Course[];
  todos: Todo[][];
  todayIdx: number;
  dates: Date[];
  onEdit: (c: Course) => void;
  onTogglePin: (id: string) => void;
  onAddAt: (day: number, session: Session) => void;
  onClearSession: (day: number, session: Session) => void;
  onAddTodo: (day: number, text: string) => void;
  onToggleTodo: (day: number, id: string) => void;
  onRemoveTodo: (day: number, id: string) => void;
}

function CellAction({
  label,
  danger,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "grid h-6 w-6 place-items-center rounded-md text-slate-500 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-500/70 dark:text-slate-400",
        danger
          ? "hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300"
          : "hover:bg-slate-900/5 hover:text-slate-800 dark:hover:bg-white/10 dark:hover:text-slate-100",
      )}
    >
      {children}
    </button>
  );
}

export function WeekGrid(props: Props) {
  const { courses, todos, todayIdx, dates } = props;

  return (
    <div className="grid min-w-[1130px] grid-cols-[84px_repeat(7,minmax(0,1fr))] gap-3">
      <div />
      {DAY_NAMES.map((name, i) => {
        const isToday = i === todayIdx;
        return (
          <div
            key={name}
            className={cn(
              "sticky top-0 z-20 rounded-2xl px-3 py-2 text-center backdrop-blur-xl",
              isToday
                ? "bg-brand-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
                : "bg-slate-100/70 text-slate-700 dark:bg-[#0F172A]/70 dark:text-slate-200",
            )}
          >
            <p className="text-sm font-semibold">{name}</p>
            <p
              className={cn(
                "text-xs tabular-nums",
                isToday ? "text-white/80" : "text-slate-500 dark:text-slate-400",
              )}
            >
              {fmtDM(dates[i])}
            </p>
          </div>
        );
      })}

      {SESSIONS.map((s) => {
        const Icon = SESSION_ICON[s.key];
        return (
          <Fragment key={s.key}>
            <div className="flex flex-col items-center justify-start gap-1.5 pt-4 text-slate-600 dark:text-slate-300">
              <Icon className="h-5 w-5" aria-hidden />
              <span className="text-sm font-medium">{s.label}</span>
            </div>
            {DAY_NAMES.map((_, day) => {
              const items = courses.filter((c) => c.day === day && c.session === s.key).sort(byStart);
              return (
                <div
                  key={day}
                  className={cn(
                    "group flex min-h-[116px] flex-col gap-2 rounded-2xl border p-2",
                    day === todayIdx
                      ? "border-brand-500/40 bg-brand-500/[0.07]"
                      : "border-white/40 bg-white/25 dark:border-white/5 dark:bg-white/[0.03]",
                  )}
                >
                  <AnimatePresence initial={false}>
                    {items.map((c) => (
                      <CourseCard key={c.id} course={c} onEdit={props.onEdit} onTogglePin={props.onTogglePin} />
                    ))}
                  </AnimatePresence>
                  <div className="mt-auto flex h-6 items-center justify-end gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    <CellAction
                      label={`Thêm môn vào buổi ${s.label} ${DAY_NAMES[day]}`}
                      onClick={() => props.onAddAt(day, s.key)}
                    >
                      <Plus className="h-4 w-4" />
                    </CellAction>
                    {items.length > 0 && (
                      <CellAction
                        danger
                        label={`Xóa tất cả môn buổi ${s.label} ${DAY_NAMES[day]}`}
                        onClick={() => props.onClearSession(day, s.key)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </CellAction>
                    )}
                  </div>
                </div>
              );
            })}
          </Fragment>
        );
      })}

      <div className="flex flex-col items-center gap-1.5 pt-4 text-center text-slate-600 dark:text-slate-300">
        <ListTodo className="h-5 w-5" aria-hidden />
        <span className="text-sm font-medium">Việc cần làm</span>
        <span className="px-1 text-[11px] leading-tight text-slate-500 dark:text-slate-400">
          Tự xóa lúc 3h sáng hôm sau
        </span>
      </div>
      {DAY_NAMES.map((name, day) => (
        <TodoPanel
          key={name}
          dayName={name}
          todos={todos[day] ?? []}
          isToday={day === todayIdx}
          onAdd={(t) => props.onAddTodo(day, t)}
          onToggle={(id) => props.onToggleTodo(day, id)}
          onRemove={(id) => props.onRemoveTodo(day, id)}
        />
      ))}
    </div>
  );
}
