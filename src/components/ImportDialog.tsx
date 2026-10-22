import { useState } from "react";
import { open as pickFile } from "@tauri-apps/plugin-dialog";
import { FileSpreadsheet, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api, errorMessage } from "@/lib/api";
import type { Course, Settings } from "@/types";

interface Props {
  open: boolean;
  settings: Settings;
  onOpenChange: (open: boolean) => void;
  onApply: (courses: Course[], replaceMain: boolean, prompt: string) => void;
  onOpenSettings: () => void;
}

export function ImportDialog({ open, settings, onOpenChange, onApply, onOpenSettings }: Props) {
  const [busy, setBusy] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (busy && !o) return;
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <ImportForm
          settings={settings}
          busy={busy}
          setBusy={setBusy}
          onApply={onApply}
          onOpenSettings={() => {
            onOpenChange(false);
            onOpenSettings();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function ImportForm({
  settings,
  busy,
  setBusy,
  onApply,
  onOpenSettings,
}: {
  settings: Settings;
  busy: boolean;
  setBusy: (b: boolean) => void;
  onApply: Props["onApply"];
  onOpenSettings: () => void;
}) {
  const [path, setPath] = useState("");
  const [prompt, setPrompt] = useState("");
  const [replace, setReplace] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fileName = path ? (path.split(/[\\/]/).pop() ?? path) : "";
  const remembered = settings.lastPrompt.trim();

  const choose = async () => {
    try {
      const picked = await pickFile({
        multiple: false,
        directory: false,
        filters: [{ name: "Excel", extensions: ["xlsx", "xls", "xlsm"] }],
      });
      if (typeof picked === "string") {
        setPath(picked);
        setError(null);
      }
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const run = async () => {
    if (!path || busy) return;
    const effective = prompt.trim() || remembered;
    setBusy(true);
    setError(null);
    try {
      const courses = await api.importExcel(path, effective);
      onApply(courses, replace, effective);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const needsSettings = error !== null && /API Key|model/i.test(error);

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Nhập thời khóa biểu từ Excel</DialogTitle>
        <DialogDescription>
          AI đọc file và xếp từng môn vào đúng thứ, buổi và khung giờ.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={choose}
          disabled={busy}
          className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-400/60 bg-white/40 p-4 text-left outline-none transition-colors hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-brand-500/70 disabled:opacity-60 dark:border-white/20 dark:bg-white/5 dark:hover:bg-white/10"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600/15 text-brand-700 dark:text-brand-300">
            <FileSpreadsheet className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{fileName || "Chọn file Excel"}</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              {fileName ? "Bấm để chọn file khác" : "Hỗ trợ .xlsx, .xls, .xlsm"}
            </span>
          </span>
        </button>

        <Field
          label="Câu lệnh cho AI"
          hint={
            remembered
              ? `Để trống để dùng lại câu lệnh gần nhất: "${remembered.length > 140 ? remembered.slice(0, 140) + "…" : remembered}"`
              : "Để trống để AI tự sắp xếp toàn bộ môn trong file."
          }
        >
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={busy}
            placeholder="Ví dụ: Chỉ lấy lớp 11A2. Tiết 1 đến tiết 5 là buổi sáng, bắt đầu 7h00, mỗi tiết 45 phút."
          />
        </Field>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Thay thế các môn chính khóa hiện có</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Môn đã cố định và môn học thêm luôn được giữ lại.
            </p>
          </div>
          <Switch checked={replace} onCheckedChange={setReplace} disabled={busy} aria-label="Thay thế môn chính khóa" />
        </div>

        {error && (
          <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm leading-relaxed text-rose-700 dark:text-rose-200">
            <p>{error}</p>
            {needsSettings && (
              <Button size="sm" variant="secondary" className="mt-2.5" onClick={onOpenSettings}>
                Mở Cài đặt
              </Button>
            )}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button onClick={run} disabled={!path || busy}>
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              AI đang sắp xếp…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden />
              Sắp xếp bằng AI
            </>
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}
