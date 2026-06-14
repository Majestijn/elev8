import * as RG from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

export const CustomerRadioGroup = RG.Root;

/**
 * Optie-kaart in Brenger-stijl: rechthoek met blauw icoon links, navy titel,
 * lichte beschrijving. Bij selectie: blauwe border + sky-50 fill.
 */
export function CustomerRadioCard({
  value,
  title,
  description,
  icon,
}: {
  value: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <RG.Item
      value={value}
      className={cn(
        "group relative flex items-center gap-5 rounded-2xl border-2 border-slate-200 bg-paper px-5 py-4 text-left transition-all hover:border-blue/40",
        "data-[state=checked]:border-blue data-[state=checked]:bg-sky-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/30"
      )}
    >
      {icon && (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-blue">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <div className="text-[16px] font-bold leading-tight text-navy">
          {title}
        </div>
        {description && (
          <div className="mt-1 text-[13px] leading-snug text-ink-3">
            {description}
          </div>
        )}
      </div>
      <RG.Indicator className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-blue bg-blue">
        <span className="h-2 w-2 rounded-full bg-paper" />
      </RG.Indicator>
      <span className="hidden h-5 w-5 shrink-0 rounded-full border-2 border-slate-300 group-data-[state=unchecked]:inline-block" />
    </RG.Item>
  );
}
