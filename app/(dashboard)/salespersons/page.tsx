"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, Power } from "lucide-react";
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

  const handleToggle = async (id: string) => {
    try {
      await usersApi.toggle(id);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A]">Salespersons</h1>
          <p className="text-[#9090A8] text-sm">{users.length} CRM users</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-[#E8540A] hover:bg-[#c94508] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#9090A8]"><Loader2 size={20} className="animate-spin" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF] text-left text-[10px] font-bold uppercase tracking-widest text-[#9090A8]">
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
                <tr key={u._id} className={`border-b border-[#E4E5EF] ${i % 2 === 1 ? "bg-[#F8F9FC]/50" : ""}`}>
                  <td className="px-4 py-3 font-semibold text-[#0F0F1A]">{u.name}</td>
                  <td className="px-4 py-3 text-[#4A4A6A]">{u.email}</td>
                  <td className="px-4 py-3 text-[#4A4A6A] capitalize">{u.role.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-[#4A4A6A]">{u.openLeadCount}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.isActive ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEE2E2] text-[#991B1B]"}`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(u._id)} className="flex items-center gap-1 text-xs font-semibold text-[#4A4A6A] hover:text-[#E8540A]">
                      <Power size={13} /> {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
}
