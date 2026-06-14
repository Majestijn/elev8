import { Link } from "@inertiajs/react";
import { cn } from "@/lib/utils";

/**
 * Minimalistisch UrbanLift-logo: een pijl omhoog op een platform — een lift
 * die omhoog tilt. Eén blauw vlak, witte lijntekening.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[60%] w-[60%]"
        fill="none"
        stroke="white"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 4v11" />
        <path d="M7.5 8.5 12 4l4.5 4.5" />
        <path d="M5 20h14" />
      </svg>
    </span>
  );
}

/** UrbanLift-wordmerk voor de klantkant (klikbaar, terug naar home). */
export function Brand({
  className,
  to = "/",
}: {
  className?: string;
  to?: string;
}) {
  return (
    <Link
      href={to}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/30",
        className
      )}
    >
      <LogoMark />
      <span className="text-[19px] font-extrabold tracking-tight text-navy">
        Urban<span className="text-blue">Lift</span>
      </span>
    </Link>
  );
}
