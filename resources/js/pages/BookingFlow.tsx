import { useEffect, useRef, useState } from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  Hammer,
  ImagePlus,
  Info,
  Minus,
  Music,
  Plus,
  Package,
  PackageOpen,
  Refrigerator,
  Shield,
  Sofa,
  Sparkles,
  Truck,
  WashingMachine,
  X,
} from "lucide-react";
import {
  CustomerInput,
  CustomerLabel,
  CustomerTextarea,
} from "@/components/Input";
import { SelectButton } from "@/components/SelectButton";
import { Brand } from "@/components/Brand";
import type { JobType } from "@/lib/types";
import { SITE_CONDITIONS, siteConditionTitle } from "@/lib/site-conditions";
import { cn, formatDateLong } from "@/lib/utils";

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const STEP_LABELS = [
  "Jouw gegevens",
  "Datum & tijd",
  "Verdieping",
  "Wat moet er omhoog?",
  "Locatie & toegang",
  "Controleren",
];

const FLOOR_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1);
const MAX_PHOTOS = 5;

/**
 * `quantity`   : toon een aantal-teller (telbare objecten).
 * `dimensions` : toon de afmetingen-velden. Beide uit voor "Volledige
 *                verhuizing" — dat gaat niet om één specifiek item.
 */
const JOB_OPTIONS: Array<{
  value: JobType;
  title: string;
  description: string;
  icon: React.ReactNode;
  quantity: boolean;
  dimensions: boolean;
}> = [
  { value: "Bank", title: "Bank of meubel", description: "Eén of meerdere zware meubels", icon: <Sofa size={28} />, quantity: true, dimensions: true },
  { value: "Koelkast", title: "Koelkast", description: "Ook Amerikaanse maten", icon: <Refrigerator size={28} />, quantity: true, dimensions: true },
  { value: "Wasmachine", title: "Wasmachine of droger", description: "Standaard witgoed", icon: <WashingMachine size={28} />, quantity: true, dimensions: true },
  { value: "Volledige verhuizing", title: "Volledige verhuizing", description: "Studio tot 3-kamer appartement", icon: <Truck size={28} />, quantity: false, dimensions: false },
  { value: "Piano", title: "Piano of vleugel", description: "Zware, kwetsbare last", icon: <Music size={28} />, quantity: true, dimensions: true },
  { value: "Bouwmaterialen", title: "Bouwmaterialen", description: "Gips, cement, isolatie, paletten", icon: <Hammer size={28} />, quantity: true, dimensions: true },
  { value: "Anders", title: "Iets anders", description: "Vertel het ons hieronder", icon: <Package size={28} />, quantity: true, dimensions: true },
];

/** Eén regel van JOB_OPTIONS. */
type JobOption = (typeof JOB_OPTIONS)[number];

const WEIGHT_PRESETS = [25, 50, 100, 150, 250];

/** Dagdeel; komt van de server (config/booking.php), met fallback hieronder. */
interface Slot {
  key: string;
  label: string;
  start: string;
  end: string;
}

interface Suggestion {
  date: string;
  free: number;
}

const DEFAULT_SLOTS: Slot[] = [
  { key: "ochtend", label: "Ochtend", start: "08:00", end: "12:00" },
  { key: "middag", label: "Middag", start: "12:00", end: "17:00" },
  { key: "avond", label: "Avond", start: "17:00", end: "21:00" },
];

function slotLabel(slots: Slot[], key: string): string {
  return slots.find((s) => s.key === key)?.label ?? key;
}

/** Korte NL-datum voor de suggestie-chips, bv. "ma 22 jun". */
function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Eén geselecteerd object; afmetingen in cm zijn optioneel (lege string = leeg). */
interface ItemDraft {
  type: JobType;
  quantity: number;
  length: number | "";
  width: number | "";
  height: number | "";
}

