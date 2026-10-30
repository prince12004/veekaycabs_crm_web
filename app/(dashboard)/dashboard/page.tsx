"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, UserPlus, PhoneCall, Heart, CalendarClock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
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
    { label: "Total Leads", value: stats?.total, icon: Users, color: "#0F0F1A" },
    { label: "New Leads", value: stats?.newLeads, icon: UserPlus, color: "#E8540A" },
    { label: "Contacted", value: stats?.contacted, icon: PhoneCall, color: "#3B82F6" },
    { label: "Interested", value: stats?.interested, icon: Heart, color: "#8B5CF6" },
    { label: "Follow-ups Due", value: stats?.followUpsDue, icon: CalendarClock, color: "#F59E0B" },
    { label: "SLA Breaches", value: stats?.slaBreaches, icon: AlertTriangle, color: "#EF4444" },
    { label: "Bookings", value: stats?.booked, icon: CheckCircle2, color: "#10B981" },
    { label: "Lost", value: stats?.lost, icon: XCircle, color: "#9090A8" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#0F0F1A]">
          {user?.role === "super_admin" ? "CRM Dashboard" : "My Dashboard"}
        </h1>
        <p className="text-[#9090A8] text-sm mt-0.5">
          {user?.role === "super_admin" ? "Fleet-wide lead and sales performance" : "Your assigned leads and follow-ups"}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiles.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}18` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <p className="text-2xl font-black text-[#0F0F1A]">{value ?? "—"}</p>
            <p className="text-[#9090A8] text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Link href="/leads?create=1" className="bg-[#E8540A] hover:bg-[#c94508] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
          + Add Lead
        </Link>
        <Link href="/leads" className="border border-[#E4E5EF] hover:border-[#E8540A]/40 text-[#4A4A6A] font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
          View All Leads
        </Link>
      </div>
    </div>
  );
}
