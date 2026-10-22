import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import type { Todo } from "@/types";

interface Props {
  dayName: string;
  todos: Todo[];
  isToday: boolean;
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export function TodoPanel({ dayName, todos, isToday, onAdd, onToggle, onRemove }: Props) {
  const [text, setText] = useState("");

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onAdd(t);
    setText("");
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.015 }}
      transition={spring}
      className={cn("glass flex min-h-[132px] flex-col gap-2 rounded-2xl p-2.5", isToday && "ring-1 ring-brand-500/40")}
    >
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Thêm việc…"
        aria-label={`Thêm việc cần làm cho ${dayName}`}
        className="h-8 rounded-lg px-2.5 text-[13px]"
      />
      <ul className="flex flex-col gap-1.5">
        {todos.map((t) => (
          <li key={t.id} className="group/item flex items-start gap-2">
            <button
              type="button"
              role="checkbox"
              aria-checked={t.done}
              aria-label={`Đánh dấu "${t.text}"`}
              onClick={() => onToggle(t.id)}
              className={cn(
                "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-500/70",
                t.done
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-400/70 hover:border-brand-500 dark:border-slate-500",
              )}
            >
              {t.done && <Check className="h-3 w-3" strokeWidth={3} />}
            </button>
            <span
              className={cn(
                "min-w-0 flex-1 break-words text-[13px] leading-snug",
                t.done && "text-slate-400 line-through dark:text-slate-500",
              )}
            >
              {t.text}
            </span>
            <button
              type="button"
              aria-label={`Xóa việc "${t.text}"`}
              onClick={() => onRemove(t.id)}
              className="rounded p-0.5 text-slate-400 opacity-0 outline-none transition-opacity hover:text-rose-500 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-brand-500/70 group-hover/item:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