function tomorrowISO() {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  t.setHours(0, 0, 0, 0);
  return t.toISOString().slice(0, 10);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

interface PageProps {
  flash?: { bookingCode?: string | null };
  /** Alleen true in debug-modus; toont de testdata-knop. */
  appDebug?: boolean;
  /** Boekbare tijdvakken (uit config/booking.php). */
  slots?: Slot[];
  /** Staat de Google Calendar-beschikbaarheidsflow aan? */
  calendarEnabled?: boolean;
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
  floor: number | "";
  heightMeters: number | "";
  items: ItemDraft[];
  siteConditions: string[];
  photos: File[];
  description: string;
  heaviestObjectKg: number | "";
}

type SetData = <K extends keyof FormData>(key: K, value: FormData[K]) => void;

export default function BookingFlow() {
  const { flash, appDebug, slots, calendarEnabled } = usePage<PageProps>().props;
  const timeSlots = slots && slots.length > 0 ? slots : DEFAULT_SLOTS;
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
      timeSlot: "",
      floor: "",
      heightMeters: "",
      items: [],
      siteConditions: [],
      photos: [],
      description: "",
      heaviestObjectKg: "",
    });

  // Done-scherm zodra de server een referentiecode heeft teruggestuurd.
  if (flash?.bookingCode) {
    return <DoneScreen code={flash.bookingCode} />;
  }

  function next() {
    setStep((s) => Math.min(5, s + 1) as Step);
  }
  function back() {
    setStep((s) => Math.max(0, s - 1) as Step);
  }

  // Dev-gemak: vul stap 1 met testgegevens (alleen zichtbaar in debug-modus).
  function fillTestData() {
    setData((prev) => ({
      ...prev,
      customerName: "Test Klant",
      customerEmail: "test@voorbeeld.nl",
      customerPhone: "+31 6 12345678",
      postcode: "1015 CW",
      street: "Prinsengracht 412",
      city: "Amsterdam",
    }));
  }

  /* ── object-selectie (multi-select) ── */
  function isSelected(type: JobType) {
    return data.items.some((it) => it.type === type);
  }
  function toggleType(type: JobType) {
    setData(
      "items",
      isSelected(type)
        ? data.items.filter((it) => it.type !== type)
        : [...data.items, { type, quantity: 1, length: "", width: "", height: "" }]
    );
  }
  function updateDims(type: JobType, patch: Partial<ItemDraft>) {
    setData(
      "items",
      data.items.map((it) => (it.type === type ? { ...it, ...patch } : it))
    );
  }

  /* ── locatie-bijzonderheden (multi-select, optioneel) ── */
  function toggleCondition(key: string) {
    setData(
      "siteConditions",
      data.siteConditions.includes(key)
        ? data.siteConditions.filter((k) => k !== key)
        : [...data.siteConditions, key]
    );
  }

  function submit() {
    // Zet lege afmetingen om naar null vóór verzenden.
    transform((d) => ({
      ...d,
      items: d.items.map((it) => ({
        type: it.type,
        quantity: it.quantity,
        length: it.length === "" ? null : it.length,
        width: it.width === "" ? null : it.width,
        height: it.height === "" ? null : it.height,
      })),
    }));
    post("/aanvragen", {
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
    if (step === 2) return !!data.floor; // verdieping verplicht
    if (step === 3) return data.items.length > 0 && !!data.heaviestObjectKg;
    if (step === 4) return true; // bijzonderheden zijn optioneel
    if (step === 5) return true; // controlepagina
    return false;
  })();

  function onPrimary() {
    if (step === 5) submit();
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
              {step === 0 && (
                <>
                  {appDebug && (
                    <button
                      type="button"
                      onClick={fillTestData}
                      className="mb-5 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-[12px] font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                    >
                      ⚡ Testgegevens invullen
                    </button>
                  )}
                  <StepDetails data={data} setData={setData} errors={errors} />
                </>
              )}
              {step === 1 && (
                <StepWhen
                  data={data}
                  setData={setData}
                  slots={timeSlots}
                  calendarEnabled={!!calendarEnabled}
                />
              )}
              {step === 2 && <StepFloor data={data} setData={setData} />}
              {step === 3 && (
                <StepJob
                  data={data}
                  setData={setData}
                  isSelected={isSelected}
                  onToggle={toggleType}
                  onDims={updateDims}
                />
              )}
              {step === 4 && (
                <StepLocation
                  data={data}
                  setData={setData}
                  onToggle={toggleCondition}
                />
              )}
              {step === 5 && (
                <StepReview data={data} onEdit={setStep} slots={timeSlots} />
              )}
            </div>
          </div>
          <BottomBar step={step} canContinue={canContinue && !processing} onPrimary={onPrimary} processing={processing} />
        </div>

        {step < 5 && <Sidebar data={data} slots={timeSlots} />}
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
    "Naar welke verdieping moet de lift?",
    "Wat moet er omhoog?",
    "Zijn er bijzonderheden op locatie?",
    "Klopt alles?",
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

function StepWhen({
  data,
  setData,
  slots,
  calendarEnabled,
}: {
  data: FormData;
  setData: SetData;
  slots: Slot[];
  calendarEnabled: boolean;
}) {
  const [availability, setAvailability] = useState<Record<
    string,
    boolean
  > | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // Beschikbaarheid (Google Calendar) ophalen zodra de datum wijzigt.
  // Alleen wanneer de agenda-flow aan staat; anders nooit een call doen.
  useEffect(() => {
    if (!calendarEnabled || !data.date) {
      setAvailability(null);
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/beschikbaarheid?date=${encodeURIComponent(data.date)}`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load failed"))))
      .then(
        (json: {
          available?: Record<string, boolean>;
          suggestions?: Suggestion[];
        }) => {
          if (cancelled) return;
          const map = json.available ?? null;
          setAvailability(map);
          setSuggestions(json.suggestions ?? []);
          // Was het gekozen dagdeel intussen bezet? Deselecteer het.
          if (data.timeSlot && map?.[data.timeSlot] === false) {
            setData("timeSlot", "");
          }
        }
      )
      .catch(() => {
        // Faalveilig: bij een fout behandelen we alle dagdelen als boekbaar.
        if (!cancelled) {
          setAvailability(null);
          setSuggestions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.date, calendarEnabled]);

  const isAvailable = (key: string) =>
    availability ? availability[key] !== false : true;
  const allBusy =
    availability !== null && slots.every((s) => availability[s.key] === false);

  return (
    <div className="space-y-7">
      <div>
        <CustomerLabel>Op welke dag wil je de lift?</CustomerLabel>
        <CustomerInput
          type="date"
          value={data.date}
          min={todayISO()}
          onChange={(e) => setData("date", e.target.value)}
          className="mt-2 max-w-[260px]"
        />
      </div>

      {!calendarEnabled ? (
        // Simpele flow: vier vaste starttijden, geen beschikbaarheidscheck.
        <div>
          <CustomerLabel>Hoe laat zou het moeten beginnen?</CustomerLabel>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {slots.map((s) => (
              <SelectButton
                key={s.key}
                active={data.timeSlot === s.key}
                onClick={() => setData("timeSlot", s.key)}
                size="lg"
              >
                {s.label}
              </SelectButton>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-slate-500">
            We stemmen het exacte tijdstip samen met je af zodra we contact
            opnemen.
          </p>
        </div>
      ) : (
        // Agenda-flow: dagdelen met live beschikbaarheid + suggestie.
        <div>
          <CustomerLabel>Welk dagdeel komt je het beste uit?</CustomerLabel>
          <div className="mt-2 grid grid-cols-3 gap-2.5">
            {slots.map((s) => (
              <DayPartButton
                key={s.key}
                slot={s}
                active={data.timeSlot === s.key}
                available={isAvailable(s.key)}
                onClick={() => setData("timeSlot", s.key)}
              />
            ))}
          </div>

          {loading ? (
            <p className="mt-3 text-[12px] text-slate-500">
              Beschikbaarheid laden…
            </p>
          ) : (
            <p className="mt-3 text-[12px] text-slate-500">
              <span className="font-semibold text-red-500">
                Rood doorgestreept
              </span>{" "}
              = al bezet. We stemmen het exacte tijdstip samen met je af zodra we
              contact opnemen.
            </p>
          )}

          {/* "Betere dag"-suggestie bij een (bijna) volle dag. */}
          {!loading && suggestions.length > 0 && (
            <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
              <p className="text-[13px] font-semibold text-navy">
                {allBusy ? "Deze dag zit vol." : "Op deze dag is weinig vrij."}{" "}
                <span className="font-normal text-ink-2">
                  Meer beschikbaar op:
                </span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s.date}
                    type="button"
                    onClick={() => setData("date", s.date)}
                    className="inline-flex items-center gap-1.5 rounded-lg border-2 border-blue/30 bg-white px-3 py-1.5 text-[13px] font-semibold text-blue transition-colors hover:border-blue hover:bg-sky-100"
                  >
                    {shortDate(s.date)}
                    <span className="text-[11px] font-bold text-green-deep">
                      {s.free} vrij
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Grote dagdeel-knop; rood doorgestreept wanneer bezet (niet klikbaar). */
function DayPartButton({
  slot,
  active,
  available,
  onClick,
}: {
  slot: Slot;
  active: boolean;
  available: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!available}
      aria-disabled={!available}
      onClick={onClick}
      className={cn(
        "flex h-[72px] flex-col items-center justify-center rounded-xl border-2 font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40",
        !available
          ? "cursor-not-allowed border-slate-200 bg-slate-50 text-red-400"
          : active
          ? "border-blue bg-sky-100 text-navy active:scale-[0.98]"
          : "border-slate-200 bg-paper text-ink-2 hover:border-blue/40 hover:text-navy active:scale-[0.98]"
      )}
    >
      <span className={cn("text-[15px]", !available && "text-red-500 line-through decoration-red-400 decoration-2")}>
        {slot.label}
      </span>
      <span className={cn("mt-0.5 text-[11px] font-normal", !available ? "text-red-300 line-through decoration-red-300" : "text-slate-400")}>
        {slot.start}–{slot.end}
      </span>
    </button>
  );
}

/* ─────────────────────────── STEP 3 — VERDIEPING ─────────────── */

function StepFloor({ data, setData }: { data: FormData; setData: SetData }) {
  return (
    <div className="space-y-8">
      <div>
        <CustomerLabel>Naar welke verdieping moet de lift?</CustomerLabel>
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
          {FLOOR_OPTIONS.map((f) => (
            <SelectButton
              key={f}
              active={data.floor === f}
              onClick={() => setData("floor", f)}
            >
              {f}
            </SelectButton>
          ))}
        </div>
      </div>

      <div>
        <CustomerLabel>Hoeveel meter is dat ongeveer?</CustomerLabel>
        <div className="relative mt-3 w-[170px]">
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={data.heightMeters}
            onChange={(e) =>
              setData(
                "heightMeters",
                e.target.value === "" ? "" : parseInt(e.target.value, 10) || ""
              )
            }
            placeholder="Bv. 9"
            className="h-12 w-full rounded-xl border-2 border-slate-200 bg-paper pl-4 pr-14 text-[15px] font-semibold text-navy placeholder:font-normal placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-blue focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-slate-400">
            meter
          </span>
        </div>
        <p className="mt-3 text-[12px] text-slate-500">
          Een inschatting is voldoende — hiermee kiest UrbanLift een lift met
          genoeg reikhoogte.
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────────── STEP 4 — OBJECTEN + GEWICHT ───── */

function StepJob({
  data,
  setData,
  isSelected,
  onToggle,
  onDims,
}: {
  data: FormData;
  setData: SetData;
  isSelected: (type: JobType) => boolean;
  onToggle: (type: JobType) => void;
  onDims: (type: JobType, patch: Partial<ItemDraft>) => void;
}) {
  const isCustomWeight =
    data.heaviestObjectKg !== "" &&
    !WEIGHT_PRESETS.includes(data.heaviestObjectKg as number);

  return (
    <div>
      <CustomerLabel>Welke objecten moeten omhoog?</CustomerLabel>
      <p className="mt-1 text-[12px] text-slate-500">
        Kies alles wat de lift in moet. Per object kun je het aantal opgeven en
        (optioneel) de afmetingen.
      </p>

      <div className="mt-3 flex flex-col gap-3">
        {JOB_OPTIONS.map((option) => {
          const selected = isSelected(option.value);
          const item = data.items.find((it) => it.type === option.value);
          return (
            <ObjectCard
              key={option.value}
              option={option}
              selected={selected}
              item={item}
              onToggle={() => onToggle(option.value)}
              onDims={(patch) => onDims(option.value, patch)}
            />
          );
        })}
      </div>

      {/* Gewicht zwaarste object */}
      <div className="mt-9">
        <CustomerLabel>Hoe zwaar is het zwaarste object? (kg)</CustomerLabel>
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          {WEIGHT_PRESETS.map((w) => (
            <SelectButton
              key={w}
              active={data.heaviestObjectKg === w}
              onClick={() => setData("heaviestObjectKg", w)}
              size="lg"
              className="min-w-[84px] px-5"
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
              className="h-12 w-[140px] rounded-xl border-2 border-slate-200 bg-paper pl-4 pr-9 text-[15px] font-semibold text-navy placeholder:font-normal placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-blue focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-slate-400">
              kg
            </span>
          </div>
        </div>
        <p className="mt-3 text-[12px] text-slate-500">
          Een schatting is prima — hiermee kiest UrbanLift de juiste lift.
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

function ObjectCard({
  option,
  selected,
  item,
  onToggle,
  onDims,
}: {
  option: JobOption;
  selected: boolean;
  item?: ItemDraft;
  onToggle: () => void;
  onDims: (patch: Partial<ItemDraft>) => void;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border-2 transition-all",
        selected ? "border-blue bg-sky-50" : "border-slate-200 bg-paper hover:border-blue/40"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        className="flex w-full items-center gap-5 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/30"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-blue">
          {option.icon}
        </div>
        <div className="flex-1">
          <div className="text-[16px] font-bold leading-tight text-navy">
            {option.title}
          </div>
          <div className="mt-1 text-[13px] leading-snug text-ink-3">
            {option.description}
          </div>
        </div>
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
            selected ? "border-blue bg-blue text-white" : "border-slate-300"
          )}
        >
          {selected && <Check size={14} strokeWidth={3} />}
        </span>
      </button>

      {selected && item && (option.quantity || option.dimensions) && (
        <div className="space-y-3 border-t-2 border-sky-200 px-5 py-4">
          {option.quantity && (
            <div>
              <div className="text-[12px] font-medium text-ink-2">Aantal</div>
              <div className="mt-1.5">
                <QuantityStepper
                  value={item.quantity}
                  onChange={(v) => onDims({ quantity: v })}
                />
              </div>
            </div>
          )}
          {option.dimensions && (
            <div>
              <div className="text-[12px] font-medium text-ink-2">
                {item.quantity > 1
                  ? "Afmeting van het grootste exemplaar (optioneel)"
                  : "Afmetingen (optioneel)"}
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <DimInput value={item.length} placeholder="L" onChange={(v) => onDims({ length: v })} />
                <span className="text-slate-400">×</span>
                <DimInput value={item.width} placeholder="B" onChange={(v) => onDims({ width: v })} />
                <span className="text-slate-400">×</span>
                <DimInput value={item.height} placeholder="H" onChange={(v) => onDims({ height: v })} />
                <span className="ml-1 text-[13px] text-slate-400">cm</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuantityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const set = (n: number) => onChange(Math.max(1, Math.min(99, n)));
  return (
    <div className="inline-flex items-center rounded-xl border-2 border-slate-200 bg-paper">
      <button
        type="button"
        onClick={() => set(value - 1)}
        disabled={value <= 1}
        aria-label="Eén minder"
        className="flex h-11 w-11 items-center justify-center text-navy transition-colors hover:text-blue disabled:opacity-30"
      >
        <Minus size={16} />
      </button>
      <input
        type="number"
        min={1}
        max={99}
        inputMode="numeric"
        value={value}
        onChange={(e) => set(parseInt(e.target.value, 10) || 1)}
        className="h-11 w-12 border-x-2 border-slate-200 bg-transparent text-center text-[15px] font-semibold text-navy focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => set(value + 1)}
        disabled={value >= 99}
        aria-label="Eén meer"
        className="flex h-11 w-11 items-center justify-center text-navy transition-colors hover:text-blue disabled:opacity-30"
      >
        <Plus size={16} />
      </button>
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

/* ───────────────────────── STEP 4 — LOCATIE ──────────────────── */

function StepLocation({
  data,
  setData,
  onToggle,
}: {
  data: FormData;
  setData: SetData;
  onToggle: (key: string) => void;
}) {
  const [converting, setConverting] = useState(false);

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    setConverting(true);
    try {
      const converted = await Promise.all(Array.from(files).map(normalizePhoto));
      setData("photos", [...data.photos, ...converted].slice(0, MAX_PHOTOS));
    } finally {
      setConverting(false);
    }
  }
  function removePhoto(index: number) {
    setData(
      "photos",
      data.photos.filter((_, i) => i !== index)
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <CustomerLabel>Zijn er obstakels rond de plek waar de lift komt?</CustomerLabel>
        <p className="mt-1 text-[12px] text-slate-500">
          Selecteer wat van toepassing is. Niets aanvinken mag ook.
        </p>

        <div className="mt-3 flex flex-col gap-3">
          {SITE_CONDITIONS.map((c) => (
            <ConditionCard
              key={c.key}
              condition={c}
              selected={data.siteConditions.includes(c.key)}
              onToggle={() => onToggle(c.key)}
            />
          ))}
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-ink-2">
          <Info size={16} className="mt-0.5 shrink-0 text-blue" />
          <span>
            Geen bijzonderheden? Ga gewoon verder — UrbanLift neemt voor de
            zekerheid altijd nog contact met je op.
          </span>
        </div>
      </div>

      <PhotoUploader
        photos={data.photos}
        converting={converting}
        onAdd={addPhotos}
        onRemove={removePhoto}
      />
    </div>
  );
}

/** Zet een HEIC/HEIF-foto (iPhone) om naar JPEG zodat 'ie overal te tonen is. */
async function normalizePhoto(file: File): Promise<File> {
  const isHeic =
    /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
  if (!isHeic) return file;
  try {
    // Lazy import: de converter (WASM) wordt alleen geladen als er HEIC is.
    const heic2any = (await import("heic2any")).default;
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
    const blob = Array.isArray(out) ? out[0] : out;
    return new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
      type: "image/jpeg",
    });
  } catch {
    // Lukt het niet, dan uploaden we het origineel (de server accepteert HEIC ook).
    return file;
  }
}

function PhotoUploader({
  photos,
  converting,
  onAdd,
  onRemove,
}: {
  photos: File[];
  converting: boolean;
  onAdd: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const full = photos.length >= MAX_PHOTOS;

  return (
    <div>
      <CustomerLabel>Foto's van de situatie (optioneel)</CustomerLabel>
      <p className="mt-1 text-[12px] text-slate-500">
        Een foto van de straat en de gevel of het balkon helpt UrbanLift de
        juiste lift en opstelling te kiezen. Maximaal {MAX_PHOTOS} foto's.
      </p>

      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.map((file, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden rounded-xl border-2 border-slate-200"
            >
              <img
                src={URL.createObjectURL(file)}
                alt={`Foto ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label="Foto verwijderen"
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-navy/70 text-white transition-colors hover:bg-navy"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!full && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={converting}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-[14px] font-semibold text-blue transition-colors hover:border-blue/50 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ImagePlus size={18} />
          {converting ? "Foto's omzetten…" : "Foto's toevoegen"}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="hidden"
        onChange={(e) => {
          onAdd(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function ConditionCard({
  condition,
  selected,
  onToggle,
}: {
  condition: {
    key: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ size?: number }>;
  };
  selected: boolean;
  onToggle: () => void;
}) {
  const Icon = condition.icon;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-5 rounded-2xl border-2 px-5 py-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/30",
        selected ? "border-blue bg-sky-50" : "border-slate-200 bg-paper hover:border-blue/40"
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-blue">
        <Icon size={28} />
      </div>
      <div className="flex-1">
        <div className="text-[16px] font-bold leading-tight text-navy">
          {condition.title}
        </div>
        <div className="mt-1 text-[13px] leading-snug text-ink-3">
          {condition.description}
        </div>
      </div>
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
          selected ? "border-blue bg-blue text-white" : "border-slate-300"
        )}
      >
        {selected && <Check size={14} strokeWidth={3} />}
      </span>
    </button>
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
  const label = step === 5 ? (processing ? "Bezig…" : "Bevestig boeking") : "Verder";
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

function Sidebar({ data, slots }: { data: FormData; slots: Slot[] }) {
  const items = data.items;
  const dash = <span className="text-slate-400">—</span>;
  const address =
    [data.postcode, data.street, data.city].filter(Boolean).join(" · ") || null;

  return (
    <aside className="hidden w-[360px] shrink-0 border-l border-sky-200 bg-sky-100 md:block">
      <div className="sticky top-14 px-6 py-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue">
          Jouw aanvraag
        </div>

        <div className="mt-3 space-y-2.5">
          <SidebarSection title="Jouw gegevens">
            <SRow label="Naam">{data.customerName || dash}</SRow>
            <SRow label="Telefoon">{data.customerPhone || dash}</SRow>
            {data.customerEmail && <SRow label="E-mail">{data.customerEmail}</SRow>}
            <SRow label="Adres">{address ?? dash}</SRow>
          </SidebarSection>

          <SidebarSection title="Datum & tijd">
            <SRow label="Wanneer">
              {data.date ? formatDateLong(data.date) : dash}
              {data.timeSlot ? ` · ${slotLabel(slots, data.timeSlot)}` : ""}
            </SRow>
          </SidebarSection>

          {data.floor !== "" && (
            <SidebarSection title="Verdieping">
              <SRow label="Verdieping">{data.floor}e</SRow>
              {data.heightMeters !== "" && (
                <SRow label="Hoogte">± {data.heightMeters} m</SRow>
              )}
            </SidebarSection>
          )}

          {(items.length > 0 || data.heaviestObjectKg !== "") && (
            <SidebarSection title="Wat moet er omhoog">
              {items.length > 0 && (
                <SRow label="Objecten">
                  <ul className="space-y-0.5">
                    {items.map((it) => {
                      const dims = formatDims(it);
                      return (
                        <li key={it.type}>
                          {it.quantity > 1 ? `${it.quantity}× ` : ""}
                          {it.type}
                          {dims && <span className="text-ink-3"> · {dims}</span>}
                        </li>
                      );
                    })}
                  </ul>
                </SRow>
              )}
              {data.heaviestObjectKg !== "" && (
                <SRow label="Zwaarste">{data.heaviestObjectKg} kg</SRow>
              )}
            </SidebarSection>
          )}

          {(data.siteConditions.length > 0 || data.photos.length > 0) && (
            <SidebarSection title="Locatie & toegang">
              {data.siteConditions.length > 0 && (
                <SRow label="Bijzonderheden">
                  <ul className="space-y-0.5">
                    {data.siteConditions.map((k) => (
                      <li key={k}>{siteConditionTitle(k)}</li>
                    ))}
                  </ul>
                </SRow>
              )}
              {data.photos.length > 0 && (
                <SRow label="Foto's">
                  {data.photos.length}{" "}
                  {data.photos.length === 1 ? "foto" : "foto's"}
                </SRow>
              )}
            </SidebarSection>
          )}
        </div>

        <p className="mt-3 flex items-start gap-2 px-1 text-[11px] leading-snug text-ink-3">
          <Shield size={13} className="mt-0.5 shrink-0 text-green" />
          <span>
            UrbanLift neemt na het versturen contact op om de details en prijs af
            te stemmen.
          </span>
        </p>
      </div>
    </aside>
  );
}

function SRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 text-[12.5px] leading-snug">
      <span className="w-[64px] shrink-0 text-slate-500">{label}</span>
      <span className="flex-1 text-navy">{children}</span>
    </div>
  );
}

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white/60 px-3.5 py-2.5">
      <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue/70">
        {title}
      </div>
      <div className="mt-1.5 space-y-1.5">{children}</div>
    </div>
  );
}

/* ───────────────────────── STEP 5 — CONTROLE ─────────────────── */

function StepReview({
  data,
  onEdit,
  slots,
}: {
  data: FormData;
  onEdit: (step: Step) => void;
  slots: Slot[];
}) {
  const address =
    [data.street, data.postcode, data.city].filter(Boolean).join(" · ") || "—";

  return (
    <div className="space-y-4">
      <p className="text-[14px] text-ink-2">
        Bijna klaar — controleer hieronder je aanvraag. Klopt iets niet? Tik op
        “Wijzig”. Daarna bevestig je de boeking.
      </p>

      <ReviewSection title="Jouw gegevens" onEdit={() => onEdit(0)}>
        <ReviewRow label="Naam">{data.customerName || "—"}</ReviewRow>
        <ReviewRow label="Telefoon">{data.customerPhone || "—"}</ReviewRow>
        {data.customerEmail && (
          <ReviewRow label="E-mail">{data.customerEmail}</ReviewRow>
        )}
        <ReviewRow label="Adres">{address}</ReviewRow>
      </ReviewSection>

      <ReviewSection title="Datum & tijd" onEdit={() => onEdit(1)}>
        <ReviewRow label="Wanneer">
          {data.date ? formatDateLong(data.date) : "—"}
          {data.timeSlot ? ` · ${slotLabel(slots, data.timeSlot)}` : ""}
        </ReviewRow>
      </ReviewSection>

      <ReviewSection title="Verdieping" onEdit={() => onEdit(2)}>
        <ReviewRow label="Verdieping">
          {data.floor !== "" ? `${data.floor}e verdieping` : "—"}
        </ReviewRow>
        <ReviewRow label="Hoogte">
          {data.heightMeters !== "" ? `± ${data.heightMeters} m` : "—"}
        </ReviewRow>
      </ReviewSection>

      <ReviewSection title="Wat moet er omhoog?" onEdit={() => onEdit(3)}>
        <ReviewRow label="Objecten">
          {data.items.length > 0 ? (
            <ul className="space-y-0.5">
              {data.items.map((it) => {
                const dims = formatDims(it);
                return (
                  <li key={it.type}>
                    {it.quantity > 1 ? `${it.quantity}× ` : ""}
                    {it.type}
                    {dims && <span className="text-ink-3"> · {dims}</span>}
                  </li>
                );
              })}
            </ul>
          ) : (
            "—"
          )}
        </ReviewRow>
        <ReviewRow label="Zwaarste object">
          {data.heaviestObjectKg !== "" ? `${data.heaviestObjectKg} kg` : "—"}
        </ReviewRow>
        {data.description && (
          <ReviewRow label="Toelichting">{data.description}</ReviewRow>
        )}
      </ReviewSection>

      <ReviewSection title="Locatie & toegang" onEdit={() => onEdit(4)}>
        <ReviewRow label="Bijzonderheden">
          {data.siteConditions.length > 0
            ? data.siteConditions.map((k) => siteConditionTitle(k)).join(" · ")
            : "Geen opgegeven"}
        </ReviewRow>
        {data.photos.length > 0 && (
          <ReviewRow label="Foto's">
            <div className="flex flex-wrap gap-2">
              {data.photos.map((file, i) => (
                <img
                  key={i}
                  src={URL.createObjectURL(file)}
                  alt={`Foto ${i + 1}`}
                  className="h-14 w-14 rounded-lg border border-slate-200 object-cover"
                />
              ))}
            </div>
          </ReviewRow>
        )}
      </ReviewSection>
    </div>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-paper p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[12px] font-bold uppercase tracking-[0.1em] text-blue">
          {title}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-[13px] font-semibold text-blue hover:underline"
        >
          Wijzig
        </button>
      </div>
      <div className="mt-3 space-y-2.5">{children}</div>
    </div>
  );
}

function ReviewRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 text-[14px]">
      <span className="w-[120px] shrink-0 text-slate-500">{label}</span>
      <span className="flex-1 font-medium text-navy">{children}</span>
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
            UrbanLift neemt zo snel mogelijk telefonisch of per e-mail contact met
            je op om de details door te nemen, de juiste lift te kiezen en een
            afspraak in te plannen.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => router.get("/aanvragen")}
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
