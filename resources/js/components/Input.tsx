import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const CustomerInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-12 w-full rounded-xl border border-slate-200 bg-paper px-4 text-[15px] text-ink placeholder:text-slate-500",
      "transition-colors hover:border-slate-300",
      "focus:outline-none focus:border-blue focus:ring-2 focus:ring-blue/15",
      className
    )}
    {...props}
  />
));
CustomerInput.displayName = "CustomerInput";

export const CustomerTextarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[100px] w-full rounded-xl border border-slate-200 bg-paper px-4 py-3 text-[15px] text-ink placeholder:text-slate-500",
      "transition-colors hover:border-slate-300 resize-y",
      "focus:outline-none focus:border-blue focus:ring-2 focus:ring-blue/15",
      className
    )}
    {...props}
  />
));
CustomerTextarea.displayName = "CustomerTextarea";

export function CustomerLabel({
  children,
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-[13px] font-semibold text-navy", className)}
      {...props}
    >
      {children}
    </label>
  );
}
