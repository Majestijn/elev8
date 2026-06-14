import { Head, useForm } from "@inertiajs/react";
import { LogoMark } from "@/components/Brand";
import { cn } from "@/lib/utils";

export default function Elev8Login() {
  const { data, setData, post, processing, errors } = useForm({ password: "" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post("/elev8/login");
  }

  const error = errors.password;

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <Head title="Inloggen" />
      <form
        onSubmit={submit}
        className="w-full max-w-[380px] rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-[20px] font-extrabold tracking-tight text-navy">
            Urban<span className="text-blue">Lift</span>
          </span>
        </div>
        <h1 className="mt-5 text-[22px] font-bold tracking-tight text-navy">
          Inloggen
        </h1>
        <p className="mt-1 text-[13px] text-ink-2">
          Beheer je binnengekomen aanvragen.
        </p>

        <label className="mt-6 block text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-500">
          Wachtwoord
        </label>
        <input
          type="password"
          autoFocus
          value={data.password}
          onChange={(e) => setData("password", e.target.value)}
          placeholder="••••••••"
          className={cn(
            "mt-2 h-12 w-full rounded-xl border-2 bg-paper px-4 text-[15px] text-navy outline-none transition-colors",
            error
              ? "border-red-300 focus:border-red-400"
              : "border-slate-200 focus:border-blue"
          )}
        />
        {error && (
          <p className="mt-2 text-[12px] font-medium text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={processing}
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-green text-[15px] font-bold text-white transition-all hover:bg-green-dark active:scale-[0.99] disabled:opacity-60"
        >
          {processing ? "Bezig…" : "Inloggen"}
        </button>
      </form>
    </div>
  );
}
