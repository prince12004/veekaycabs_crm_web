"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, X, Loader2, Tags } from "lucide-react";
import toast from "react-hot-toast";
import { leadsApi, leadTypesApi } from "@/lib/api";
import { isSuperAdmin } from "@/lib/auth";
import { ACTIVE_STATUSES, SOURCES, STATUS_COLORS, defaultBadge } from "@/lib/leadOptions";
import LeadTypeSelect from "@/components/LeadTypeSelect";
import LeadTypesManager, { type LeadTypeRow } from "@/components/LeadTypesManager";

// Lost leads have their own Super Admin section, so they aren't offered here.
const STATUSES = ACTIVE_STATUSES.filter((s) => s !== "Lost");
const PAGE_SIZE = 20;

// Dashboard cards link here with one of these set.
const QUICK_FILTERS: Record<string, string> = {
  contacted: "Contacted (call or WhatsApp logged)",
  followUpDue: "Follow-ups due",
  slaBreached: "Had an SLA breach",
};

interface LeadRow {
  _id: string; leadCode: string; name: string; mobile: string; source: string;
  status: string; priority: string; createdAt: string; leadType?: string;
  assignedTo?: { name: string } | null;
}

function LeadsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [leadTypeFilter, setLeadTypeFilter] = useState("");
  const [quickFilter, setQuickFilter] = useState(
    Object.keys(QUICK_FILTERS).find((k) => searchParams.get(k) === "true") || ""
  );
  const [typeRows, setTypeRows] = useState<LeadTypeRow[]>([]);
  const leadTypes = typeRows.map((t) => t.name);
  const [showTypes, setShowTypes] = useState(false);
  const [canManageTypes, setCanManageTypes] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(searchParams.get("create") === "1");
  const [form, setForm] = useState({
    name: "", mobile: "", email: "", source: "Manual", pickupLocation: "",
    dropLocation: "", travelDate: "", vehicleRequirement: "", notes: "", leadType: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadLeadTypes = useCallback(() => {
    leadTypesApi.getAll().then(({ data }) => setTypeRows(data.data || [])).catch(() => {});
  }, []);

  useEffect(() => { loadLeadTypes(); setCanManageTypes(isSuperAdmin()); }, [loadLeadTypes]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Search runs on the server so it covers every page, not just this one.
  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
    if (statusFilter) params.status = statusFilter;
    if (leadTypeFilter) params.leadType = leadTypeFilter;
    if (quickFilter) params[quickFilter] = "true";
    if (debouncedSearch) params.search = debouncedSearch;
    leadsApi.getAll(params)
      .then(({ data }) => { setLeads(data.data || []); setPages(data.pages || 1); setTotal(data.total || 0); })
      .catch(() => toast.error("Failed to load leads"))
      .finally(() => setLoading(false));
  }, [page, statusFilter, leadTypeFilter, quickFilter, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { setPage(1); }, [statusFilter, leadTypeFilter, quickFilter, debouncedSearch]);

  const clearQuickFilter = () => {
    setQuickFilter("");
    router.replace("/leads");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.mobile) { toast.error("Name and mobile are required"); return; }
    setSubmitting(true);
    try {
      await leadsApi.create(form);
      toast.success("Lead created");
      setShowCreate(false);
      setForm({ name: "", mobile: "", email: "", source: "Manual", pickupLocation: "", dropLocation: "", travelDate: "", vehicleRequirement: "", notes: "", leadType: "" });
      router.replace("/leads");
      load();
      loadLeadTypes();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create lead");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-20 lg:pb-2">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e6531c]">Customer pipeline</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#191b23]">Leads</h1>
          <p className="mt-1 text-sm text-[#777d89]">{total.toLocaleString("en-IN")} total enquiries</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManageTypes && (
            <button onClick={() => setShowTypes(true)} className="flex items-center gap-2 rounded-xl border border-[#dfe2e7] bg-white px-4 py-2.5 text-sm font-bold text-[#4d5360] transition hover:border-[#f15a24]/50 hover:text-[#dc4e1b]">
              <Tags size={16} /> Manage types
            </button>
          )}
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-xl bg-[#f15a24] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#dd4e1b]">
            <Plus size={16} /> Add lead
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl border border-[#e7e9ed] bg-white p-3.5 shadow-[0_2px_8px_rgba(24,28,40,0.025)] sm:p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9096a2]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, mobile, lead ID..."
            className="w-full rounded-xl border border-[#e1e3e8] bg-[#fbfbfc] py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#f15a24] focus:bg-white focus:ring-4 focus:ring-[#f15a24]/10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-[#e1e3e8] bg-white px-3 py-2.5 text-sm text-[#454b58] outline-none transition focus:border-[#f15a24] focus:ring-4 focus:ring-[#f15a24]/10">
          <option value="">All Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={leadTypeFilter} onChange={(e) => setLeadTypeFilter(e.target.value)} aria-label="Lead type filter"
          className="rounded-xl border border-[#e1e3e8] bg-white px-3 py-2.5 text-sm text-[#454b58] outline-none transition focus:border-[#f15a24] focus:ring-4 focus:ring-[#f15a24]/10">
          <option value="">All Lead Types</option>
          <option value="none">Not set</option>
          {leadTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {quickFilter && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#858b97]">Showing:</span>
          <button onClick={clearQuickFilter}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#f15a24]/30 bg-[#fff1e9] px-3 py-1.5 font-bold text-[#db4d16] transition hover:bg-[#ffe4d6]">
            {QUICK_FILTERS[quickFilter]} <X size={12} />
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#e7e9ed] bg-white shadow-[0_2px_8px_rgba(24,28,40,0.025)]">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#9096a2]"><Loader2 size={20} className="animate-spin text-[#f15a24]" /></div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#858b97]">No leads found</div>
        ) : (
          <div className="table-scroll max-h-[60dvh] min-h-[280px] overflow-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-[#e8e9ed] bg-[#f7f8fa] text-left text-[10px] font-bold uppercase tracking-[0.14em] text-[#818794]">
                  <th className="w-20 px-4 py-3">S.No</th>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Lead Type</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l, i) => {
                  const badge = STATUS_COLORS[l.status] || defaultBadge;
                  return (
                    <tr key={l._id} onClick={() => router.push(`/leads/${l._id}`)}
                      className={`cursor-pointer border-b border-[#eff0f3] transition-colors hover:bg-[#fff5ef] ${i % 2 === 1 ? "bg-[#fafbfc]" : "bg-white"}`}>
                      <td className="px-4 py-3"><span className="serial-number">{(page - 1) * PAGE_SIZE + i + 1}</span></td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#262a34]">{l.name}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-[#9297a2]">{l.leadCode}</p>
                      </td>
                      <td className="px-4 py-3 text-[#4A4A6A]">{l.mobile}</td>
                      <td className="px-4 py-3 text-[#4A4A6A] text-xs">{l.source}</td>
                      <td className="px-4 py-3">
                        <LeadTypeSelect
                          leadId={l._id}
                          value={l.leadType}
                          types={leadTypes}
                          onSaved={(leadType) => {
                            setLeads((rows) => rows.map((r) => (r._id === l._id ? { ...r, leadType } : r)));
                            loadLeadTypes();
                          }}
                          className="w-40 rounded-lg border border-[#e1e3e8] bg-white px-2 py-1.5 text-xs text-[#363b47] outline-none transition hover:border-[#f15a24]/50 focus:border-[#f15a24]"
                        />
                      </td>
                      <td className="px-4 py-3 text-[#4A4A6A] text-xs">{l.assignedTo?.name || "Unassigned"}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: badge.bg, color: badge.text }}>{l.status}</span>
                      </td>
                      <td className="px-4 py-3 text-[#9090A8] text-xs">{new Date(l.createdAt).toLocaleDateString("en-IN")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-xl border border-[#e1e3e8] bg-white px-3.5 py-2 font-semibold text-[#555b68] transition hover:border-[#f15a24]/50 disabled:opacity-40">Previous</button>
          <span className="text-xs font-semibold text-[#747987]">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded-xl border border-[#e1e3e8] bg-white px-3.5 py-2 font-semibold text-[#555b68] transition hover:border-[#f15a24]/50 disabled:opacity-40">Next</button>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl my-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#0F0F1A] text-lg">Add Lead</h3>
              <button onClick={() => setShowCreate(false)} className="text-[#9090A8] hover:text-[#0F0F1A]"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input required placeholder="Customer Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" />
                <input required placeholder="Mobile Number" value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                  className="border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" />
                <select value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                  className="border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
                  {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input placeholder="Pickup Location" value={form.pickupLocation} onChange={(e) => setForm((f) => ({ ...f, pickupLocation: e.target.value }))}
                  className="border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" />
                <input placeholder="Drop Location" value={form.dropLocation} onChange={(e) => setForm((f) => ({ ...f, dropLocation: e.target.value }))}
                  className="border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input type="date" value={form.travelDate} onChange={(e) => setForm((f) => ({ ...f, travelDate: e.target.value }))}
                  className="border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" />
                <input placeholder="Vehicle Requirement" value={form.vehicleRequirement} onChange={(e) => setForm((f) => ({ ...f, vehicleRequirement: e.target.value }))}
                  className="border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" />
              </div>
              <select aria-label="Lead Type" value={form.leadType} onChange={(e) => setForm((f) => ({ ...f, leadType: e.target.value }))}
                className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
                <option value="">Lead Type (optional)</option>
                {leadTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea placeholder="Notes" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none resize-none" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl border-2 border-[#E4E5EF] font-bold text-sm text-[#4A4A6A]">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl bg-[#E8540A] hover:bg-[#c94508] text-white font-bold text-sm disabled:opacity-60">
                  {submitting ? "Creating..." : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTypes && (
        <LeadTypesManager
          types={typeRows}
          onChanged={() => { loadLeadTypes(); load(); }}
          onClose={() => setShowTypes(false)}
        />
      )}
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={null}>
      <LeadsContent />
    </Suspense>
  );
}
