"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, Power, KeyRound, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { usersApi } from "@/lib/api";
import { getCrmUser } from "@/lib/auth";

interface CrmUserRow {
  _id: string; name: string; email: string; mobile?: string; role: string;
  isActive: boolean; openLeadCount: number; createdAt: string;
}

export default function SalespersonsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<CrmUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "", role: "salesperson" });
  const [submitting, setSubmitting] = useState(false);
  const [resetFor, setResetFor] = useState<CrmUserRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [resetting, setResetting] = useState(false);

  const load = () => {
    setLoading(true);
    usersApi.getAll().then(({ data }) => setUsers(data.data || [])).catch(() => toast.error("Failed to load users")).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (getCrmUser()?.role !== "super_admin") { router.replace("/dashboard"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await usersApi.create(form);
      toast.success("User created");
      setShowCreate(false);
      setForm({ name: "", email: "", mobile: "", password: "", role: "salesperson" });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const openReset = (u: CrmUserRow) => {
    setResetFor(u); setNewPassword(""); setConfirmPassword(""); setShowNew(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetFor) return;
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    setResetting(true);
    try {
      await usersApi.update(resetFor._id, { password: newPassword });
      toast.success(`Password reset for ${resetFor.name}`);
      setResetFor(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await usersApi.toggle(id);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update");
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-20 lg:pb-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e6531c]">Team management</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#191b23]">Salespersons</h1>
          <p className="mt-1 text-sm text-[#777d89]">{users.length} CRM team members</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-xl bg-[#f15a24] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#dd4e1b]">
          <Plus size={16} /> Add team member
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e7e9ed] bg-white shadow-[0_2px_8px_rgba(24,28,40,0.025)]">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#9096a2]"><Loader2 size={20} className="animate-spin text-[#f15a24]" /></div>
        ) : (
          <div className="table-scroll max-h-[60dvh] overflow-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-[#e8e9ed] bg-[#f7f8fa] text-left text-[10px] font-bold uppercase tracking-[0.14em] text-[#818794]">
                <th className="w-20 px-4 py-3">S.No</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Open Leads</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u._id} className={`border-b border-[#eff0f3] ${i % 2 === 1 ? "bg-[#fafbfc]" : "bg-white"}`}>
                  <td className="px-4 py-3"><span className="serial-number">{i + 1}</span></td>
                  <td className="px-4 py-3 font-bold text-[#262a34]">{u.name}</td>
                  <td className="px-4 py-3 text-[#4A4A6A]">{u.email}</td>
                  <td className="px-4 py-3 text-[#4A4A6A] capitalize">{u.role.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-[#4A4A6A]">{u.openLeadCount}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.isActive ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEE2E2] text-[#991B1B]"}`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                      <button onClick={() => openReset(u)} className="flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-[#4A4A6A] hover:text-[#E8540A]">
                        <KeyRound size={13} /> Reset password
                      </button>
                      <button onClick={() => handleToggle(u._id)} className="flex items-center gap-1 text-xs font-semibold text-[#4A4A6A] hover:text-[#E8540A]">
                        <Power size={13} /> {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#0F0F1A] text-lg">Add User</h3>
              <button onClick={() => setShowCreate(false)} className="text-[#9090A8] hover:text-[#0F0F1A]"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <input required placeholder="Full Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" />
              <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" />
              <input placeholder="Mobile (optional)" value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" />
              <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none" />
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
                <option value="salesperson">Salesperson</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-[#E8540A] hover:bg-[#c94508] text-white font-bold text-sm disabled:opacity-60">
                {submitting ? "Creating..." : "Create User"}
              </button>
            </form>
          </div>
        </div>
      )}

      {resetFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <form onSubmit={handleReset} className="w-full max-w-md space-y-3 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#0F0F1A]">Reset password</h3>
                <p className="text-xs text-[#858b97]">{resetFor.name} · {resetFor.email}</p>
              </div>
              <button type="button" onClick={() => setResetFor(null)} aria-label="Close" className="text-[#9090A8] hover:text-[#0F0F1A]"><X size={20} /></button>
            </div>
            <div className="relative">
              <input autoFocus required minLength={8} type={showNew ? "text" : "password"} autoComplete="new-password" placeholder="New password (min 8 characters)"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} aria-label="New password"
                className="w-full rounded-xl border-[1.5px] border-[#E4E5EF] px-3 py-2.5 pr-11 text-sm outline-none focus:border-[#E8540A]" />
              <button type="button" onClick={() => setShowNew((v) => !v)} aria-label={showNew ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[#9ba0ab] hover:bg-[#f5f6f8]">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <input required type={showNew ? "text" : "password"} autoComplete="new-password" placeholder="Confirm new password"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} aria-label="Confirm new password"
              className="w-full rounded-xl border-[1.5px] border-[#E4E5EF] px-3 py-2.5 text-sm outline-none focus:border-[#E8540A]" />
            <p className="text-xs leading-5 text-[#858b97]">They&apos;ll be signed out everywhere and must sign in with the new password. Share it with them directly.</p>
            <button type="submit" disabled={resetting} className="w-full rounded-xl bg-[#E8540A] py-3 text-sm font-bold text-white hover:bg-[#c94508] disabled:opacity-60">
              {resetting ? "Saving..." : "Reset password"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
