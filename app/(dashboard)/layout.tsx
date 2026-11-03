"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Users2, ListTodo, LogOut, ShieldCheck } from "lucide-react";
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

  if (!checked) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f5f0]">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#f15a24]/20 border-t-[#f15a24]" />
      </div>
    );
  }

  const pageName = NAV.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.label
    || "Lead details";
  const initials = user?.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "VK";

  return (
    <div className="flex h-[100dvh] min-h-0 overflow-hidden bg-[#f5f2eb]">
      <aside className="hidden h-full w-[260px] shrink-0 flex-col border-r border-[#e9e3d8] bg-[#fffefa] lg:flex">
        <Link href="/dashboard" className="flex h-[88px] items-center border-b border-[#eee8dd] px-6">
          <Image src="/logo.png" alt="Veekay Cabs" width={497} height={91} priority className="h-auto w-[190px]" />
        </Link>
        <div className="px-6 pb-3 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9499a5]">Workspace</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.filter((n) => !n.superAdminOnly || user?.role === "super_admin").map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors ${
                  active ? "bg-[#fff1e9] text-[#db4d16]" : "text-[#626878] hover:bg-[#f5f6f8] hover:text-[#171923]"
                }`}
              >
                {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-[#f15a24]" />}
                <Icon size={18} strokeWidth={active ? 2.4 : 1.9} /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[#eee8dd] p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-[#f7f8fa] p-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#fff0e8] text-sm font-extrabold text-[#e6531c]">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#20232d]">{user?.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] capitalize text-[#7d8390]">
                <ShieldCheck size={12} /> {user?.role?.replace("_", " ")}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#697080] transition-colors hover:bg-[#fff1e9] hover:text-[#db4d16]"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-20 flex h-[68px] shrink-0 items-center justify-between border-b border-[#e9e3d8] bg-[#fffefa]/95 px-4 backdrop-blur sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/dashboard" className="lg:hidden">
              <Image src="/logo.png" alt="Veekay Cabs" width={497} height={91} priority className="h-auto w-[145px]" />
            </Link>
            <div className="hidden items-center gap-2 text-sm sm:flex">
              <span className="text-[#959aa6]">CRM</span>
              <span className="text-[#c2c6ce]">/</span>
              <span className="font-bold text-[#242733]">{pageName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-[#697080] sm:gap-3">
            <span className="hidden rounded-full border border-[#d9efe1] bg-[#f0faf3] px-3 py-1.5 text-[#28804a] sm:inline-flex sm:items-center sm:gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#32a85a]" /> Workspace active
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#fff0e8] font-extrabold text-[#e6531c]">{initials}</div>
            <span className="hidden max-w-[150px] truncate sm:block">{user?.name}</span>
          </div>
        </header>
        <section className="dashboard-content min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-7 sm:py-7 lg:px-9">
          {children}
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-[68px] border-t border-[#e9e3d8] bg-[#fffefa]/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(25,30,42,0.06)] backdrop-blur lg:hidden">
        {NAV.filter((n) => !n.superAdminOnly || user?.role === "super_admin").map((n) => {
          const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
          const Icon = n.icon;
          return (
            <Link key={n.href} href={n.href} className={`flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold ${active ? "text-[#e6531c]" : "text-[#858b98]"}`}>
              <Icon size={19} strokeWidth={active ? 2.4 : 1.9} />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
