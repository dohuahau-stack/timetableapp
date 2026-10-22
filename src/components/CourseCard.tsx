import { motion } from "framer-motion";
import { Clock, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import type { Course } from "@/types";

interface Props {
  course: Course;
  onEdit: (c: Course) => void;
  onTogglePin: (id: string) => void;
}

export function CourseCard({ course, onEdit, onTogglePin }: Props) {
  const extra = course.kind === "extra";
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      whileHover={{ y: -4, scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      transition={spring}
      role="button"
      tabIndex={0}
      aria-label={`Sửa môn ${course.name}`}
      onClick={() => onEdit(course)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit(course);
        }
      }}
      className="glass-card relative cursor-pointer rounded-xl py-2.5 pl-4 pr-2 outline-none focus-visible:ring-2 focus-visible:ring-brand-500/70"
    >
      <span
        aria-hidden
        className={cn(
          "absolute bottom-2.5 left-1.5 top-2.5 w-[3px] rounded-full",
          extra ? "bg-indigo-500" : "bg-brand-500",
        )}
      />
      <div className="flex items-start gap-1">
        <p className="min-w-0 flex-1 break-words text-[13px] font-semibold leading-snug">{course.name}</p>
        <button
          type="button"
          aria-pressed={course.pinned}
          aria-label={course.pinned ? "Bỏ cố định môn này" : "Cố định môn này qua các tuần"}
          title={course.pinned ? "Đang cố định. Bấm để bỏ" : "Bấm để cố định qua các tuần"}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(course.id);
          }}
          onKeyDown={(e) => e.stopPropagation()}
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-500/70",
            course.pinned
              ? "bg-brand-600 text-white"
              : "text-slate-400 hover:bg-slate-900/5 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-200",
          )}
        >
          <Pin className={cn("h-3.5 w-3.5", course.pinned && "fill-current")} />
        </button>
      </div>
      <p className="mt-1.5 flex items-center gap-1 text-xs tabular-nums text-slate-600 dark:text-slate-300">
        <Clock className="h-3 w-3" aria-hidden />
        {course.start}–{course.end}
      </p>
      {extra && <p className="mt-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-300">Học thêm</p>}
      {course.note && <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">{course.note}</p>}
    </motion.div>
  );
}
