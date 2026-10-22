import { useRef, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DAY_NAMES, SESSIONS, sessionFromTime, toMinutes } from "@/lib/time";
import type { Course, Session } from "@/types";

interface Props {
  course: Course | null;
  onClose: () => void;
  onSave: (c: Course) => void;
  onDelete: (c: Course) => void;
}

export function CourseDialog({ course, onClose, onSave, onDelete }: Props) {
  // Giữ lại môn cuối cùng để nội dung không biến mất giữa chừng khi hộp thoại đang đóng.
  const last = useRef<Course | null>(null);
  if (course) last.current = course;

  return (
    <Dialog open={course !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        {last.current && (
          <CourseForm key={last.current.id} course={last.current} onSave={onSave} onDelete={onDelete} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CourseForm({
  course,
  onSave,
  onDelete,
}: {
  course: Course;
  onSave: (c: Course) => void;
  onDelete: (c: Course) => void;
}) {
  const [name, setName] = useState(course.name);
  const [day, setDay] = useState(course.day);
  const [session, setSession] = useState<Session>(course.session);
  const [start, setStart] = useState(course.start);
  const [end, setEnd] = useState(course.end);
  const [note, setNote] = useState(course.note);
  const [pinned, setPinned] = useState(course.pinned);

  const badTime = toMinutes(end) <= toMinutes(start);
  const canSave = name.trim().length > 0 && !badTime;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({ ...course, name: name.trim(), day, session, start, end, note: note.trim(), pinned });
  };

  return (
    <form onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>Sửa môn học</DialogTitle>
        <DialogDescription>
          {course.kind === "main" ? "Môn chính khóa." : "Môn học thêm."} Đổi tên, giờ học hoặc chuyển sang ngày khác.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <Field label="Tên môn">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Thứ">
            <Select value={day} onChange={(e) => setDay(Number(e.target.value))}>
              {DAY_NAMES.map((n, i) => (
                <option key={n} value={i}>
                  {n}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Buổi">
            <Select value={session} onChange={(e) => setSession(e.target.value as Session)}>
              {SESSIONS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Giờ bắt đầu">
            <Input
              type="time"
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
                if (e.target.value) setSession(sessionFromTime(e.target.value));
              }}
            />
          </Field>
          <Field label="Giờ kết thúc">
            <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>
        {badTime && <p className="-mt-2 text-xs text-rose-600 dark:text-rose-300">Giờ kết thúc phải sau giờ bắt đầu.</p>}

        <Field label="Ghi chú" hint="Phòng học, giáo viên… (không bắt buộc)">
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-300/60 bg-white/40 p-3.5 dark:border-white/10 dark:bg-white/5">
          <div>
            <p className="text-sm font-medium">Cố định qua các tuần</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Môn cố định không bị xóa lúc 21h00 Thứ 7 và không bị Reset.
            </p>
          </div>
          <Switch checked={pinned} onCheckedChange={setPinned} aria-label="Cố định qua các tuần" />
        </div>
      </div>

      <DialogFooter className="justify-between">
        <Button variant="outlineDanger" onClick={() => onDelete(course)}>
          <Trash2 className="h-4 w-4" aria-hidden />
          Xóa môn
        </Button>
        <Button type="submit" disabled={!canSave}>
          Lưu thay đổi
        </Button>
      </DialogFooter>
    </form>
  );
}
