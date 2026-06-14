import { Link } from "@inertiajs/react";
import { cn } from "@/lib/utils";

/**
 * elev8-merk voor de klantkant. Christhepher's klanten kennen "elev8 lift",
 * dus dat tonen we i.p.v. de interne productnaam UrbanLift.
 */
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
        "inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/30",
        className
      )}
    >
      <span className="text-[20px] font-extrabold tracking-tight text-navy">
        elev8
      </span>
      <span className="rounded-md bg-navy px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
        lift
      </span>
    </Link>
  );
}
