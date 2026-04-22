import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isAuthenticated } from "@/lib/auth";
import { useAuth, API_BASE } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { MapPin, Calendar } from "lucide-react";

export const Route = createFileRoute("/pipeline")({
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Pipeline — Brand Partner" },
      { name: "description", content: "Track your sales pipeline." },
    ],
  }),
  component: PipelinePage,
});

type Deal = {
  id: string;
  name: string;
  city: string;
  state: string;
  project: string;
  budget: string;
  date: string;
};

type Column = {
  key: string;
  title: string;
  tint: string;
  deals: Deal[];
};

const COLUMN_DEFS: Omit<Column, "deals">[] = [
  { key: "Yet to contact", title: "Yet to contact", tint: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300" },
  { key: "Follow-up",      title: "Follow-up",      tint: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  { key: "Qualified",      title: "Qualified",      tint: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  { key: "Won",            title: "Won",             tint: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  { key: "Lost",           title: "Lost",            tint: "bg-red-500/15 text-red-600 dark:text-red-400" },
  { key: "Disqualified",   title: "Disqualified",   tint: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400" },
];

const STATUS_MAP: Record<string, string> = {
  pending:      "Yet to contact",
  contacted:    "Follow-up",
  "follow-up":  "Follow-up",
  followup:     "Follow-up",
  qualified:    "Qualified",
  converted:    "Won",
  won:          "Won",
  lost:         "Lost",
  disqualified: "Disqualified",
};

function PipelinePage() {
  const { token } = useAuth();
  const [columns, setColumns] = useState<Column[]>(COLUMN_DEFS.map((c) => ({ ...c, deals: [] })));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/api/brand-partners/leads`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(({ leads }: { leads: { uniqueId: string; name: string; city: string; state: string; project: string; budget: string; status: string; createdAt: string }[] }) => {
        setColumns(COLUMN_DEFS.map((def) => ({
          ...def,
          deals: leads
            .filter((l) => STATUS_MAP[l.status?.toLowerCase()] === def.key)
            .map((l) => ({
              id: l.uniqueId,
              name: l.name,
              city: l.city === "N/A" ? "" : l.city,
              state: l.state === "N/A" ? "" : l.state,
              project: l.project === "N/A" ? "" : l.project,
              budget: l.budget === "N/A" ? "" : l.budget,
              date: new Date(l.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
            })),
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const grand = columns.reduce((a, c) => a + c.deals.length, 0);

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading…" : `${grand} active deals across ${columns.length} stages`}
          </p>
        </div>

        <div className="flex flex-1 gap-4 overflow-x-auto pb-8 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-muted [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/50">
          {columns.map((col) => (
            <div
              key={col.key}
              className="flex w-72 shrink-0 flex-col rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${col.tint}`}>
                  {col.title}
                </span>
                <span className="text-xs text-muted-foreground">{col.deals.length}</span>
              </div>

              <div className="space-y-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {col.deals.map((d) => (
                  <div
                    key={d.id}
                    className="cursor-pointer rounded-xl border border-border bg-background p-3 transition-shadow hover:shadow-[var(--shadow-card)]"
                  >
                    <div>
                      <div className="text-sm font-semibold text-foreground">{d.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{d.id}</div>
                      {d.project && <div className="mt-0.5 text-xs text-muted-foreground truncate">{d.project}</div>}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {d.budget && (
                        <span>{isNaN(Number(d.budget)) ? d.budget : `₹ ${Number(d.budget).toLocaleString("en-IN")}`}</span>
                      )}
                      {d.city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{d.city}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{d.date}
                      </span>
                    </div>
                  </div>
                ))}

                {!loading && col.deals.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    No deals
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
