import { Head, Link } from "@inertiajs/react";
import {
  ArrowRight,
  ClipboardList,
  PhoneCall,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Brand } from "@/components/Brand";

const STEPS = [
  {
    icon: <ClipboardList size={24} />,
    title: "1. Doe je aanvraag",
    text: "Vertel ons in een paar stappen wat, waar en wanneer er omhoog moet.",
  },
  {
    icon: <PhoneCall size={24} />,
    title: "2. Wij nemen contact op",
    text: "UrbanLift belt of mailt je om de details en de prijs af te stemmen.",
  },
  {
    icon: <Truck size={24} />,
    title: "3. De lift komt langs",
    text: "Een ervaren operator zet de verhuislift op en tilt het zware werk omhoog.",
  },
];

const PERKS = ["Gratis & vrijblijvend", "Ervaren operators", "Snel een reactie"];

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Head title="Verhuislift huren" />

      {/* Header */}
      <header className="border-b border-slate-100">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-6">
          <Brand to="/" />
          <Link
            href="/aanvragen"
            className="text-[14px] font-semibold text-blue hover:text-blue-dark"
          >
            Lift aanvragen
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-sky-100">
        <div className="mx-auto max-w-[1100px] px-6 py-20 md:py-28">
          <div className="max-w-[680px]">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.1em] text-blue">
              Verhuislift huren
            </span>
            <h1 className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-tight text-navy md:text-[60px]">
              Laat de lift het{" "}
              <span className="text-blue">zware werk</span> doen.
            </h1>
            <p className="mt-5 max-w-[540px] text-[17px] leading-relaxed text-ink-2 md:text-[19px]">
              Bank, koelkast, piano of een hele verhuizing naar boven? UrbanLift
              regelt een verhuislift met ervaren operator. Doe je aanvraag in een
              paar klikken.
            </p>

            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href="/aanvragen"
                className="inline-flex h-14 items-center gap-2.5 rounded-xl bg-green px-9 text-[16px] font-bold text-white shadow-sm transition-all hover:bg-green-dark active:scale-[0.98]"
              >
                Vraag een lift aan
                <ArrowRight size={18} />
              </Link>
              <span className="text-[14px] font-medium text-ink-3">
                In 2 minuten klaar — geen account nodig.
              </span>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {PERKS.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-2 text-[14px] font-semibold text-navy"
                >
                  <ShieldCheck size={16} className="text-green" />
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Hoe het werkt */}
      <section className="mx-auto w-full max-w-[1100px] px-6 py-20">
        <h2 className="text-[28px] font-bold tracking-tight text-navy md:text-[34px]">
          Hoe het werkt
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-slate-200 bg-paper p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-blue">
                {s.icon}
              </div>
              <h3 className="mt-5 text-[18px] font-bold text-navy">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Slot-CTA */}
      <section className="bg-navy">
        <div className="mx-auto flex max-w-[1100px] flex-col items-start justify-between gap-6 px-6 py-14 md:flex-row md:items-center">
          <div>
            <h2 className="text-[26px] font-bold tracking-tight text-white md:text-[32px]">
              Klaar om iets omhoog te krijgen?
            </h2>
            <p className="mt-2 text-[16px] text-sky-200">
              Doe je aanvraag — je zit nergens aan vast.
            </p>
          </div>
          <Link
            href="/aanvragen"
            className="inline-flex h-14 shrink-0 items-center gap-2.5 rounded-xl bg-green px-9 text-[16px] font-bold text-white transition-all hover:bg-green-dark active:scale-[0.98]"
          >
            Vraag een lift aan
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100">
        <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-3 px-6 py-8 text-[13px] text-ink-3 sm:flex-row">
          <Brand to="/" />
          <span>© {new Date().getFullYear()} UrbanLift</span>
        </div>
      </footer>
    </div>
  );
}
