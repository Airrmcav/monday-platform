import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="px-6 py-12 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted text-muted-foreground">
        <Icon aria-hidden="true" size={21} />
      </span>

      <h3 className="mt-4 text-sm font-semibold">{title}</h3>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export function DashboardNotice({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-8 shadow-(--shadow-panel)">
      <h1 className="text-xl font-semibold">{title}</h1>

      <p role="alert" className="mt-2 text-muted-foreground">
        {message}
      </p>
    </section>
  );
}
