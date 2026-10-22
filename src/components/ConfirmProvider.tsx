import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  /** Mặc định true: nút xác nhận màu đỏ. */
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false));

export const useConfirm = () => useContext(ConfirmContext);

/** Hộp thoại xác nhận dùng chung (Đồng ý / Hủy) cho mọi thao tác xóa. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const last = useRef<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((o) => {
    return new Promise<boolean>((resolve) => {
      resolver.current?.(false);
      resolver.current = resolve;
      last.current = o;
      setOpts(o);
    });
  }, []);

  const settle = (value: boolean) => {
    const r = resolver.current;
    resolver.current = null;
    r?.(value);
    setOpts(null);
  };

  const shown = opts ?? last.current;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={opts !== null}
        onOpenChange={(o) => {
          if (!o) settle(false);
        }}
      >
        {shown && (
          <AlertDialogContent>
            <AlertDialogTitle>{shown.title}</AlertDialogTitle>
            {shown.description && <AlertDialogDescription>{shown.description}</AlertDialogDescription>}
            <div className="mt-6 flex justify-end gap-2">
              <AlertDialogCancel asChild>
                <Button variant="secondary">Hủy</Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button variant={shown.danger === false ? "default" : "destructive"} onClick={() => settle(true)}>
                  {shown.confirmText ?? "Đồng ý"}
                </Button>
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}
