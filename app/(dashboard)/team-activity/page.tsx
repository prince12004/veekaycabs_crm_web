"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleDot, Clock3, Inbox, LogOut, PauseCircle, Radio, UserCheck } from "lucide-react";
import { presenceApi } from "@/lib/api";
import { getCrmUser } from "@/lib/auth";

const REFRESH_MS = 10 * 1000;

type Status = "active" | "inactive" | "busy" | "logged_out" | "disabled";
interface Member {
  _id: string; name: string; email: string; status: Status;
  lastActiveAt: string | null; loggedOutAt: string | null; logoutReason: string | null;
  receivingNext: boolean; assigned: number; pending: number; contacted: number; converted: number; missed: number;
}
interface TeamResponse {
  data: Member[]; nextSalesperson: { _id: string; name: string } | null;
  waitingLeads: number; idleLogoutMinutes: number; serverTime: string;
}

const STATUS: Record<Status, { label: string; bg: string; text: string; dot: string }> = {
  active: { label: "Active", bg: "#ecf8f0", text: "#1f7a43", dot: "#32a85a" },
  inactive: { label: "Inactive", bg: "#fff8ec", text: "#a1620f", dot: "#e0a03a" },
  busy: { label: "Busy", bg: "#eef2ff", text: "#4338ca", dot: "#6366f1" },
  logged_out: { label: "Logged Out", bg: "#f1f2f5", text: "#5b616e", dot: "#a3a8b3" },
  disabled: { label: "Deactivated", bg: "#fdeeee", text: "#a33a33", dot: "#d64a42" },
};
const ORDER: Status[] = ["active", "busy", "inactive", "logged_out", "disabled"];
const REASONS: Record<string, string> = {
  inactive: "inactive", closed: "closed the CRM", manual: "signed out", deactivated: "deactivated",
};

