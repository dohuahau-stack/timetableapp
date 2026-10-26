import { useEffect, useState, type FormEvent } from "react";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { Bell, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api, errorMessage } from "@/lib/api";
import type { Settings } from "@/types";

interface Props {
  open: boolean;
  settings: Settings;
  onOpenChange: (open: boolean) => void;
  onSave: (patch: Pick<Settings, "apiKey" | "model" | "lastPrompt">) => void;
}

export function SettingsDialog({ open, settings, onOpenChange, onSave }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <SettingsForm
          settings={settings}
          onSave={(p) => {
            onSave(p);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function SettingsForm({ settings, onSave }: { settings: Settings; onSave: Props["onSave"] }) {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [model, setModel] = useState(settings.model);
  const [lastPrompt, setLastPrompt] = useState(settings.lastPrompt);
  const [showKey, setShowKey] = useState(false);
  const [auto, setAuto] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    isEnabled()
      .then(setAuto)
      .catch(() => undefined);
  }, []);

  const toggleAuto = async (value: boolean) => {
    try {
      if (value) await enable();
      else await disable();
      setAuto(value);
      setMessage(null);
    } catch (e) {
      setMessage(`Không đổi được chế độ tự khởi động: ${errorMessage(e)}`);
    }
  };

  const testReminder = async () => {
    try {
      await api.testReminder();
      setMessage("Đã gửi thông báo thử. Nếu không thấy, kiểm tra chế độ Tập trung (Focus) của Windows.");
    } catch (e) {
      setMessage(errorMessage(e));
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave({ apiKey: apiKey.trim(), model: model.trim(), lastPrompt: lastPrompt.trim() });
  };

  return (
    <form onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>Cài đặt</DialogTitle>
        <DialogDescription>Key và model được lưu trên máy này, bạn có thể sửa bất cứ lúc nào.</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <Field label="Groq API Key">
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_…"
              autoComplete="off"
              spellCheck={false}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              aria-label={showKey ? "Ẩn API Key" : "Hiện API Key"}
              className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-slate-500 outline-none hover:bg-slate-900/5 focus-visible:ring-2 focus-visible:ring-brand-500/70 dark:text-slate-400 dark:hover:bg-white/10"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <Field label="Tên model" hint="Mặc định: llama-3.3-70b-versatile. Chỉ đổi khi Groq cho phép model khác.">
          <Input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="llama-3.3-70b-versatile"
            spellCheck={false}
          />
        </Field>

        <Field label="Câu lệnh nhớ gần nhất" hint="Dùng khi bạn gửi file Excel mà để trống ô câu lệnh. Xóa trắng để quên.">
          <Textarea value={lastPrompt} onChange={(e) => setLastPrompt(e.target.value)} className="min-h-[80px]" />
        </Field>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-300/60 bg-white/40 p-3.5 dark:border-white/10 dark:bg-white/5">
          <div>
            <p className="text-sm font-medium">Tự mở khi bật máy</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              App chạy ngầm ở khay hệ thống để nhắc lịch lúc 20h30 mỗi ngày.
            </p>
          </div>
          <Switch checked={auto} onCheckedChange={toggleAuto} aria-label="Tự mở khi bật máy" />
        </div>

        {message && <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{message}</p>}
      </div>

      <DialogFooter className="justify-between">
        <Button variant="secondary" onClick={testReminder}>
          <Bell className="h-4 w-4" aria-hidden />
          Gửi thông báo thử
        </Button>
        <Button type="submit">Lưu cài đặt</Button>
      </DialogFooter>
    </form>
  );
}
