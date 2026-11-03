"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, UserPlus, PhoneCall, Heart, CalendarClock, AlertTriangle, CheckCircle2, XCircle, ArrowUpRight, Plus } from "lucide-react";
import { leadsApi } from "@/lib/api";
import { getCrmUser } from "@/lib/auth";

interface Stats {
  total: number; newLeads: number; contacted: number; interested: number;
  followUpsDue: number; slaBreaches: number; booked: number; lost: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const user = getCrmUser();

  useEffect(() => {
    leadsApi.getStats().then(({ data }) => setStats(data.data)).catch(() => {});
  }, []);

  const tiles = [
    { label: "Total leads", value: stats?.total, icon: Users, color: "#263248" },
    { label: "New leads", value: stats?.newLeads, icon: UserPlus, color: "#e6531c" },
    { label: "Contacted", value: stats?.contacted, icon: PhoneCall, color: "#3973c6" },
    { label: "Interested", value: stats?.interested, icon: Heart, color: "#8461c9" },
    { label: "Follow-ups due", value: stats?.followUpsDue, icon: CalendarClock, color: "#c27a1b" },
    { label: "SLA breaches", value: stats?.slaBreaches, icon: AlertTriangle, color: "#d64a42" },
    { label: "Bookings", value: stats?.booked, icon: CheckCircle2, color: "#31945c" },
    { label: "Lost", value: stats?.lost, icon: XCircle, color: "#7e8490" },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e6531c]">Overview</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#191b23]">
            {user?.role === "super_admin" ? "CRM Dashboard" : "My Dashboard"}
          </h1>
          <p className="mt-1.5 text-sm text-[#777d89]">
            {user?.role === "super_admin" ? "A clear view of your leads and sales activity." : "Your assigned leads and upcoming follow-ups."}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/leads" className="inline-flex items-center gap-2 rounded-xl border border-[#dfe2e7] bg-white px-4 py-2.5 text-sm font-bold text-[#4d5360] transition hover:border-[#f15a24]/50 hover:text-[#dc4e1b]">
            View leads <ArrowUpRight size={16} />
          </Link>
          <Link href="/leads?create=1" className="inline-flex items-center gap-2 rounded-xl bg-[#f15a24] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#dd4e1b]">
            <Plus size={16} /> Add lead
          </Link>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-[26px] border border-[#e9dfcc] bg-gradient-to-br from-[#fffefa] via-[#fbf7ee] to-[#f2e8d8] p-6 text-[#202a3a] shadow-[0_16px_38px_rgba(50,45,34,0.07)] sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full border border-[#c8ae7b]/20" />
        <div className="pointer-events-none absolute -right-2 -top-14 h-44 w-44 rounded-full border border-[#f15a24]/20" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a67c3c]">Veekay Cabs · CRM</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Good work starts with a clear view.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#74716a]">Stay on top of customer enquiries and move every journey forward.</p>
          </div>
          <div className="hidden h-16 w-16 items-center justify-center rounded-2xl border border-[#e6dac4] bg-white/70 text-[#b38244] sm:flex">
            <Users size={30} />
          </div>
        </div>
      </section>

      <div>
        <div className="mb-4">
          <h2 className="text-base font-extrabold text-[#252833]">Lead performance</h2>
          <p className="mt-1 text-xs text-[#858b97]">Current activity across your CRM</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tiles.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="group rounded-2xl border border-[#e7e9ed] bg-white p-5 shadow-[0_2px_8px_rgba(24,28,40,0.025)] transition hover:-translate-y-0.5 hover:border-[#f15a24]/35 hover:shadow-[0_12px_28px_rgba(24,28,40,0.07)]">
              <div className="flex items-start justify-between">
                <p className="text-xs font-bold text-[#777d89]">{label}</p>
                <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${color}14` }}>
                  <Icon size={17} style={{ color }} />
                </span>
              </div>
              <p className="mt-4 text-3xl font-black tracking-tight text-[#20232d]">{value ?? "—"}</p>
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[#f0f1f3]">
                <div className="h-full w-1/3 rounded-full" style={{ backgroundColor: color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
