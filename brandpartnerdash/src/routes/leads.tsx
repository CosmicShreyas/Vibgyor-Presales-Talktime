import { createFileRoute, redirect } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import { useAuth, API_BASE } from "@/lib/auth";
import { useMemo, useRef, useState, useEffect } from "react";
import { Search, Filter, Plus, MoreHorizontal, Upload, X, FileText, Pencil, Eye, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/leads")({
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Leads — Brand Partner" },
      { name: "description", content: "Manage all leads in one place." },
    ],
  }),
  component: LeadsPage,
});

type Priority = "Low" | "Medium" | "High";
type Status = "Yet to contact" | "Follow-up" | "Qualified" | "Won" | "Lost" | "Disqualified";

const statusStyles: Record<Status, string> = {
  "Yet to contact": "bg-muted text-muted-foreground",
  "Follow-up": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Qualified: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  Won: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  Lost: "bg-red-500/15 text-red-600 dark:text-red-400",
  Disqualified: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
};

const priorityStyles: Record<Priority, string> = {
  Low: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
  Medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  High: "bg-red-500/15 text-red-600 dark:text-red-400",
};

type Lead = {
  id: string;
  name: string;
  phone: string;
  altPhone: string;
  email: string;
  project: string;
  address: string;
  city: string;
  state: string;
  budget: string;
  priority: Priority;
  remarks: string;
  status: Status;
  createdAt: string;
  createdAtRaw: string;
};

const PHONE_RE = /^[6-9]\d{9,10}$/;

function validatePhone(v: string) {
  const digits = v.replace(/\D/g, "");
  return PHONE_RE.test(digits) ? "" : "Enter a valid 10–11 digit mobile number";
}

type Errors = Partial<Record<keyof Lead, string>>;

function validateDraft(d: Omit<Lead, "id" | "createdAt" | "createdAtRaw" | "status">): Errors {
  const e: Errors = {};
  if (!d.name.trim()) e.name = "Required";
  if (!d.phone.trim()) e.phone = "Required";
  else { const err = validatePhone(d.phone); if (err) e.phone = err; }
  if (d.altPhone.trim()) { const err = validatePhone(d.altPhone); if (err) e.altPhone = err; }
  if (!d.project.trim()) e.project = "Required";
  if (!d.address.trim()) e.address = "Required";
  if (!d.city.trim()) e.city = "Required";
  if (!d.state.trim()) e.state = "Required";
  if (!d.budget.trim()) e.budget = "Required";
  else if (!/^\d+(\.\d+)?$/.test(d.budget.trim())) e.budget = "Must be a number";
  if (!d.email.trim()) e.email = "Required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) e.email = "Enter a valid email";
  return e;
}

const filters: ("All" | Status)[] = ["All", "Yet to contact", "Follow-up", "Qualified", "Disqualified"];

const emptyDraft: Omit<Lead, "id" | "createdAt" | "createdAtRaw" | "status"> = {
  name: "", phone: "", altPhone: "", email: "", project: "", address: "", city: "", state: "", budget: "", priority: "Medium", remarks: "",
};

function mapStatus(s: string): Status | null {
  const map: Record<string, Status> = {
    pending:      "Yet to contact",
    contacted:    "Follow-up",
    "follow-up":  "Follow-up",
    followup:     "Follow-up",
    qualified:    "Qualified",
    disqualified: "Disqualified",
  };
  return map[s.toLowerCase()] ?? null;
}

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 text-xs text-destructive">{msg}</p> : null;
}