const ago = (iso: string | null, now: number) => {
  if (!iso) return "Never";
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

function StatusBadge({ status }: { status: Status }) {
  const s = STATUS[status];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: s.bg, color: s.text }}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "active" ? "animate-pulse" : ""}`} style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

export default function TeamActivityPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (getCrmUser()?.role !== "super_admin") { router.replace("/dashboard"); return; }
    setAllowed(true);
  }, [router]);

  const load = useCallback(() => {
    presenceApi.getTeam()
      .then(({ data }) => { setTeam(data); setFailed(false); setNow(Date.now()); })
      .catch(() => setFailed(true));
  }, []);

  // Refreshes on its own so the admin never needs to reload the page.
  useEffect(() => {
    if (!allowed) return;
    load();
    const poll = setInterval(load, REFRESH_MS);
    const tick = setInterval(() => setNow(Date.now()), 15 * 1000);
    return () => { clearInterval(poll); clearInterval(tick); };
  }, [allowed, load]);

  if (!allowed) return null;

  const members = [...(team?.data || [])].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || a.name.localeCompare(b.name));
  const count = (s: Status) => members.filter((m) => m.status === s).length;
  const tiles = [
    { label: "Active", value: count("active"), icon: UserCheck, color: "#31945c" },
    { label: "Busy", value: count("busy"), icon: PauseCircle, color: "#6366f1" },
    { label: "Inactive", value: count("inactive"), icon: Clock3, color: "#c27a1b" },
    { label: "Logged out", value: count("logged_out"), icon: LogOut, color: "#7e8490" },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-20 lg:pb-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e6531c]">Super Admin</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#191b23]">Team Activity</h1>
          <p className="mt-1 text-sm text-[#777d89]">
            Live status of every salesperson. Updates every 10 seconds; idle for {team?.idleLogoutMinutes ?? 5} minutes signs them out.
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${failed ? "border-[#f5c2c2] bg-[#fdeeee] text-[#a33a33]" : "border-[#d9efe1] bg-[#f0faf3] text-[#28804a]"}`}>
          <Radio size={13} className={failed ? "" : "animate-pulse"} /> {failed ? "Reconnecting…" : "Live"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-[#e7e9ed] bg-white p-4 shadow-[0_2px_8px_rgba(24,28,40,0.025)] sm:p-5">
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold text-[#777d89]">{label}</p>
              <span className="grid h-8 w-8 place-items-center rounded-xl" style={{ background: `${color}14` }}><Icon size={16} style={{ color }} /></span>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-[#20232d]">{team ? value : "—"}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl border border-[#e7e9ed] bg-white p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff1e9] text-[#dc4e1b]"><CircleDot size={18} /></span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#777d89]">Receiving the next lead</p>
            <p className="truncate text-sm font-black text-[#20232d]">{team ? team.nextSalesperson?.name || "Nobody available — leads wait with Super Admin" : "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[#e7e9ed] bg-white p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef2ff] text-[#4338ca]"><Inbox size={18} /></span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#777d89]">Leads waiting for a salesperson</p>
            <p className="text-sm font-black text-[#20232d]">{team ? `${team.waitingLeads} — assigned automatically when someone is available` : "—"}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e7e9ed] bg-white shadow-[0_2px_8px_rgba(24,28,40,0.025)]">
        {!team ? (
          <div className="py-16 text-center text-sm text-[#858b97]">{failed ? "Could not load team activity" : "Loading…"}</div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#858b97]">No salespersons yet</div>
        ) : (
          <>
            <ul className="divide-y divide-[#eff0f3] md:hidden">
              {members.map((m) => (
                <li key={m._id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#262a34]">{m.name}</p>
                      <p className="mt-0.5 text-[11px] text-[#9297a2]">
                        {m.status === "logged_out" && m.logoutReason ? `Logged out (${REASONS[m.logoutReason] || m.logoutReason}) · ` : ""}Active {ago(m.lastActiveAt, now)}
                      </p>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                  {m.receivingNext && <p className="mt-2 text-[11px] font-bold text-[#dc4e1b]">● Receiving the next lead</p>}
                  <div className="mt-3 grid grid-cols-5 gap-1 text-center">
                    {([["Assigned", m.assigned], ["Pending", m.pending], ["Contacted", m.contacted], ["Converted", m.converted], ["Missed", m.missed]] as const).map(([k, v]) => (
                      <div key={k} className="rounded-lg bg-[#f7f8fa] py-1.5">
                        <p className="text-sm font-black text-[#20232d]">{v}</p>
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#9297a2]">{k}</p>
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <div className="table-scroll hidden overflow-auto md:block">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-[#e8e9ed] bg-[#f7f8fa] text-left text-[10px] font-bold uppercase tracking-[0.14em] text-[#818794]">
                    <th className="px-4 py-3">Salesperson</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last Active</th>
                    <th className="px-4 py-3 text-right">Assigned</th>
                    <th className="px-4 py-3 text-right">Pending</th>
                    <th className="px-4 py-3 text-right">Contacted</th>
                    <th className="px-4 py-3 text-right">Converted</th>
                    <th className="px-4 py-3 text-right">Missed</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, i) => (
                    <tr key={m._id} className={`border-b border-[#eff0f3] ${m.receivingNext ? "bg-[#fff8f3]" : i % 2 === 1 ? "bg-[#fafbfc]" : "bg-white"}`}>
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#262a34]">{m.name}</p>
                        {m.receivingNext
                          ? <p className="mt-0.5 text-[11px] font-bold text-[#dc4e1b]">● Receiving the next lead</p>
                          : <p className="mt-0.5 text-[11px] text-[#9297a2]">{m.email}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={m.status} />
                        {m.status === "logged_out" && m.logoutReason && (
                          <p className="mt-1 text-[11px] text-[#9297a2]">{REASONS[m.logoutReason] || m.logoutReason} · {ago(m.loggedOutAt, now)}</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-[#4A4A6A]">{ago(m.lastActiveAt, now)}</td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-[#262a34]">{m.assigned}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#a1620f]">{m.pending}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#4A4A6A]">{m.contacted}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#1f7a43]">{m.converted}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#a33a33]">{m.missed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <p className="text-xs leading-5 text-[#858b97]">
        <span className="font-bold">Pending</span> = assigned but not yet called or messaged · <span className="font-bold">Converted</span> = Booking Confirmed · <span className="font-bold">Missed</span> = leads taken away after the SLA ran out.
      </p>
    </div>
  );
}
