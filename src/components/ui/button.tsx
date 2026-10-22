import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-500/70 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-brand-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-brand-700",
        secondary:
          "border border-white/60 bg-white/60 text-slate-800 hover:bg-white/80 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15",
        ghost: "text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10",
        destructive: "bg-rose-600 text-white hover:bg-rose-700",
        outlineDanger:
          "border border-rose-500/40 text-rose-600 hover:bg-rose-500/10 dark:text-rose-300",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-[13px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? "button")}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
