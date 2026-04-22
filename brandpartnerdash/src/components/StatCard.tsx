import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
}

export function StatCard({ label, value, description, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-stat-card p-5 text-stat-card-foreground shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5">
      <div className="mb-3 flex items-start justify-between">
        <p className="text-sm font-medium text-stat-card-foreground/70">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-card text-foreground shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-4xl font-semibold tracking-tight">{value}</p>
      <p className="mt-3 text-sm text-stat-card-foreground/70">{description}</p>
    </div>
  );
}
