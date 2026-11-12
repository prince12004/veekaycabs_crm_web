"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Archive, CalendarX, Loader2, Plus, RotateCcw, Search, Undo2, X } from "lucide-react";
import toast from "react-hot-toast";
import { leadsApi, leadTypesApi } from "@/lib/api";
import { getCrmUser } from "@/lib/auth";
import { ACTIVE_STATUSES, SOURCES } from "@/lib/leadOptions";

const PAGE_SIZE = 20;
const RESTORE_STATUSES = ACTIVE_STATUSES.filter((s) => s !== "Lost");
const inputCls = "w-full rounded-xl border border-[#e1e3e8] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#f15a24] focus:ring-4 focus:ring-[#f15a24]/10";

interface LostLead {
  _id: string; leadCode: string; name: string; mobile: string; source: string; leadType?: string;
  reason?: string; lostAt: string; lostBy: string | null; assignedTo?: { name: string } | null;
}
interface Summary { total: number; lostThisMonth: number; restoredThisMonth: number }
interface ActiveLead { _id: string; leadCode: string; name: string; mobile: string; status: string }

type Modal = { type: "add" } | { type: "restore"; lead: LostLead } | null;

export default function LostLeadsPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [leads, setLeads] = useState<LostLead[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [source, setSource] = useState("");
  const [leadType, setLeadType] = useState("");
  const [leadTypes, setLeadTypes] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [modal, setModal] = useState<Modal>(null);
  const [lookup, setLookup] = useState("");
  const [matches, setMatches] = useState<ActiveLead[]>([]);
  const [picked, setPicked] = useState<ActiveLead | null>(null);
  const [reason, setReason] = useState("");
  const [restoreTo, setRestoreTo] = useState("Follow-up");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (getCrmUser()?.role !== "super_admin") { router.replace("/dashboard"); return; }
    setAllowed(true);
    leadTypesApi.getAll().then(({ data }) => setLeadTypes((data.data || []).map((t: { name: string }) => t.name))).catch(() => {});
  }, [router]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, source, leadType]);

  const load = useCallback(() => {
    if (!allowed) return;
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
    if (debouncedSearch) params.search = debouncedSearch;
    if (source) params.source = source;
    if (leadType) params.leadType = leadType;
    leadsApi.getLost(params)
      .then(({ data }) => {
        setLeads(data.data || []);
        setSummary(data.summary);
        setPages(data.pages || 1);
        setTotal(data.total || 0);
      })
      .catch(() => toast.error("Failed to load lost leads"))
      .finally(() => setLoading(false));
  }, [allowed, page, debouncedSearch, source, leadType]);

  useEffect(() => { load(); }, [load]);

  // Finds leads still in the pipeline to move into Lost.
  useEffect(() => {
    if (modal?.type !== "add" || lookup.trim().length < 2) { setMatches([]); return; }
    const t = setTimeout(() => {
      leadsApi.getAll({ search: lookup.trim(), limit: 8 })
        .then(({ data }) => setMatches(data.data || []))
        .catch(() => setMatches([]));
    }, 300);
    return () => clearTimeout(t);
  }, [lookup, modal]);

  const openModal = (next: Modal) => {
    setLookup(""); setMatches([]); setPicked(null); setReason(""); setRestoreTo("Follow-up");
    setModal(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    setSaving(true);
    try {
      if (modal.type === "add") {
        if (!picked) { toast.error("Pick a lead first"); return; }
        if (!reason.trim()) { toast.error("A reason is required"); return; }
        await leadsApi.update(picked._id, { status: "Lost", reason: reason.trim() });
        toast.success(`${picked.name} moved to Lost Leads`);
      } else {
        await leadsApi.update(modal.lead._id, { status: restoreTo });
        toast.success(`${modal.lead.name} restored as ${restoreTo}`);
      }
      openModal(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (!allowed) return null;

  const tiles = [
    { label: "Lost leads", value: summary?.total, icon: Archive, color: "#d64a42" },
    { label: "Lost this month", value: summary?.lostThisMonth, icon: CalendarX, color: "#c27a1b" },
    { label: "Restored this month", value: summary?.restoredThisMonth, icon: Undo2, color: "#31945c" },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-20 lg:pb-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e6531c]">Super Admin</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#191b23]">Lost Leads</h1>
          <p className="mt-1 text-sm text-[#777d89]">Leads marked Lost leave the main list and are kept here.</p>
        </div>
        <button onClick={() => openModal({ type: "add" })} className="flex items-center gap-2 rounded-xl bg-[#f15a24] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#dd4e1b]">
          <Plus size={16} /> Move lead to Lost
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tiles.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-[#e7e9ed] bg-white p-5 shadow-[0_2px_8px_rgba(24,28,40,0.025)]">
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold text-[#777d89]">{label}</p>
              <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${color}14` }}>
                <Icon size={17} style={{ color }} />
              </span>
            </div>
            <p className="mt-4 text-3xl font-black tracking-tight text-[#20232d]">{value ?? "—"}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl border border-[#e7e9ed] bg-white p-3.5 shadow-[0_2px_8px_rgba(24,28,40,0.025)] sm:p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9096a2]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, mobile, lead ID, reason..."
            className={inputCls + " bg-[#fbfbfc] pl-9"} />
        </div>
        <select value={source} onChange={(e) => setSource(e.target.value)} aria-label="Source filter" className="rounded-xl border border-[#e1e3e8] bg-white px-3 py-2.5 text-sm text-[#454b58] outline-none focus:border-[#f15a24]">
          <option value="">All Sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={leadType} onChange={(e) => setLeadType(e.target.value)} aria-label="Lead type filter" className="rounded-xl border border-[#e1e3e8] bg-white px-3 py-2.5 text-sm text-[#454b58] outline-none focus:border-[#f15a24]">
          <option value="">All Lead Types</option>
          <option value="none">Not set</option>
          {leadTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e7e9ed] bg-white shadow-[0_2px_8px_rgba(24,28,40,0.025)]">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={20} className="animate-spin text-[#f15a24]" /></div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#858b97]">No lost leads found</div>
        ) : (
          <div className="table-scroll max-h-[60dvh] min-h-[240px] overflow-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-[#e8e9ed] bg-[#f7f8fa] text-left text-[10px] font-bold uppercase tracking-[0.14em] text-[#818794]">
                  <th className="w-20 px-4 py-3">S.No</th>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Lead Type</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Lost On</th>
                  <th className="px-4 py-3">Lost By</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l, i) => (
                  <tr key={l._id} className={`border-b border-[#eff0f3] ${i % 2 === 1 ? "bg-[#fafbfc]" : "bg-white"}`}>
                    <td className="px-4 py-3"><span className="serial-number">{(page - 1) * PAGE_SIZE + i + 1}</span></td>
                    <td className="px-4 py-3">
                      <Link href={`/leads/${l._id}`} className="font-bold text-[#262a34] hover:text-[#dc4e1b] hover:underline">{l.name}</Link>
                      <p className="mt-0.5 font-mono text-[11px] text-[#9297a2]">{l.leadCode}</p>
                    </td>
                    <td className="px-4 py-3 text-[#4A4A6A]">{l.mobile}</td>
                    <td className="px-4 py-3 text-xs text-[#4A4A6A]">{l.source}</td>
                    <td className="px-4 py-3 text-xs text-[#4A4A6A]">{l.leadType || "—"}</td>
                    <td className="max-w-[240px] px-4 py-3 text-xs text-[#4A4A6A]">{l.reason || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[#9090A8]">{new Date(l.lostAt).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3 text-xs text-[#4A4A6A]">{l.lostBy || l.assignedTo?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openModal({ type: "restore", lead: l })}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#e1e3e8] px-2.5 py-1.5 text-xs font-bold text-[#4d5360] transition hover:border-[#f15a24]/50 hover:text-[#dc4e1b]">
                        <RotateCcw size={13} /> Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-xl border border-[#e1e3e8] bg-white px-3.5 py-2 font-semibold text-[#555b68] transition hover:border-[#f15a24]/50 disabled:opacity-40">Previous</button>
          <span className="text-xs font-semibold text-[#747987]">Page {page} of {pages} · {total} leads</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded-xl border border-[#e1e3e8] bg-white px-3.5 py-2 font-semibold text-[#555b68] transition hover:border-[#f15a24]/50 disabled:opacity-40">Next</button>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-8">
          <form onSubmit={submit} className="my-auto w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0F0F1A]">{modal.type === "add" ? "Move lead to Lost" : `Restore ${modal.lead.name}`}</h3>
              <button type="button" onClick={() => openModal(null)} aria-label="Close" className="text-[#9090A8] hover:text-[#0F0F1A]"><X size={20} /></button>
            </div>

            {modal.type === "add" ? (
              <>
                {picked ? (
                  <div className="flex items-center justify-between rounded-xl border border-[#e1e3e8] bg-[#fafbfc] px-3 py-2.5 text-sm">
                    <div>
                      <p className="font-bold text-[#262a34]">{picked.name}</p>
                      <p className="text-xs text-[#9297a2]">{picked.leadCode} · {picked.mobile} · {picked.status}</p>
                    </div>
                    <button type="button" onClick={() => setPicked(null)} className="text-xs font-bold text-[#dc4e1b]">Change</button>
                  </div>
                ) : (
                  <div>
                    <input autoFocus value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder="Search lead by name, mobile or lead ID" className={inputCls} />
                    {matches.length > 0 && (
                      <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-[#e7e9ed]">
                        {matches.map((m) => (
                          <button key={m._id} type="button" onClick={() => setPicked(m)}
                            className="block w-full border-b border-[#f0f1f3] px-3 py-2 text-left text-sm last:border-0 hover:bg-[#fff5ef]">
                            <span className="font-bold text-[#262a34]">{m.name}</span>
                            <span className="ml-2 text-xs text-[#9297a2]">{m.leadCode} · {m.mobile} · {m.status}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {lookup.trim().length >= 2 && matches.length === 0 && <p className="mt-2 text-xs text-[#9297a2]">No matching active lead.</p>}
                  </div>
                )}
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} required placeholder="Why was this lead lost?" className={inputCls + " resize-none"} />
              </>
            ) : (
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4A4A6A]">Move back as</label>
                <select value={restoreTo} onChange={(e) => setRestoreTo(e.target.value)} className={inputCls}>
                  {RESTORE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <p className="mt-2 text-xs text-[#9297a2]">The lead returns to the leads list with its current owner. Its history stays in the timeline.</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => openModal(null)} className="flex-1 rounded-xl border-2 border-[#E4E5EF] py-3 text-sm font-bold text-[#4A4A6A]">Cancel</button>
              <button type="submit" disabled={saving || (modal.type === "add" && !picked)} className="flex-1 rounded-xl bg-[#E8540A] py-3 text-sm font-bold text-white hover:bg-[#c94508] disabled:opacity-60">
                {saving ? "Saving..." : modal.type === "add" ? "Move to Lost" : "Restore"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
