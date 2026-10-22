import { useCallback, useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { api } from "@/lib/api";
import type { AppState } from "@/types";

/**
 * Giữ trạng thái app ở frontend và đồng bộ với Rust.
 * - mutate(): tính trạng thái mới, hiển thị ngay, rồi lưu xuống đĩa qua Rust.
 * - Khi bộ lập lịch của Rust tự dọn dẹp (21h Thứ 7, 3h sáng...), nó gửi sự kiện "state-updated".
 */
export function useAppState() {
  const [state, setState] = useState<AppState | null>(null);
  const ref = useRef<AppState | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | undefined;

    api.getState().then((s) => {
      if (cancelled) return;
      ref.current = s;
      setState(s);
    });

    listen<AppState>("state-updated", (e) => {
      ref.current = e.payload;
      setState(e.payload);
    }).then((fn) => {
      if (cancelled) fn();
      else unlisten = fn;
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  const mutate = useCallback((fn: (s: AppState) => AppState) => {
    const current = ref.current;
    if (!current) return;
    const next = fn(current);
    ref.current = next;
    setState(next);
    api.saveState(next).catch((e) => console.error("Không lưu được dữ liệu:", e));
  }, []);

  return { state, mutate };
}

export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
