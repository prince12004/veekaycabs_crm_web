"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { leadsApi } from "@/lib/api";

const STATUSES = [
  "New", "Assigned", "Contacted", "Interested", "Follow-up", "Quotation Sent",
  "Booking Pending", "Booking Confirmed", "No Response", "Not Interested",
  "Wrong Number", "Duplicate", "Invalid Lead", "Customer Issue", "Price Issue",
  "Payment Issue", "Service Issue", "Service Unavailable", "Other Issue",
  "Lost", "Cancelled",
];
const SOURCES = ["Meta Ads", "Google Ads", "SEO/Organic", "Website", "WhatsApp", "Phone Call", "JustDial", "Referral", "Manual"];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "New": { bg: "#DBEAFE", text: "#1E40AF" },
  "Assigned": { bg: "#EDE9FE", text: "#5B21B6" },
  "Contacted": { bg: "#FEF3C7", text: "#92400E" },
  "Interested": { bg: "#D1FAE5", text: "#065F46" },
  "Booking Confirmed": { bg: "#D1FAE5", text: "#065F46" },
};
const defaultBadge = { bg: "#F1F2F7", text: "#4A4A6A" };

interface LeadRow {
  _id: string; leadCode: string; name: string; mobile: string; source: string;
  status: string; priority: string; createdAt: string;
  assignedTo?: { name: string } | null;
}

function LeadsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(searchParams.get("create") === "1");
  const [form, setForm] = useState({
    name: "", mobile: "", email: "", source: "Manual", pickupLocation: "",
    dropLocation: "", travelDate: "", vehicleRequirement: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    leadsApi.getAll(params)
      .then(({ data }) => { setLeads(data.data || []); setPages(data.pages || 1); setTotal(data.total || 0); })
      .catch(() => toast.error("Failed to load leads"))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  useEffect(() => { setPage(1); }, [statusFilter, search]);

  const filtered = leads.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.name.toLowerCase().includes(q) || l.mobile.includes(q) || l.leadCode.toLowerCase().includes(q);
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.mobile) { toast.error("Name and mobile are required"); return; }
    setSubmitting(true);
    try {
      await leadsApi.create(form);
      toast.success("Lead created");
      setShowCreate(false);
      setForm({ name: "", mobile: "", email: "", source: "Manual", pickupLocation: "", dropLocation: "", travelDate: "", vehicleRequirement: "", notes: "" });
      router.replace("/leads");
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create lead");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A]">Leads</h1>
          <p className="text-[#9090A8] text-sm">{total} total</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-[#E8540A] hover:bg-[#c94508] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
          <Plus size={16} /> Add Lead
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, mobile, lead ID..."
            className="w-full pl-9 pr-3 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border-[1.5px] border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:border-[#E8540A] outline-none bg-white">
          <option value="">All Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#9090A8]"><Loader2 size={20} className="animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[#9090A8] text-sm">No leads found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF] text-left text-[10px] font-bold uppercase tracking-widest text-[#9090A8]">
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => {
                  const badge = STATUS_COLORS[l.status] || defaultBadge;
                  return (
                    <tr key={l._id} onClick={() => router.push(`/leads/${l._id}`)}
                      className={`border-b border-[#E4E5EF] hover:bg-[#FFF3ED] cursor-pointer transition-colors ${i % 2 === 1 ? "bg-[#F8F9FC]/50" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#0F0F1A]">{l.name}</p>
                        <p className="text-[#9090A8] text-xs font-mono">{l.leadCode}</p>
                      </td>
                      <td className="px-4 py-3 text-[#4A4A6A]">{l.mobile}</td>
                      <td className="px-4 py-3 text-[#4A4A6A] text-xs">{l.source}</td>
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
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg border border-[#E4E5EF] disabled:opacity-40">Prev</button>
          <span className="text-[#4A4A6A]">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg border border-[#E4E5EF] disabled:opacity-40">Next</button>
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
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Customer Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" />
                <input required placeholder="Mobile Number" value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                  className="border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" />
                <select value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                  className="border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
                  {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Pickup Location" value={form.pickupLocation} onChange={(e) => setForm((f) => ({ ...f, pickupLocation: e.target.value }))}
                  className="border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" />
                <input placeholder="Drop Location" value={form.dropLocation} onChange={(e) => setForm((f) => ({ ...f, dropLocation: e.target.value }))}
                  className="border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={form.travelDate} onChange={(e) => setForm((f) => ({ ...f, travelDate: e.target.value }))}
                  className="border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" />
                <input placeholder="Vehicle Requirement" value={form.vehicleRequirement} onChange={(e) => setForm((f) => ({ ...f, vehicleRequirement: e.target.value }))}
                  className="border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" />
              </div>
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
