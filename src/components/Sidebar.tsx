import { motion } from "framer-motion";
import { CalendarPlus, FileSpreadsheet, Layers, Moon, RotateCcw, Settings, Sparkles, Sun, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { DAY_NAMES, dayIndex, findNextCourse } from "@/lib/time";
import type { Course, Theme } from "@/types";

interface Props {
  courses: Course[];
  theme: Theme;
  now: Date;
  onImport: () => void;
  onAddExtra: () => void;
  onSettings: () => void;
  onReset: () => void;
  onToggleTheme: () => void;
}

function NavButton({
  icon: Icon,
  label,
  onClick,
  variant = "plain",
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "primary" | "plain" | "danger";
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      transition={spring}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-brand-500/70",
        variant === "primary" &&
          "bg-brand-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_6px_18px_rgba(21,116,131,0.35)]",
        variant === "plain" && "text-slate-700 hover:bg-white/60 dark:text-slate-200 dark:hover:bg-white/10",
        variant === "danger" && "text-rose-600 hover:bg-rose-500/10 dark:text-rose-300",
      )}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden />
      {label}
    </motion.button>
  );
}

export function Sidebar({ courses, theme, now, onImport, onAddExtra, onSettings, onReset, onToggleTheme }: Props) {
  const idx = dayIndex(now);
  const progress = Math.min(100, ((idx + (now.getHours() * 60 + now.getMinutes()) / 1440) / 7) * 100);
  const next = findNextCourse(courses, now);

  let nextTitle = "Chưa có môn sắp tới";
  let nextBody = "Nhập file Excel hoặc thêm môn học thêm để bắt đầu.";
  if (next) {
    const when =
      next.offset === 0 ? "Hôm nay" : next.offset === 1 ? "Ngày mai" : DAY_NAMES[next.course.day];
    nextTitle = next.ongoing ? "Đang học" : "Môn kế tiếp";
    nextBody = next.ongoing
      ? `${next.course.name}, đến ${next.course.end}`
      : `${next.course.name}, ${when} lúc ${next.course.start}`;
  }

  return (
    <aside className="glass flex w-[272px] shrink-0 flex-col rounded-[28px] p-4">
      <div className="flex items-center justify-between px-1.5 pt-1">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
            <Layers className="h-5 w-5" aria-hidden />
          </div>
          <span className="text-lg font-semibold leading-tight tracking-tight">Thời khóa biểu</span>
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
          title={theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}
          className="grid h-9 w-9 place-items-center rounded-xl text-slate-600 outline-none transition-colors hover:bg-slate-900/5 focus-visible:ring-2 focus-visible:ring-brand-500/70 dark:text-slate-300 dark:hover:bg-white/10"
        >
          <motion.span
            key={theme}
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            transition={spring}
            className="grid place-items-center"
          >
            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </motion.span>
        </button>
      </div>

      <nav className="mt-7 flex flex-col gap-1.5" aria-label="Thao tác chính">
        <NavButton icon={FileSpreadsheet} label="Nhập từ Excel bằng AI" variant="primary" onClick={onImport} />
        <NavButton icon={CalendarPlus} label="Thêm môn học thêm" onClick={onAddExtra} />
        <NavButton icon={Settings} label="Cài đặt" onClick={onSettings} />
        <NavButton icon={RotateCcw} label="Reset thời khóa biểu" variant="danger" onClick={onReset} />
      </nav>

      <div className="mt-auto flex flex-col gap-3 pt-6">
        <motion.div
          whileHover={{ y: -4, scale: 1.015 }}
          transition={spring}
          className="glass-card rounded-2xl p-4"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400">Tuần này</p>
          <p className="mt-1 text-sm font-semibold">
            {DAY_NAMES[idx]}, ngày thứ {idx + 1} trong 7
          </p>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-label="Tiến độ trong tuần"
          >
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${progress}%` }} />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, scale: 1.015 }}
          transition={spring}
          className="glass-card rounded-2xl p-4"
        >
          <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden />
          <p className="mt-2.5 text-sm font-semibold">{nextTitle}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">{nextBody}</p>
        </motion.div>
      </div>
    </aside>
  );
}