function LeadFormFields({
  draft, errors, onChange,
}: {
  draft: Omit<Lead, "id" | "createdAt" | "createdAtRaw" | "status">;
  errors: Errors;
  onChange: (patch: Partial<Omit<Lead, "id" | "createdAt" | "createdAtRaw" | "status">>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <Label>Name <span className="text-destructive">*</span></Label>
        <Input value={draft.name} maxLength={100} onChange={(e) => onChange({ name: e.target.value })} className="mt-1.5" />
        <FieldError msg={errors.name} />
      </div>
      <div>
        <Label>Phone <span className="text-destructive">*</span></Label>
        <Input value={draft.phone} maxLength={11} onChange={(e) => onChange({ phone: e.target.value })} className="mt-1.5" />
        <FieldError msg={errors.phone} />
      </div>
      <div>
        <Label>Alternate Phone</Label>
        <Input value={draft.altPhone} maxLength={11} onChange={(e) => onChange({ altPhone: e.target.value })} className="mt-1.5" />
        <FieldError msg={errors.altPhone} />
      </div>
      <div className="col-span-2">
        <Label>Email <span className="text-destructive">*</span></Label>
        <Input type="email" value={draft.email} onChange={(e) => onChange({ email: e.target.value })} className="mt-1.5" />
        <FieldError msg={errors.email} />
      </div>
      <div className="col-span-2">
        <Label>Project <span className="text-destructive">*</span></Label>
        <Input value={draft.project} maxLength={100} onChange={(e) => onChange({ project: e.target.value })} className="mt-1.5" />
        <div className="mt-1 flex justify-between">
          <FieldError msg={errors.project} />
          <span className="text-xs text-muted-foreground">{draft.project.length}/100</span>
        </div>
      </div>
      <div className="col-span-2">
        <Label>Address <span className="text-destructive">*</span></Label>
        <Input value={draft.address} maxLength={200} onChange={(e) => onChange({ address: e.target.value })} className="mt-1.5" />
        <div className="mt-1 flex justify-between">
          <FieldError msg={errors.address} />
          <span className="text-xs text-muted-foreground">{draft.address.length}/200</span>
        </div>
      </div>
      <div>
        <Label>City <span className="text-destructive">*</span></Label>
        <Input value={draft.city} maxLength={50} onChange={(e) => onChange({ city: e.target.value })} className="mt-1.5" />
        <FieldError msg={errors.city} />
      </div>
      <div>
        <Label>State <span className="text-destructive">*</span></Label>
        <Input value={draft.state} maxLength={50} onChange={(e) => onChange({ state: e.target.value })} className="mt-1.5" />
        <FieldError msg={errors.state} />
      </div>
      <div>
        <Label>Budget (₹) <span className="text-destructive">*</span></Label>
        <Input value={draft.budget} maxLength={10} onChange={(e) => onChange({ budget: e.target.value })} className="mt-1.5" placeholder="e.g. 500000" />
        <FieldError msg={errors.budget} />
      </div>
      <div>
        <Label>Priority</Label>
        <Select value={draft.priority} onValueChange={(v) => onChange({ priority: v as Priority })}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(["Low", "Medium", "High"] as Priority[]).map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2">
        <Label>Remarks</Label>
        <textarea
          value={draft.remarks}
          maxLength={500}
          onChange={(e) => onChange({ remarks: e.target.value })}
          rows={3}
          className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
          placeholder="Optional notes…"
        />
        <div className="mt-1 text-right text-xs text-muted-foreground">{draft.remarks.length}/500</div>
      </div>
    </div>
  );
}

function LeadsPage() {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Lead["status"] | "All">("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addDraft, setAddDraft] = useState<Omit<Lead, "id" | "createdAt" | "createdAtRaw" | "status">>(emptyDraft);
  const [addErrors, setAddErrors] = useState<Errors>({});
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [editDraft, setEditDraft] = useState<Lead | null>(null);
  const [editErrors, setEditErrors] = useState<Errors>({});
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [allRows, setAllRows] = useState<Lead[]>([]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_BASE}/api/brand-partners/leads`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch leads");
        return r.json() as Promise<{ leads: { name: string; uniqueId: string; phone?: string; alternatePhone?: string; email?: string; address?: string; city: string; state: string; project: string; budget: string; priority: string; status: string; createdAt: string }[] }>;
      })
      .then(({ leads }) => {
        const mapped = leads.flatMap((l) => {
          const status = mapStatus(l.status);
          if (!status) return [];
          return [{
            id: l.uniqueId,
            name: l.name,
            phone: l.phone ?? "",
            altPhone: l.alternatePhone ?? "",
            email: l.email ?? "",
            project: l.project === "N/A" ? "" : l.project,
            address: l.address === "N/A" ? "" : (l.address ?? ""),
            city: l.city === "N/A" ? "" : l.city,
            state: l.state === "N/A" ? "" : l.state,
            budget: l.budget === "N/A" ? "" : l.budget,
            priority: (l.priority.charAt(0).toUpperCase() + l.priority.slice(1)) as Priority,
            remarks: "",
            status,
            createdAt: new Date(l.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
            createdAtRaw: l.createdAt,
          }];
        });
        setRows(mapped);
        setAllRows(mapped);
      })
      .catch((e: Error) => setFetchError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const csvs = Array.from(incoming).filter((f) => f.name.endsWith(".csv"));
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...csvs.filter((f) => !names.has(f.name))];
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  }

  async function handleImport() {
    if (!files.length || !token) return;
    setImporting(true);
    setImportResult(null);
    try {
      const form = new FormData();
      form.append("csvFile", files[0]);
      const res = await fetch(`${API_BASE}/api/brand-partners/leads/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json() as { success: number; failed: number; errors: string[]; message?: string };
      setImportResult({ success: data.success ?? 0, failed: data.failed ?? 0, errors: data.errors ?? [] });
      if (res.ok) { setFiles([]); }
    } catch {
      setImportResult({ success: 0, failed: 0, errors: ["Network error. Please try again."] });
    } finally {
      setImporting(false);
    }
  }

  async function submitAdd() {
    const errs = validateDraft(addDraft);
    if (Object.keys(errs).length) { setAddErrors(errs); return; }
    setAddSubmitting(true);
    try {
      const payload = {
        leads: [{
          name: addDraft.name,
          phone: addDraft.phone,
          alternatePhone: addDraft.altPhone,
          email: addDraft.email,
          project: addDraft.project,
          address: addDraft.address,
          city: addDraft.city,
          state: addDraft.state,
          remarks: addDraft.remarks,
        }],
      };
      const res = await fetch(`${API_BASE}/api/brand-partners/leads/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { success: number; failed: number; errors: string[] };
      if (res.ok && data.success > 0) {
        // Optimistically add to local list
        setRows((prev) => [{
          ...addDraft,
          id: `L-${1000 + prev.length + 1}`,
          status: "Yet to contact",
          createdAt: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          createdAtRaw: new Date().toISOString(),
        }, ...prev]);
        setAddDraft(emptyDraft);
        setAddErrors({});
        setAddOpen(false);
      } else {
        setAddErrors({ name: data.errors?.[0] ?? "Failed to submit lead" });
      }
    } catch {
      setAddErrors({ name: "Network error. Please try again." });
    } finally {
      setAddSubmitting(false);
    }
  }

  async function submitEdit() {
    if (!editDraft || !token) return;
    const errs = validateDraft(editDraft);
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    try {
      const res = await fetch(`${API_BASE}/api/brand-partners/leads/${editDraft.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: editDraft.name,
          city: editDraft.city,
          state: editDraft.state,
          project: editDraft.project,
          budget: editDraft.budget,
          remarks: editDraft.remarks,
        }),
      });
      if (!res.ok) throw new Error("Failed to update lead");
      setRows((prev) => prev.map((r) => r.id === editDraft.id ? editDraft : r));
      setEditErrors({});
      setEditLead(null);
    } catch (e: unknown) {
      setEditErrors({ name: e instanceof Error ? e.message : "Update failed" });
    }
  }

  const filtered = useMemo(() => rows.filter((l) => {
    const matchesStatus = active === "All" || l.status === active;
    const q = query.toLowerCase();
    return matchesStatus && (!q || l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q) || l.project.toLowerCase().includes(q) || l.id.toLowerCase().includes(q));
  }), [query, active, rows]);

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Leads</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {rows.length} total leads · {rows.filter((l) => l.status === "Yet to contact").length} need first contact
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 cursor-pointer"><Plus className="h-4 w-4" /> New lead</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setAddOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Enter manually
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" /> Import CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* CSV Upload Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setFiles([]); setImportResult(null); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Import leads from CSV</DialogTitle>
              <DialogDescription className="text-xs">
                Expected columns: <code>name, phone, altPhone, project, address, city, state, budget, priority, remarks</code>
              </DialogDescription>
            </DialogHeader>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 px-6 py-10 text-center transition-colors hover:border-primary hover:bg-accent/40"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Drop CSV files here or click to browse</p>
              <p className="text-xs text-muted-foreground">Only .csv files · multiple allowed</p>
              <input ref={inputRef} type="file" accept=".csv" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
            </div>
            {files.length > 0 && (
              <ul className="space-y-2">
                {files.map((f) => (
                  <li key={f.name} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <span className="flex-1 truncate text-sm text-foreground">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</span>
                    <button onClick={() => setFiles((p) => p.filter((x) => x.name !== f.name))} className="text-muted-foreground hover:text-foreground" aria-label="Remove file">
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {importResult && (
              <div className={`rounded-lg border px-4 py-3 text-sm ${importResult.failed > 0 ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>
                <p className="font-medium">
                  {importResult.success > 0 && `✓ ${importResult.success} lead(s) imported successfully`}
                  {importResult.failed > 0 && ` · ${importResult.failed} failed`}
                </p>
                {importResult.errors.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs">
                    {importResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); setFiles([]); setImportResult(null); }}>
                {importResult ? "Close" : "Cancel"}
              </Button>
              {!importResult && (
                <Button onClick={handleImport} disabled={files.length === 0 || importing} className="gap-2">
                  <Upload className="h-4 w-4" />
                  {importing ? "Importing…" : `Import ${files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""}` : ""}`}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Lead Dialog */}
        <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) { setAddErrors({}); setAddDraft(emptyDraft); } }}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <DialogHeader>
              <DialogTitle>Add new lead</DialogTitle>
              <DialogDescription>Fields marked <span className="text-destructive">*</span> are required</DialogDescription>
            </DialogHeader>
            <LeadFormFields draft={addDraft} errors={addErrors} onChange={(p) => setAddDraft((d) => ({ ...d, ...p }))} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={submitAdd} disabled={addSubmitting}>{addSubmitting ? "Submitting…" : "Add lead"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, city, project…" className="pl-9" />
          </div>
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={`gap-2 ${appliedFrom || appliedTo ? "border-primary text-primary" : ""}`}>
                <Filter className="h-4 w-4" /> Filters{appliedFrom || appliedTo ? " •" : ""}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-5" align="end">
              <p className="mb-4 text-sm font-semibold text-foreground">Filter by date</p>
              <div className="flex flex-col gap-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">From</Label>
                  <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="mt-1.5 w-full" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">To</Label>
                  <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="mt-1.5 w-full" />
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-2">
                <Button
                  className="w-full"
                  disabled={!filterFrom || !filterTo}
                  onClick={() => {
                    if (!filterFrom || !filterTo) return;
                    const from = new Date(filterFrom);
                    const to = new Date(filterTo + "T23:59:59");
                    setRows(allRows.filter((l) => {
                      const d = new Date(l.createdAtRaw);
                      return d >= from && d <= to;
                    }));
                    setAppliedFrom(filterFrom);
                    setAppliedTo(filterTo);
                    setFilterOpen(false);
                  }}
                >
                  {"Submit"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setFilterFrom(""); setFilterTo(""); setAppliedFrom(""); setAppliedTo(""); setRows(allRows); setFilterOpen(false); }}
                >
                  Clear
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button key={f} onClick={() => setActive(f)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${active === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>
              {f}
            </button>
          ))}
        </div>

        {fetchError && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{fetchError}</div>
        )}

        <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">Loading leads…</TableCell>
                </TableRow>
              ) : filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{l.name}</div>
                    <div className="text-xs text-muted-foreground">{l.id} · {l.city}, {l.state}</div>
                  </TableCell>
                  <TableCell className="text-sm">{l.project}</TableCell>
                  <TableCell className="text-sm font-medium">₹ {Number(l.budget).toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <Badge className={`${priorityStyles[l.priority]} border-0 font-medium`}>{l.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${statusStyles[l.status]} border-0 font-medium`}>{l.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{l.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewLead(l)}><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditLead(l); setEditDraft({ ...l }); setEditErrors({}); }}><Pencil className="h-4 w-4" /></Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(l.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No leads match your filters.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewLead} onOpenChange={(o) => !o && setViewLead(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader>
            <DialogTitle>{viewLead?.name}</DialogTitle>
            <DialogDescription>{viewLead?.id} · {viewLead?.city}, {viewLead?.state}</DialogDescription>
          </DialogHeader>
          {viewLead && (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {([
                ["Phone", viewLead.phone],
                ["Alt Phone", viewLead.altPhone || "—"],
                ["Project", viewLead.project],
                ["Address", viewLead.address],
                ["City", viewLead.city],
                ["State", viewLead.state],
                ["Budget", `₹ ${Number(viewLead.budget).toLocaleString("en-IN")}`],
                ["Priority", viewLead.priority],
                ["Status", viewLead.status],
                ["Remarks", viewLead.remarks || "—"],
                ["Created", viewLead.createdAt],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className={label === "Address" || label === "Remarks" || label === "Project" ? "col-span-2" : ""}>
                  <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewLead(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editLead} onOpenChange={(o) => { if (!o) { setEditLead(null); setEditErrors({}); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader>
            <DialogTitle>Edit lead</DialogTitle>
            <DialogDescription>{editLead?.id}</DialogDescription>
          </DialogHeader>
          {editDraft && (
            <LeadFormFields
              draft={editDraft}
              errors={editErrors}
              onChange={(p) => setEditDraft((d) => d ? { ...d, ...p } : d)}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLead(null)}>Cancel</Button>
            <Button onClick={submitEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete lead?</DialogTitle>
            <DialogDescription>
              This will permanently remove <span className="font-medium text-foreground">{rows.find((r) => r.id === deleteId)?.name}</span> ({deleteId}). This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
              if (!deleteId || !token) return;
              try {
                const res = await fetch(`${API_BASE}/api/brand-partners/leads/${deleteId}`, {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Failed to delete");
                setRows((p) => p.filter((r) => r.id !== deleteId));
              } catch { /* silently ignore, lead stays in list */ }
              setDeleteId(null);
            }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
