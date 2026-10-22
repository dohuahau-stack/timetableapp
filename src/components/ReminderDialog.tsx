import { useRef } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Reminder } from "@/types";

interface Props {
  reminder: Reminder | null;
  onDismiss: () => void;
  onImport: () => void;
}

export function ReminderDialog({ reminder, onDismiss, onImport }: Props) {
  const last = useRef<Reminder | null>(null);
  if (reminder) last.current = reminder;
  const shown = last.current;

  return (
    <Dialog open={reminder !== null} onOpenChange={(o) => !o && onDismiss()}>
      <DialogContent>
        {shown && (
          <>
            <DialogHeader>
              <div className="mb-1 grid h-11 w-11 place-items-center rounded-2xl bg-brand-600/15 text-brand-700 dark:text-brand-300">
                <Bell className="h-5 w-5" aria-hidden />
              </div>
              <DialogTitle>{shown.title}</DialogTitle>
              <DialogDescription className="sr-only">Nhắc nhở từ thời khóa biểu</DialogDescription>
            </DialogHeader>
            <ul className="flex flex-col gap-2">
              {shown.lines.map((line, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-slate-300/50 bg-white/50 px-3.5 py-2.5 text-sm leading-relaxed dark:border-white/10 dark:bg-white/5"
                >
                  {line}
                </li>
              ))}
            </ul>
            <DialogFooter>
              {shown.kind === "sunday" && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    onDismiss();
                    onImport();
                  }}
                >
                  Nhập từ Excel
                </Button>
              )}
              <Button onClick={onDismiss}>Đã hiểu</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
