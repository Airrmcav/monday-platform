import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <main
      role="status"
      aria-live="polite"
      className="mx-auto flex min-h-[58vh] w-full max-w-5xl items-center justify-center py-8"
    >
      <section className="relative w-full overflow-hidden rounded-2xl border border-[#d9e5f7] bg-linear-to-br from-[#f8fbff] via-surface to-[#eef5ff] p-6 shadow-(--shadow-panel) sm:p-9">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-28 h-64 w-64 rounded-full border-30 border-[#dcecff]/70"
        />
        <div
          aria-hidden="true"
          className="absolute right-24 top-10 h-2.5 w-2.5 rounded-full bg-[#579dff]"
        />

        <div className="relative mx-auto flex max-w-lg flex-col items-center text-center">
          <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/10 bg-white text-primary shadow-sm">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-2xl bg-primary-soft/50 motion-safe:animate-pulse"
            />
            <LoaderCircle
              aria-hidden="true"
              size={29}
              className="relative animate-spin motion-reduce:animate-none"
            />
          </span>

          <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-primary motion-safe:animate-pulse"
            />
            MYCAV Services
          </span>

          <h1 className="mt-3 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Preparando tu espacio de trabajo
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Estamos cargando la página. En un momento estará lista.
          </p>

          <div
            aria-hidden="true"
            className="mt-8 grid w-full grid-cols-3 gap-3"
          >
            <div className="h-16 rounded-xl border border-white/80 bg-white/70 p-3">
              <div className="h-2 w-1/2 rounded-full bg-primary-soft motion-safe:animate-pulse" />
              <div className="mt-3 h-3 w-2/3 rounded-full bg-[#e6edf8] motion-safe:animate-pulse" />
            </div>
            <div className="h-16 rounded-xl border border-white/80 bg-white/70 p-3">
              <div className="h-2 w-2/3 rounded-full bg-primary-soft motion-safe:animate-pulse" />
              <div className="mt-3 h-3 w-1/2 rounded-full bg-[#e6edf8] motion-safe:animate-pulse" />
            </div>
            <div className="h-16 rounded-xl border border-white/80 bg-white/70 p-3">
              <div className="h-2 w-1/3 rounded-full bg-primary-soft motion-safe:animate-pulse" />
              <div className="mt-3 h-3 w-3/4 rounded-full bg-[#e6edf8] motion-safe:animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
