import { useState } from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import {
  ArrowRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  MapPin,
  Package,
  PackageOpen,
  Phone,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  User,
  Weight,
} from "lucide-react";
import {
  CustomerInput,
  CustomerLabel,
  CustomerTextarea,
} from "@/components/Input";
import { SelectButton } from "@/components/SelectButton";
import { Brand } from "@/components/Brand";
import type { JobType } from "@/lib/types";
import { cn, formatDateLong } from "@/lib/utils";

type Step = 0 | 1 | 2;

const STEP_LABELS = ["Jouw gegevens", "Datum & tijd", "Wat moet er omhoog?"];

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: "Bank", label: "Bank of meubel" },
  { value: "Koelkast", label: "Koelkast" },
  { value: "Wasmachine", label: "Wasmachine of droger" },
  { value: "Volledige verhuizing", label: "Volledige verhuizing" },
  { value: "Piano", label: "Piano of vleugel" },
  { value: "Bouwmaterialen", label: "Bouwmaterialen" },
  { value: "Anders", label: "Iets anders" },
];

const WEIGHT_PRESETS = [25, 50, 100, 150, 250];

/** Eén object-rij in het formulier; lege string = nog niet ingevuld. */
interface ItemDraft {
  id: number;
  type: JobType | "";
  length: number | "";
  width: number | "";
  height: number | "";
}

let itemSeq = 0;
function emptyItem(): ItemDraft {
  return { id: ++itemSeq, type: "", length: "", width: "", height: "" };
}

function tomorrowISO() {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  t.setHours(0, 0, 0, 0);
  return t.toISOString().slice(0, 10);
}

interface FlashProps {
  flash?: { bookingCode?: string | null };
}

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  postcode: string;
  street: string;
  city: string;
  date: string;
  timeSlot: string;
  items: ItemDraft[];
  description: string;
  heaviestObjectKg: number | "";
}

type SetData = <K extends keyof FormData>(key: K, value: FormData[K]) => void;

export default function BookingFlow() {
  const { flash } = usePage<FlashProps>().props;
  const [step, setStep] = useState<Step>(0);

  const { data, setData, post, processing, errors, transform } =
    useForm<FormData>({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      postcode: "",
      street: "",
      city: "",
      date: tomorrowISO(),
      timeSlot: "10:00",
      items: [emptyItem()],
      description: "",
      heaviestObjectKg: "",
    });

  // Done-scherm zodra de server een referentiecode heeft teruggestuurd.
  if (flash?.bookingCode) {
    return <DoneScreen code={flash.bookingCode} />;
  }

  function next() {
    setStep((s) => Math.min(2, s + 1) as Step);
  }
  function back() {
    setStep((s) => Math.max(0, s - 1) as Step);
  }

  /* ── object-lijst helpers ── */
  function addItem() {
    setData("items", [...data.items, emptyItem()]);
  }
  function removeItem(index: number) {
    setData(
      "items",
      data.items.filter((_, i) => i !== index)
    );
  }
  function updateItem(index: number, patch: Partial<ItemDraft>) {
    setData(
      "items",
      data.items.map((it, i) => (i === index ? { ...it, ...patch } : it))
    );
  }

  function submit() {
    // Strip lege objecten + zet lege afmetingen om naar null vóór verzenden.
    transform((d) => ({
      ...d,
      items: d.items
        .filter((it) => it.type !== "")
        .map((it) => ({
          type: it.type,
          length: it.length === "" ? null : it.length,
          width: it.width === "" ? null : it.width,
          height: it.height === "" ? null : it.height,
        })),
    }));
    post("/", {
      preserveScroll: true,
      onError: () => setStep(0),
    });
  }

  const canContinue = (() => {
    if (step === 0)
      return (
        data.customerName.trim().length > 1 &&
        data.customerPhone.trim().length >= 6 &&
        data.postcode.replace(/\s/g, "").length >= 4 &&
        data.street.trim().length > 1
      );
    if (step === 1) return !!data.date && !!data.timeSlot;
    if (step === 2)
      return data.items.some((it) => it.type !== "") && !!data.heaviestObjectKg;
    return false;
  })();

  function onPrimary() {
    if (step === 2) submit();
    else next();
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Head title="Lift aanvragen" />
      <FlowHeader step={step} onBack={back} />

      <div className="flex flex-1">
        <div className="relative flex flex-1 flex-col">
          <div className="mx-auto w-full max-w-[720px] flex-1 px-6 py-10 md:py-14">
            <StepHeading step={step} />
            <div className="mt-8">
              {step === 0 && <StepDetails data={data} setData={setData} errors={errors} />}
              {step === 1 && <StepWhen data={data} setData={setData} />}
              {step === 2 && (
                <StepJob
                  data={data}
                  setData={setData}
                  addItem={addItem}
                  removeItem={removeItem}
                  updateItem={updateItem}
                />
              )}
            </div>
          </div>
          <BottomBar step={step} canContinue={canContinue && !processing} onPrimary={onPrimary} processing={processing} />
        </div>

        <Sidebar data={data} />
      </div>
    </div>
  );
}

