"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { leadTypesApi } from "@/lib/api";

export interface LeadTypeRow { _id: string | null; name: string; leadCount: number }

interface Props {
  types: LeadTypeRow[];
  editable: boolean;
  onChanged: () => void;
  onClose: () => void;
}

const inputCls = "w-full rounded-xl border border-[#e1e3e8] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#f15a24] focus:ring-4 focus:ring-[#f15a24]/10";

// Super Admin's editor for the Lead Type categories.
export default function LeadTypesManager({ types, editable, onChanged, onClose }: Props) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      onChanged();
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not save");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (await run(() => leadTypesApi.create(name), `${name} added`)) setNewName("");
  };

  const rename = async (t: LeadTypeRow) => {
    const name = editName.trim();
    if (!name || name === t.name) { setEditingId(null); return; }
    if (await run(() => leadTypesApi.update(t._id as string, name), `Renamed to ${name}`)) setEditingId(null);
  };

  const remove = (t: LeadTypeRow) => {
    const note = t.leadCount ? ` ${t.leadCount} lead(s) already tagged keep showing it.` : "";
    if (!confirm(`Remove "${t.name}" from the Lead Type list?${note}`)) return;
    run(() => leadTypesApi.remove(t._id as string), `${t.name} removed`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-8">
      <div className="my-auto w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#0F0F1A]">Lead Types</h3>
            <p className="text-xs text-[#858b97]">Categories salespersons can pick for their leads.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-[#9090A8] hover:text-[#0F0F1A]"><X size={20} /></button>
        </div>

        {!editable && (
          <p className="rounded-xl border border-[#fde2b8] bg-[#fff8ec] px-3 py-2.5 text-xs leading-5 text-[#8a5a12]">
            These default types can be used on leads, but the list can&apos;t be edited until the CRM database user is given access to the <code>crm_lead_types</code> collection.
          </p>
        )}

        {editable && <form onSubmit={add} className="flex gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={60} placeholder="New lead type" className={inputCls} />
          <button type="submit" disabled={busy || !newName.trim()} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#f15a24] px-3.5 text-sm font-bold text-white transition hover:bg-[#dd4e1b] disabled:opacity-50">
            <Plus size={15} /> Add
          </button>
        </form>}

        <div className="max-h-[50dvh] divide-y divide-[#f0f1f3] overflow-y-auto rounded-xl border border-[#e7e9ed]">
          {types.length === 0 && <p className="px-3 py-6 text-center text-sm text-[#858b97]">No lead types yet.</p>}
          {types.map((t) => (
            <div key={t._id || t.name} className="flex items-center gap-2 px-3 py-2.5">
              {editingId === t._id ? (
                <>
                  <input autoFocus value={editName} maxLength={60} onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") rename(t); if (e.key === "Escape") setEditingId(null); }}
                    aria-label={`Rename ${t.name}`} className={inputCls} />
                  <button onClick={() => rename(t)} disabled={busy} aria-label="Save" className="rounded-lg p-2 text-[#31945c] hover:bg-[#ecf8f0]"><Check size={16} /></button>
                  <button onClick={() => setEditingId(null)} aria-label="Cancel" className="rounded-lg p-2 text-[#9090A8] hover:bg-[#f5f6f8]"><X size={16} /></button>
                </>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#262a34]">{t.name}</p>
                    <p className="text-[11px] text-[#9297a2]">{t.leadCount} lead{t.leadCount === 1 ? "" : "s"}</p>
                  </div>
                  {editable && t._id && <>
                  <button onClick={() => { setEditingId(t._id); setEditName(t.name); }} aria-label={`Edit ${t.name}`} className="rounded-lg p-2 text-[#4d5360] hover:bg-[#f5f6f8]"><Pencil size={15} /></button>
                  <button onClick={() => remove(t)} disabled={busy} aria-label={`Remove ${t.name}`} className="rounded-lg p-2 text-[#d64a42] hover:bg-[#fdeeee]"><Trash2 size={15} /></button>
                  </>}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
