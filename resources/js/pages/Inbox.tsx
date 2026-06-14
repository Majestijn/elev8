import { useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import {
  ArrowUp,
  Boxes,
  Calendar,
  ClipboardList,
  Image as ImageIcon,
  Info,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  Weight,
} from "lucide-react";
import { LogoMark } from "@/components/Brand";
import { siteConditionTitle } from "@/lib/site-conditions";
import type { Booking, BookingItem } from "@/lib/types";
import { cn, formatDateLong, relativeTime } from "@/lib/utils";

/** De pijplijn: volgorde + label + pill-kleur per status. */
const STATUS_ORDER = [
  "requested",
  "contacted",
  "scheduled",
  "completed",
  "cancelled",
] as const;

const STATUS_META: Record<string, { label: string; pill: string }> = {
  requested: { label: "Nieuw", pill: "bg-sky-100 text-blue" },
  contacted: { label: "Contact gelegd", pill: "bg-amber-100 text-amber-700" },
  scheduled: { label: "Ingepland", pill: "bg-violet-100 text-violet-700" },
  completed: { label: "Afgerond", pill: "bg-green-soft text-green-deep" },
  cancelled: { label: "Geannuleerd", pill: "bg-slate-100 text-slate-500" },
};

export default function Inbox({ bookings }: { bookings: Booking[] }) {
  const [tab, setTab] = useState<string>("requested");

  const sorted = useMemo(
    () => bookings.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [bookings]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of STATUS_ORDER) c[s] = 0;
    for (const b of sorted) c[b.status] = (c[b.status] ?? 0) + 1;
    return c;
  }, [sorted]);

  const list = sorted.filter((b) => b.status === tab);
  const newCount = counts["requested"] ?? 0;

  return (
    <div className="min-h-screen bg-paper">
      <Head title="Aanvragen" />
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[900px] items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <span className="text-[17px] font-extrabold tracking-tight text-navy">
              Urban<span className="text-blue">Lift</span>
            </span>
            <span className="ml-1 text-[13px] font-semibold text-slate-400">
              Aanvragen
            </span>
          </div>
          <button
            onClick={() => router.post("/beheer/logout")}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-blue"
          >
            <LogOut size={15} />
            Uitloggen
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-6 py-8">
        <h1 className="text-[28px] font-bold tracking-tight text-navy">
          Aanvragen
        </h1>
        <p className="mt-1 text-[14px] text-ink-2">
          {newCount === 0
            ? "Geen nieuwe aanvragen op dit moment."
            : `${newCount} nieuwe ${
                newCount === 1 ? "aanvraag" : "aanvragen"
              } om op te pakken.`}
        </p>

        {/* Status-tabs */}
        <div className="mt-6 flex flex-wrap gap-1 border-b border-slate-200">
          {STATUS_ORDER.map((s) => (
            <TabButton
              key={s}
              active={tab === s}
              onClick={() => setTab(s)}
              label={STATUS_META[s].label}
              count={counts[s] ?? 0}
            />
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {list.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <ClipboardList size={28} className="mx-auto text-slate-300" />
              <p className="mt-3 text-[14px] text-ink-2">
                Niets in “{STATUS_META[tab]?.label ?? tab}”.
              </p>
            </div>
          ) : (
            list.map((b) => <RequestCard key={b.id} booking={b} />)
          )}
        </div>
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-[14px] font-semibold transition-colors",
        active
          ? "border-blue text-blue"
          : "border-transparent text-slate-500 hover:text-navy"
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
          active ? "bg-sky-100 text-blue" : "bg-slate-100 text-slate-500"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? {
    label: status,
    pill: "bg-slate-100 text-slate-500",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-bold",
        meta.pill
      )}
    >
      {meta.label}
    </span>
  );
}

function RequestCard({ booking: b }: { booking: Booking }) {
  function setStatus(status: string) {
    if (status === b.status) return;
    router.post(
      `/beheer/aanvragen/${b.id}/status`,
      { status },
      { preserveScroll: true }
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[18px] font-bold text-navy">
              {b.customerName || "Naamloos"}
            </h3>
            <StatusPill status={b.status} />
          </div>
          <div className="mt-1 font-mono text-[12px] text-slate-400">
            {b.code} · {relativeTime(b.createdAt)}
          </div>
        </div>

        <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-500">
          Status
          <select
            value={b.status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-xl border-2 border-slate-200 bg-white px-3 text-[13px] font-semibold text-navy transition-colors hover:border-slate-300 focus:border-blue focus:outline-none"
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 border-t border-slate-100 pt-4 text-[14px] sm:grid-cols-2">
        <Field icon={<Phone size={14} />} label="Telefoon">
          {b.customerPhone ? (
            <a
              href={`tel:${b.customerPhone.replace(/\s/g, "")}`}
              className="font-semibold text-blue hover:underline"
            >
              {b.customerPhone}
            </a>
          ) : (
            "—"
          )}
        </Field>
        <Field icon={<Mail size={14} />} label="E-mail">
          {b.customerEmail ? (
            <a
              href={`mailto:${b.customerEmail}`}
              className="font-semibold text-blue hover:underline"
            >
              {b.customerEmail}
            </a>
          ) : (
            "—"
          )}
        </Field>
        <Field icon={<MapPin size={14} />} label="Adres">
          {[b.street, b.postcode, b.city].filter(Boolean).join(" · ") || "—"}
        </Field>
        <Field icon={<Calendar size={14} />} label="Gewenste datum">
          {formatDateLong(b.date)} · {b.timeSlot}
        </Field>
        <Field icon={<ArrowUp size={14} />} label="Verdieping">
          {b.floor}e verdieping
          {b.heightMeters ? ` · ± ${b.heightMeters} m` : ""}
        </Field>
        <Field icon={<Boxes size={14} />} label="Objecten" className="sm:col-span-2">
          <ul className="space-y-0.5">
            {b.items.map((it, i) => (
              <li key={i}>{itemLine(it)}</li>
            ))}
          </ul>
        </Field>
        <Field icon={<Weight size={14} />} label="Zwaarste object">
          {b.heaviestObjectKg ? `${b.heaviestObjectKg} kg` : "—"}
        </Field>
        <Field icon={<Info size={14} />} label="Bijzonderheden">
          {b.siteConditions.length > 0
            ? b.siteConditions.map((k) => siteConditionTitle(k)).join(" · ")
            : "Geen opgegeven"}
        </Field>
        {b.description && (
          <Field icon={<Package size={14} />} label="Toelichting">
            {b.description}
          </Field>
        )}
        {b.photos.length > 0 && (
          <Field icon={<ImageIcon size={14} />} label="Foto's" className="sm:col-span-2">
            <div className="mt-1 flex flex-wrap gap-2">
              {b.photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  <img
                    src={url}
                    alt={`Foto ${i + 1}`}
                    className="h-20 w-20 rounded-lg border border-slate-200 object-cover transition-opacity hover:opacity-90"
                  />
                </a>
              ))}
            </div>
          </Field>
        )}
      </div>
    </div>
  );
}

/** Formatteer één object voor de inbox, bv. "Piano (180×60×120 cm)". */
function itemLine(it: BookingItem): string {
  const dims = [it.length, it.width, it.height];
  const hasDims = dims.some((d) => d != null);
  const dimStr = hasDims ? ` (${dims.map((d) => d ?? "?").join("×")} cm)` : "";
  return `${it.type}${dimStr}`;
}

function Field({
  icon,
  label,
  children,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          {label}
        </div>
        <div className="text-navy">{children}</div>
      </div>
    </div>
  );
}
