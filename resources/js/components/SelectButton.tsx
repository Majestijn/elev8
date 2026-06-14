/**
 * Toggle-button for time/weight pickers. Brenger style: white default,
 * blue border + light blue fill when active.
 */
export function SelectButton({
  active,
  children,
  onClick,
  className,
  size = "md",
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  size?: "md" | "lg";
}) {
  const heights = {
    md: "h-11 text-[14px]",
    lg: "h-12 text-[15px]",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 font-semibold transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40 " +
        heights[size] +
        " " +
        (active
          ? "border-blue bg-sky-100 text-navy"
          : "border-slate-200 bg-paper text-ink-2 hover:border-blue/40 hover:text-navy") +
        (className ? " " + className : "")
      }
    >
      {children}
    </button>
  );
}