/* ───────────────────────── HEADER + PROGRESS ─────────────────── */

function FlowHeader({ step, onBack }: { step: Step; onBack: () => void }) {
  const totalSteps = STEP_LABELS.length;
  const progress = ((step + 1) / totalSteps) * 100;
  return (
    <header className="sticky top-0 z-30 bg-paper">
      <div className="relative h-1 w-full bg-sky-100">
        <div
          className="absolute inset-y-0 left-0 bg-blue transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex h-14 items-center justify-between px-6">
        {step > 0 ? (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-blue"
          >
            <ChevronLeft size={16} />
            Vorige
            <span className="num ml-2 text-slate-500">
              {step + 1} / {totalSteps}
            </span>
          </button>
        ) : (
          <span className="num text-[13px] font-semibold text-slate-400">
            Stap {step + 1} / {totalSteps}
          </span>
        )}
        <Link href="/" className="hidden md:inline-flex">
          <Brand to="/" />
        </Link>
        <span className="text-[13px] font-semibold text-slate-400">
          Lift aanvragen
        </span>
      </div>
    </header>
  );
}

function StepHeading({ step }: { step: Step }) {
  const titles = [
    "Voor wie en waar moet de lift komen?",
    "Wanneer wil je de lift?",
    "Wat moet er omhoog?",
  ];
  return (
    <div>
      <div className="flex items-center gap-2.5 text-[14px] font-bold text-blue">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-[13px]">
          {step + 1}
        </span>
        <span>{STEP_LABELS[step]}</span>
      </div>
      <h1 className="mt-4 text-[36px] font-bold leading-[1.1] tracking-tight text-navy md:text-[42px]">
        {titles[step]}
      </h1>
    </div>
  );
}

/* ───────────────────────────── STEP 1 — GEGEVENS ─────────────── */

