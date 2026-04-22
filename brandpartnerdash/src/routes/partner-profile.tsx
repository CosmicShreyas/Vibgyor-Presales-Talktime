import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { isAuthenticated } from "@/lib/auth";
import { useAuth, API_BASE } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  CreditCard,
  Pencil,
  Check,
  X,
} from "lucide-react";

export const Route = createFileRoute("/partner-profile")({
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Partner Profile — Brand Partner" },
      { name: "description", content: "Your partner profile." },
    ],
  }),
  component: PartnerProfilePage,
});

type FullProfile = {
  _id: string;
  partnerName: string;
  nickName: string;
  contactPerson1: string;
  phoneNo1: string;
  contactPerson2?: string;
  phoneNo2?: string;
  email: string;
  address: string;
  about?: string;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  pan: string;
  partnerCode: string;
  paymentTerms?: string;
  remarks?: string;
  isActive: boolean;
  createdAt: string;
  memberSince?: string;
};

function initials(name?: string) {
  if (!name) return "BP";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function PartnerProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(id);
  }, [error]);
  const [editingAbout, setEditingAbout] = useState(false);
  const [aboutDraft, setAboutDraft] = useState("");
  const [savingAbout, setSavingAbout] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/brand-partners/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load profile");
        return r.json() as Promise<FullProfile>;
      })
      .then(setProfile)
      .catch((e: Error) => setError(e.message));
  }, [token]);

  const p = profile;

  async function saveAbout() {
    if (!token || !p) return;
    setSavingAbout(true);
    try {
      const res = await fetch(`${API_BASE}/api/brand-partners/profile/about`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ about: aboutDraft }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setProfile({ ...p, about: aboutDraft });
      setEditingAbout(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSavingAbout(false);
    }
  }

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-6">
        {/* Hero */}
        <div
          className="relative overflow-hidden rounded-2xl p-8 text-white shadow-[var(--shadow-card)]"
          style={{ backgroundImage: "var(--gradient-hero)" }}
        >
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 text-3xl font-bold backdrop-blur">
              {p ? initials(p.partnerName) : <Skeleton className="h-10 w-10 rounded bg-white/20" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {p ? (
                  <>
                    <h1 className="text-2xl font-extrabold">{p.partnerName}</h1>
                    {p.nickName && (
                      <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-sm font-medium text-white/90">
                        {p.nickName}
                      </span>
                    )}
                  </>
                ) : (
                  <Skeleton className="h-7 w-48 rounded bg-white/20" />
                )}
                {p?.isActive && <CheckCircle2 className="h-5 w-5 text-white" />}
              </div>
              <div className="mt-1 text-sm text-white/80">
                {p ? (
                  <>
                    {p.partnerCode}
                    {p.memberSince && (
                      <> · Member since {new Date(p.memberSince).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</>
                    )}
                  </>
                ) : <Skeleton className="mt-1 h-4 w-64 rounded bg-white/20" />}
              </div>
              {p && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className="border-0 bg-white/20 text-white">Verified</Badge>
                  {p.isActive && <Badge className="border-0 bg-white/20 text-white">Active</Badge>}
                  {p.partnerCode && <Badge className="border-0 bg-white/20 text-white">{p.partnerCode}</Badge>}
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* About */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">About</h2>
                {p && !editingAbout && (
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setAboutDraft(p.about ?? ""); setEditingAbout(true); setTimeout(() => textareaRef.current?.focus(), 0); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {editingAbout ? (
                <div className="mt-3 space-y-3">
                  <textarea
                    ref={textareaRef}
                    value={aboutDraft}
                    onChange={(e) => setAboutDraft(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Write something about your business…"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingAbout(false)}>
                      <X className="mr-1 h-3.5 w-3.5" /> Cancel
                    </Button>
                    <Button size="sm" onClick={saveAbout} disabled={savingAbout}>
                      <Check className="mr-1 h-3.5 w-3.5" /> {savingAbout ? "Saving…" : "Save"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  {p ? (p.about || "No description yet. Click the pencil icon to add one.") : <Skeleton className="h-4 w-full rounded" />}
                </p>
              )}
            </section>
            <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-semibold">Partner Details</h2>
              <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                {([
                  ["Partner Name", p?.partnerName],
                  ["Nick Name", p?.nickName],
                  ["Contact Person 1", p?.contactPerson1],
                  ["Contact Person 2", p?.contactPerson2],
                  ["PAN", p?.pan],
                  ["Payment Terms", p?.paymentTerms],
                  ["Address", p?.address],
                ] as [string, string | undefined][]).map(([label, value]) => (
                  value !== undefined && value !== "" ? (
                    <div key={label} className={label === "Address" || label === "About" ? "sm:col-span-2" : ""}>
                      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                      <dd className="mt-0.5 font-medium text-foreground">{value || "—"}</dd>
                    </div>
                  ) : !p ? (
                    <div key={label}>
                      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                      <dd className="mt-0.5"><Skeleton className="h-4 w-32 rounded" /></dd>
                    </div>
                  ) : null
                ))}
              </dl>
            </section>

            {/* Bank Details */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" /> Bank Details
              </h2>
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                {([
                  ["Bank Name", p?.bankName],
                  ["IFSC Code", p?.ifscCode],
                  ["Account Holder", p?.accountHolderName],
                  ["Account Number", p?.accountNumber ? `••••${p.accountNumber.slice(-4)}` : undefined],
                ] as [string, string | undefined][]).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                    <dd className="mt-0.5 font-medium text-foreground">
                      {value ?? <Skeleton className="h-4 w-32 rounded" />}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-semibold">Contact</h2>
              <ul className="mt-3 space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {p ? <span>{p.email}</span> : <Skeleton className="h-4 w-40 rounded" />}
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {p ? <span>{p.contactPerson1} · {p.phoneNo1}</span> : <Skeleton className="h-4 w-32 rounded" />}
                </li>
                {p?.contactPerson2 && p.phoneNo2 && (
                  <li className="flex items-center gap-3">
                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{p.contactPerson2} · {p.phoneNo2}</span>
                  </li>
                )}
                <li className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  {p ? <span>{p.address}</span> : <Skeleton className="h-4 w-48 rounded" />}
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
