import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { DAY_NAMES, DAY_SHORT, defaultTimes, sessionFromTime, sessionLabel, toMinutes, uid } from "@/lib/time";
import type { Course, Session } from "@/types";

export interface AddInitial {
  day?: number;
  session?: Session;
}

interface Props {
  open: boolean;
  initial?: AddInitial;
  onOpenChange: (open: boolean) => void;
  onAdd: (courses: Course[]) => void;
}

type TimeRange = { start: string; end: string };

export function AddExtraDialog({ open, initial, onOpenChange, onAdd }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <AddForm
          initial={initial}
          onSubmit={(list) => {
            onAdd(list);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddForm({ initial, onSubmit }: { initial?: AddInitial; onSubmit: (c: Course[]) => void }) {
  const [name, setName] = useState("");
  const [days, setDays] = useState<number[]>(initial?.day !== undefined ? [initial.day] : []);
  const [common, setCommon] = useState<TimeRange>(defaultTimes(initial?.session));
  const [overrides, setOverrides] = useState<Record<number, TimeRange>>({});
  const [pinned, setPinned] = useState(false);

  const timeOf = (d: number): TimeRange => overrides[d] ?? common;

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)));

  // Đổi giờ chung sẽ áp dụng lại cho mọi ngày đã chọn.
  const changeCommon = (patch: Partial<TimeRange>) => {
    setCommon((c) => ({ ...c, ...patch }));
    setOverrides({});
  };

  const changeDay = (d: number, patch: Partial<TimeRange>) =>
    setOverrides((o) => ({ ...o, [d]: { ...timeOf(d), ...patch } }));

  const hasBadTime = days.some((d) => toMinutes(timeOf(d).end) <= toMinutes(timeOf(d).start));
  const canSubmit = name.trim().length > 0 && days.length > 0 && !hasBadTime;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(
      days.map((d) => {
        const t = timeOf(d);
        return {
          id: uid(),
          name: name.trim(),
          day: d,
          session: sessionFromTime(t.start),
          start: t.start,
          end: t.end,
          kind: "extra" as const,
          pinned,
          note: "",
        };
      }),
    );
  };

  return (
    <form onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>Thêm môn học thêm</DialogTitle>
        <DialogDescription>
          Chọn nhiều thứ cùng lúc để tạo lịch hàng loạt. Buổi sẽ tự xác định theo giờ bắt đầu.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <Field label="Tên môn">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Toán nâng cao, Tự học Tiếng Anh"
            autoFocus
          />
        </Field>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300">Các thứ trong tuần</span>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setDays([0, 1, 2, 3, 4])}>
                Thứ 2 đến Thứ 6
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDays([0, 1, 2, 3, 4, 5, 6])}>
                Cả tuần
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDays([])}>
                Bỏ chọn
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Chọn các thứ">
            {DAY_SHORT.map((label, d) => {
              const on = days.includes(d);
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={on}
                  aria-label={DAY_NAMES[d]}
                  onClick={() => toggleDay(d)}
                  className={cn(
                    "h-10 rounded-xl border text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-500/70",
                    on
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-slate-300/70 bg-white/50 text-slate-600 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-300/60 bg-white/40 p-3.5 dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-medium">Giờ chung cho các ngày đã chọn</p>
          <div className="mt-2.5 grid grid-cols-2 gap-3">
            <Field label="Bắt đầu">
              <Input type="time" value={common.start} onChange={(e) => changeCommon({ start: e.target.value })} />
            </Field>
            <Field label="Kết thúc">
              <Input type="time" value={common.end} onChange={(e) => changeCommon({ end: e.target.value })} />
            </Field>
          </div>

          {days.length > 0 && (
            <div className="mt-4 flex flex-col gap-2 border-t border-slate-300/50 pt-3.5 dark:border-white/10">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cần ngày nào khác giờ chung thì chỉnh riêng ở đây.
              </p>
              {days.map((d) => {
                const t = timeOf(d);
                const bad = toMinutes(t.end) <= toMinutes(t.start);
                return (
                  <div key={d} className="grid grid-cols-[92px_1fr_1fr] items-center gap-2">
                    <div>
                      <p className="text-sm font-medium">{DAY_NAMES[d]}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Buổi {sessionLabel(sessionFromTime(t.start)).toLowerCase()}</p>
                    </div>
                    <Input
                      type="time"
                      aria-label={`Giờ bắt đầu ${DAY_NAMES[d]}`}
                      value={t.start}
                      onChange={(e) => changeDay(d, { start: e.target.value })}
                      className="h-9"
                    />
                    <Input
                      type="time"
                      aria-label={`Giờ kết thúc ${DAY_NAMES[d]}`}
                      value={t.end}
                      onChange={(e) => changeDay(d, { end: e.target.value })}
                      className={cn("h-9", bad && "border-rose-500/70")}
                    />
                  </div>
                );
              })}
              {hasBadTime && (
                <p className="text-xs text-rose-600 dark:text-rose-300">Giờ kết thúc phải sau giờ bắt đầu ở mọi ngày.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Cố định qua các tuần</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Không bị xóa lúc 21h00 Thứ 7 và không bị Reset.</p>
          </div>
          <Switch checked={pinned} onCheckedChange={setPinned} aria-label="Cố định qua các tuần" />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={!canSubmit}>
          {days.length > 1 ? `Thêm ${days.length} lịch học` : "Thêm lịch học"}
        </Button>
      </DialogFooter>
    </form>
  );
}