function StepDetails({
  data,
  setData,
  errors,
}: {
  data: FormData;
  setData: SetData;
  errors: Partial<Record<string, string>>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <CustomerLabel>Voor- en achternaam</CustomerLabel>
        <CustomerInput
          className="mt-2"
          value={data.customerName}
          onChange={(e) => setData("customerName", e.target.value)}
          placeholder="Hoe heet je?"
        />
        {errors.customerName && <FieldError msg={errors.customerName} />}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <CustomerLabel>Telefoonnummer</CustomerLabel>
          <CustomerInput
            className="mt-2"
            value={data.customerPhone}
            onChange={(e) => setData("customerPhone", e.target.value)}
            placeholder="+31 6 …"
          />
          {errors.customerPhone && <FieldError msg={errors.customerPhone} />}
        </div>
        <div>
          <CustomerLabel>E-mailadres (optioneel)</CustomerLabel>
          <CustomerInput
            className="mt-2"
            type="email"
            value={data.customerEmail}
            onChange={(e) => setData("customerEmail", e.target.value)}
            placeholder="jij@adres.nl"
          />
          {errors.customerEmail && <FieldError msg={errors.customerEmail} />}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <CustomerLabel>Postcode</CustomerLabel>
          <CustomerInput
            value={data.postcode}
            onChange={(e) => setData("postcode", e.target.value.toUpperCase())}
            placeholder="1015 CW"
            className="mt-2"
            maxLength={8}
          />
          {errors.postcode && <FieldError msg={errors.postcode} />}
        </div>
        <div>
          <CustomerLabel>Straat + huisnummer</CustomerLabel>
          <CustomerInput
            value={data.street}
            onChange={(e) => setData("street", e.target.value)}
            placeholder="Prinsengracht 412"
            className="mt-2"
          />
          {errors.street && <FieldError msg={errors.street} />}
        </div>
      </div>

      <div>
        <CustomerLabel>Plaats (optioneel)</CustomerLabel>
        <CustomerInput
          value={data.city}
          onChange={(e) => setData("city", e.target.value)}
          placeholder="Amsterdam"
          className="mt-2 max-w-[280px]"
        />
      </div>
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return <p className="mt-1.5 text-[12px] font-medium text-red-600">{msg}</p>;
}

/* ───────────────────────────── STEP 2 — WANNEER ─────────────── */

function StepWhen({ data, setData }: { data: FormData; setData: SetData }) {
  return (
    <div className="space-y-7">
      <div>
        <CustomerLabel>Op welke dag wil je de lift?</CustomerLabel>
        <CustomerInput
          type="date"
          value={data.date}
          onChange={(e) => setData("date", e.target.value)}
          className="mt-2 max-w-[260px]"
        />
      </div>

      <div>
        <CustomerLabel>Hoe laat zou het moeten beginnen?</CustomerLabel>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {["08:00", "10:00", "13:00", "15:00"].map((t) => (
            <SelectButton
              key={t}
              active={data.timeSlot === t}
              onClick={() => setData("timeSlot", t)}
              size="lg"
            >
              {t}
            </SelectButton>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-slate-500">
          We stemmen het exacte tijdstip samen met je af zodra we contact opnemen.
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────────── STEP 3 — OBJECTEN + GEWICHT ───── */

function StepJob({
  data,
  setData,
  addItem,
  removeItem,
  updateItem,
}: {
  data: FormData;
  setData: SetData;
  addItem: () => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, patch: Partial<ItemDraft>) => void;
}) {
  const isCustomWeight =
    data.heaviestObjectKg !== "" &&
    !WEIGHT_PRESETS.includes(data.heaviestObjectKg as number);

  return (
    <div>
      <CustomerLabel>Welke objecten moeten omhoog?</CustomerLabel>
      <p className="mt-1 text-[12px] text-slate-500">
        Voeg alles toe wat de lift in moet. Afmetingen invullen mag, maar hoeft
        niet.
      </p>

      <div className="mt-3 space-y-3">
        {data.items.map((item, i) => (
          <ObjectRow
            key={item.id}
            item={item}
            canRemove={data.items.length > 1}
            onChange={(patch) => updateItem(i, patch)}
            onRemove={() => removeItem(i)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="mt-3 inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-2.5 text-[14px] font-semibold text-blue transition-colors hover:border-blue/50 hover:bg-sky-50"
      >
        <Plus size={16} />
        Object toevoegen
      </button>

      {/* Gewicht zwaarste object */}
      <div className="mt-9">
        <CustomerLabel>Hoe zwaar is het zwaarste object? (kg)</CustomerLabel>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {WEIGHT_PRESETS.map((w) => (
            <SelectButton
              key={w}
              active={data.heaviestObjectKg === w}
              onClick={() => setData("heaviestObjectKg", w)}
              size="lg"
            >
              {w} kg
            </SelectButton>
          ))}
          <div className="relative">
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={isCustomWeight ? data.heaviestObjectKg : ""}
              onChange={(e) =>
                setData(
                  "heaviestObjectKg",
                  e.target.value === "" ? "" : parseInt(e.target.value, 10) || ""
                )
              }
              placeholder="Anders"
              className="h-12 w-[132px] rounded-xl border-2 border-slate-200 bg-paper pl-4 pr-9 text-[15px] font-semibold text-navy placeholder:font-normal placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-blue focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-slate-400">
              kg
            </span>
          </div>
        </div>
        <p className="mt-3 text-[12px] text-slate-500">
          Een schatting is prima — hiermee kiest elev8 de juiste lift.
        </p>
      </div>

      {/* Toelichting */}
      <div className="mt-8">
        <CustomerLabel>Korte omschrijving (optioneel)</CustomerLabel>
        <CustomerTextarea
          value={data.description}
          onChange={(e) => setData("description", e.target.value)}
          placeholder="Bv. naar de 3e verdieping, krappe trap, glazen balkon, grachtenpand …"
          className="mt-2"
          rows={3}
        />
      </div>
    </div>
  );
}

function ObjectRow({
  item,
  canRemove,
  onChange,
  onRemove,
}: {
  item: ItemDraft;
  canRemove: boolean;
  onChange: (patch: Partial<ItemDraft>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-paper p-4">
      <div className="flex items-center gap-3">
        <select
          value={item.type}
          onChange={(e) => onChange({ type: e.target.value as JobType })}
          className={cn(
            "h-11 flex-1 rounded-xl border-2 border-slate-200 bg-paper px-3 text-[15px] font-semibold text-navy transition-colors hover:border-slate-300 focus:border-blue focus:outline-none",
            item.type === "" && "text-slate-400"
          )}
        >
          <option value="" disabled>
            Kies een object…
          </option>
          {JOB_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Object verwijderen"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-slate-200 text-slate-400 transition-colors hover:border-red-300 hover:text-red-500"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div className="mt-3">
        <div className="text-[12px] font-medium text-slate-500">
          Afmetingen (optioneel)
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <DimInput
            value={item.length}
            placeholder="L"
            onChange={(v) => onChange({ length: v })}
          />
          <span className="text-slate-400">×</span>
          <DimInput
            value={item.width}
            placeholder="B"
            onChange={(v) => onChange({ width: v })}
          />
          <span className="text-slate-400">×</span>
          <DimInput
            value={item.height}
            placeholder="H"
            onChange={(v) => onChange({ height: v })}
          />
          <span className="ml-1 text-[13px] text-slate-400">cm</span>
        </div>
      </div>
    </div>
  );
}

function DimInput({
  value,
  placeholder,
  onChange,
}: {
  value: number | "";
  placeholder: string;
  onChange: (v: number | "") => void;
}) {
  return (
    <input
      type="number"
      min={1}
      inputMode="numeric"
      placeholder={placeholder}
      value={value}
      onChange={(e) =>
        onChange(e.target.value === "" ? "" : parseInt(e.target.value, 10) || "")
      }
      className="h-11 w-16 rounded-xl border-2 border-slate-200 bg-paper text-center text-[15px] text-navy placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-blue focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
  );
}

/* ─────────────────────────── BOTTOM BAR ──────────────────────── */

function BottomBar({
  step,
  canContinue,
  onPrimary,
  processing,
}: {
  step: Step;
  canContinue: boolean;
  onPrimary: () => void;
  processing: boolean;
}) {
  const label = step === 2 ? (processing ? "Versturen…" : "Aanvraag versturen") : "Verder";
  return (
    <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-paper">
      <div className="mx-auto flex w-full max-w-[720px] items-center justify-end px-6 py-4">
        <button
          onClick={onPrimary}
          disabled={!canContinue}
          className={cn(
            "inline-flex h-14 items-center gap-2 rounded-xl px-8 text-[15px] font-bold transition-all active:scale-[0.98]",
            canContinue
              ? "bg-green text-white hover:bg-green-dark"
              : "bg-slate-200 text-slate-500 cursor-not-allowed"
          )}
        >
          {label}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────── RIGHT SIDEBAR ────────────────────── */

function formatDims(it: ItemDraft): string | null {
  const parts = [it.length, it.width, it.height];
  if (parts.every((p) => p === "")) return null;
  return parts.map((p) => (p === "" ? "?" : p)).join("×") + " cm";
}

function Sidebar({ data }: { data: FormData }) {
  const filledItems = data.items.filter((it) => it.type !== "");
  return (
    <aside className="hidden w-[380px] shrink-0 border-l border-sky-200 bg-sky-100 md:block">
      <div className="sticky top-14 px-7 py-10">
        <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Jouw aanvraag
        </div>
        <h3 className="mt-2 text-[26px] font-bold leading-tight tracking-tight text-navy">
          {filledItems.length > 0
            ? `${filledItems.length} ${filledItems.length === 1 ? "object" : "objecten"}`
            : "Lift huren"}
        </h3>
        {data.description && (
          <p className="mt-2 text-[13px] text-ink-2">{data.description}</p>
        )}

        <div className="mt-7 space-y-5 text-[13px]">
          <Row icon={<User size={14} />} label="Naam">
            {data.customerName || <span className="text-slate-500">—</span>}
          </Row>
          <Row icon={<Phone size={14} />} label="Telefoon">
            {data.customerPhone || <span className="text-slate-500">—</span>}
          </Row>
          <Row icon={<MapPin size={14} />} label="Locatie">
            {data.postcode ? (
              <>
                {data.postcode}
                {data.street ? ` · ${data.street}` : ""}
                {data.city ? ` · ${data.city}` : ""}
              </>
            ) : (
              <span className="text-slate-500">—</span>
            )}
          </Row>
          <Row icon={<CalendarIcon size={14} />} label="Wanneer">
            {data.date ? `${formatDateLong(data.date)}` : <span className="text-slate-500">—</span>}
            {data.timeSlot && <span className="ml-1 text-ink-2">· {data.timeSlot}</span>}
          </Row>
          {filledItems.length > 0 && (
            <Row icon={<Package size={14} />} label="Objecten">
              <ul className="space-y-0.5">
                {filledItems.map((it) => {
                  const dims = formatDims(it);
                  return (
                    <li key={it.id}>
                      {it.type}
                      {dims && <span className="text-ink-3"> · {dims}</span>}
                    </li>
                  );
                })}
              </ul>
            </Row>
          )}
          {data.heaviestObjectKg !== "" && (
            <Row icon={<Weight size={14} />} label="Zwaarste object">
              {data.heaviestObjectKg} kg
            </Row>
          )}
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-xl bg-white/60 px-4 py-3 text-[12px] text-ink-2">
          <Shield size={14} className="mt-0.5 shrink-0 text-green" />
          <span>
            Na het versturen neemt elev8 persoonlijk contact met je op om de
            details en prijs af te stemmen. Je zit nog nergens aan vast.
          </span>
        </div>
      </div>
    </aside>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-blue">{icon}</span>
      <div className="flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
          {label}
        </div>
        <div className="text-navy">{children}</div>
      </div>
    </div>
  );
}

/* ──────────────────────────── DONE ─────────────────────────── */

function DoneScreen({ code }: { code: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Head title="Aanvraag ontvangen" />
      <header className="border-b border-slate-200">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
          <Brand to="/" />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-14">
        <div className="w-full max-w-[560px] text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-soft text-green-deep">
            <CheckCircle2 size={36} />
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-[12px] font-bold text-blue">
            <Sparkles size={12} />
            Aanvraag ontvangen
          </div>
          <h1 className="mt-5 text-[36px] font-bold leading-tight tracking-tight text-navy md:text-[42px]">
            Bedankt, je aanvraag is binnen!
          </h1>
          <p className="mx-auto mt-3 max-w-[440px] text-[15px] leading-relaxed text-ink-2">
            elev8 neemt zo snel mogelijk telefonisch of per e-mail contact met je
            op om de details door te nemen, de juiste lift te kiezen en een
            afspraak in te plannen.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => router.get("/")}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-green px-7 text-[15px] font-bold text-white transition-all hover:bg-green-dark active:scale-[0.98]"
            >
              Nog een aanvraag doen
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="mt-8 font-mono text-[12px] text-slate-500">
            <PackageOpen size={11} className="inline-block" /> Referentie: {code}
          </div>
        </div>
      </div>
    </div>
  );
}
