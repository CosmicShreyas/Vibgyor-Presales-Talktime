import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  Users,
  PhoneCall,
  RefreshCw,
  CheckCircle2,
  UserX,
  Ban,
  Trophy,
  ArrowUpRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { isAuthenticated, useAuth, API_BASE } from "@/lib/auth";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Dashboard — Brand Partner" },
      { name: "description", content: "Partner performance overview: leads, follow-ups, and pipeline." },
    ],
  }),
  component: Dashboard,
});

const ranges = [
  { label: "Monthly", period: "monthly" },
  { label: "Quarterly", period: "quarterly" },
  { label: "Year to date", period: "ytd" },
] as const;

type Stats = {
  totalLeads: number;
  yetToContact: number;
  followUp: number;
  qualified: number;
  disqualified: number;
  lost: number;
  won: number;
};

function Dashboard() {
  const { token, brandPartner } = useAuth();
  const [partnerName, setPartnerName] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/brand-partners/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setPartnerName(data.partnerName ?? data.contactPerson1 ?? null))
      .catch(() => {});
  }, [token]);
  const [range, setRange] = useState<(typeof ranges)[number]>(ranges[0]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_BASE}/api/brand-partners/leads/statistics?period=${range.period}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => { if (data.success) setStats(data.statistics); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, range]);

  const cards = stats
    ? [
        { label: "Total leads", value: stats.totalLeads, description: "Across all current and past opportunities", icon: Users },
        { label: "Yet to contact", value: stats.yetToContact, description: "Largest bucket that needs immediate action", icon: PhoneCall },
        { label: "Follow-up", value: stats.followUp, description: "Warm leads waiting for the next touchpoint", icon: RefreshCw },
        { label: "Qualified", value: stats.qualified, description: "High-intent leads ready to move ahead", icon: CheckCircle2 },
        { label: "Disqualified", value: stats.disqualified, description: "Leads removed due to mismatch or drop-off", icon: UserX },
        { label: "Lost", value: stats.lost, description: "Closed opportunities that did not convert", icon: Ban },
        { label: "Won", value: stats.won, description: "Converted into confirmed business", icon: Trophy },
      ]
    : [];

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Partner performance</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Welcome</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              A quick summary of your lead flow, follow-ups, and project pipeline for this week.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/leads">
              <ArrowUpRight className="h-4 w-4" /> View all leads
            </Link>
          </Button>
        </div>

        {/* Hero card */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6 text-white shadow-[var(--shadow-card)]"
          style={{ backgroundImage: "var(--gradient-hero)" }}
        >
          <div>
            <h2 className="text-2xl font-bold">{partnerName ?? brandPartner?.name ?? "—"}</h2>
            <p className="mt-1 text-sm text-white/80">Brand Partner | 24 Aug 2023</p>
          </div>
          <div className="flex rounded-full bg-white/15 p-1 backdrop-blur">
            {ranges.map((r) => (
              <button
                key={r.period}
                onClick={() => setRange(r)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  range.period === r.period ? "bg-white text-primary" : "text-white/90 hover:text-white"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stat grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
