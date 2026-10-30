"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users2, ListTodo, LogOut } from "lucide-react";
import { getCrmUser, logout, type CrmSessionUser } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, superAdminOnly: false },
  { href: "/leads", label: "Leads", icon: ListTodo, superAdminOnly: false },
  { href: "/salespersons", label: "Salespersons", icon: Users2, superAdminOnly: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CrmSessionUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("crm_token") : null;
    const u = getCrmUser();
    if (!token || !u) {
      router.replace("/login");
      return;
    }
    setUser(u);
    setChecked(true);
  }, [router]);

  if (!checked) return null;

  return (
    <div className="min-h-screen flex bg-[#F8F9FC]">
      <aside className="w-60 shrink-0 bg-[#0F0F1A] text-white flex flex-col">
        <div className="p-5 border-b border-white/10">
          <p className="font-black text-lg">Veekay CRM</p>
          <p className="text-white/50 text-xs mt-0.5">Lead Management</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.filter((n) => !n.superAdminOnly || user?.role === "super_admin").map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  active ? "bg-[#E8540A] text-white" : "text-white/70 hover:bg-white/10"
                }`}
              >
                <Icon size={16} /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-semibold">{user?.name}</p>
            <p className="text-white/40 text-xs capitalize">{user?.role?.replace("_", " ")}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
