/** Nền gradient + các đốm sáng mờ phía sau lớp kính để hiệu ứng Liquid Glass có thứ để khúc xạ. */
export function Backdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden bg-gradient-to-br from-slate-100 via-slate-200/80 to-slate-100 dark:from-[#090D16] dark:via-[#0F172A] dark:to-[#090D16]"
    >
      <div className="absolute -left-24 top-[-10%] h-[520px] w-[520px] rounded-full bg-brand-300/50 blur-3xl dark:bg-brand-500/25" />
      <div className="absolute right-[-8%] top-[16%] h-[460px] w-[460px] rounded-full bg-indigo-300/40 blur-3xl dark:bg-indigo-500/20" />
      <div className="absolute bottom-[-20%] left-[30%] h-[520px] w-[520px] rounded-full bg-sky-300/40 blur-3xl dark:bg-teal-400/15" />
    </div>
  );
}
