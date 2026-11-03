"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone, MessageCircle, StickyNote, Loader2, Clock, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import { leadsApi, usersApi } from "@/lib/api";
import { getCrmUser } from "@/lib/auth";

const STATUSES = [
  "New", "Assigned", "Contacted", "Interested", "Follow-up", "Quotation Sent",
  "Booking Pending", "Booking Confirmed", "No Response", "Not Interested",
  "Wrong Number", "Duplicate", "Invalid Lead", "Customer Issue", "Price Issue",
  "Payment Issue", "Service Issue", "Service Unavailable", "Other Issue",
  "Lost", "Cancelled",
];
// Mirrors crm/server Lead.ESCALATION_STATUSES — a salesperson picking one of
// these sends the lead to Super Admin for review.
const ESCALATION = [
  "Not Interested", "Customer Issue", "Price Issue", "Payment Issue",
  "Service Issue", "Service Unavailable", "Other Issue",
];
const SUPER_ADMIN_REVIEW = [...ESCALATION, "Interested"];
const REASON_REQUIRED = [...ESCALATION, "Lost"];

interface SalespersonOption { _id: string; name: string; isActive: boolean; role: string; }

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = getCrmUser();
  const [lead, setLead] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [otherLeads, setOtherLeads] = useState<any[]>([]);
  const [pastBookings, setPastBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [salespersons, setSalespersons] = useState<SalespersonOption[]>([]);
  const [noteText, setNoteText] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    leadsApi.getById(id)
      .then(({ data }) => {
        setLead(data.data.lead);
        setActivities(data.data.activities || []);
        setOtherLeads(data.data.otherLeadsForMobile || []);
        setPastBookings(data.data.pastBookings || []);
        setFollowUp(data.data.lead.nextFollowUpAt ? data.data.lead.nextFollowUpAt.slice(0, 16) : "");
      })
      .catch(() => toast.error("Failed to load lead"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (user?.role === "super_admin") {
      usersApi.getAll().then(({ data }) => setSalespersons(data.data.filter((u: any) => u.role === "salesperson"))).catch(() => {});
    }
  }, [user?.role]);

  const handleStatusChange = async (newStatus: string) => {
    let reason: string | undefined;
    if (REASON_REQUIRED.includes(newStatus)) {
      reason = window.prompt(`Why is this lead "${newStatus}"?`) || "";
      if (!reason.trim()) { toast.error("A reason is required"); return; }
    }
    setSavingStatus(true);
    try {
      const { data } = await leadsApi.update(id, { status: newStatus, reason });
      // The server has just moved the lead to Super Admin, so a
      // salesperson can no longer open it — go back to their list instead.
      if (user?.role !== "super_admin" && SUPER_ADMIN_REVIEW.includes(newStatus)) {
        if (newStatus === "Interested" && !data.notification?.sent) {
          toast.error("Lead moved to Super Admin, but the WhatsApp alert could not be sent");
        } else {
          toast.success("Lead sent to Super Admin for review");
        }
        router.push("/leads");
        return;
      }
      toast.success("Status updated");
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAssign = async (salespersonId: string) => {
    if (!salespersonId) return;
    try {
      await leadsApi.assign(id, salespersonId);
      toast.success("Lead assigned");
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to assign");
    }
  };

  const handleActivity = async (type: "call" | "whatsapp" | "note") => {
    const message = type === "note" ? noteText : window.prompt(`${type === "call" ? "Call" : "WhatsApp"} notes (optional)`) || "";
    if (type === "note" && !noteText.trim()) { toast.error("Enter a note"); return; }
    try {
      await leadsApi.addActivity(id, { type, message });
      toast.success("Logged");
      if (type === "note") setNoteText("");
      load();
    } catch {
      toast.error("Failed to log activity");
    }
  };

  const handleFollowUpSave = async () => {
    if (!followUp) return;
    try {
      await leadsApi.update(id, { nextFollowUpAt: new Date(followUp).toISOString() });
      toast.success("Follow-up scheduled");
      load();
    } catch {
      toast.error("Failed to schedule follow-up");
    }
  };

  if (loading || !lead) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-[#E8540A]" /></div>;
  }

  const slaActive = lead.assignedTo && !lead.firstActionAt && lead.status !== "Booking Confirmed" && ![...SUPER_ADMIN_REVIEW, "Lost", "Cancelled"].includes(lead.status);

  return (
    <div className="crm-detail-theme mx-auto min-h-full w-full max-w-none space-y-5 pb-20 lg:pb-2">
      <button onClick={() => router.push("/leads")} className="flex items-center gap-1.5 text-sm text-[#4A4A6A] hover:text-[#E8540A]">
        <ArrowLeft size={15} /> Back to Leads
      </button>

      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[#9090A8] text-xs font-mono">{lead.leadCode}</p>
          <h1 className="text-xl font-black text-[#0F0F1A]">{lead.name}</h1>
          <p className="text-[#4A4A6A] text-sm">{lead.mobile} {lead.email ? `· ${lead.email}` : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          {slaActive && lead.slaDeadline && (
            <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[#FEF3C7] text-[#92400E]">
              <Clock size={12} /> SLA due {new Date(lead.slaDeadline).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
          <select value={lead.status} disabled={savingStatus} onChange={(e) => handleStatusChange(e.target.value)}
            className="border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2 text-sm font-semibold outline-none bg-white">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
            <h3 className="font-bold text-[#0F0F1A] text-sm mb-4">Trip Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-[#9090A8] text-xs">Source</p><p className="font-semibold text-[#0F0F1A]">{lead.source}</p></div>
              <div><p className="text-[#9090A8] text-xs">Priority</p><p className="font-semibold text-[#0F0F1A]">{lead.priority}</p></div>
              {(lead.utm?.campaign || lead.utm?.term) && (
                <div><p className="text-[#9090A8] text-xs">Campaign / Keyword</p><p className="font-semibold text-[#0F0F1A]">{[lead.utm.campaign, lead.utm.term].filter(Boolean).join(" · ")}</p></div>
              )}
              <div><p className="text-[#9090A8] text-xs">Pickup</p><p className="font-semibold text-[#0F0F1A]">{lead.pickupLocation || "—"}</p></div>
              <div><p className="text-[#9090A8] text-xs">Drop</p><p className="font-semibold text-[#0F0F1A]">{lead.dropLocation || "—"}</p></div>
              <div><p className="text-[#9090A8] text-xs">Travel Date</p><p className="font-semibold text-[#0F0F1A]">{lead.travelDate ? new Date(lead.travelDate).toLocaleDateString("en-IN") : "—"}</p></div>
              <div><p className="text-[#9090A8] text-xs">Vehicle</p><p className="font-semibold text-[#0F0F1A]">{lead.vehicleRequirement || "—"}</p></div>
            </div>
            {lead.notes && <p className="text-sm text-[#4A4A6A] mt-4 bg-[#F8F9FC] rounded-xl p-3">{lead.notes}</p>}
          </div>

          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
            <h3 className="font-bold text-[#0F0F1A] text-sm mb-4">Quick Actions</h3>
            <div className="flex gap-2 mb-4">
              <button onClick={() => handleActivity("call")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#D1FAE5] text-[#065F46] text-xs font-bold">
                <Phone size={13} /> Log Call
              </button>
              <button onClick={() => handleActivity("whatsapp")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#DCFCE7] text-[#15803D] text-xs font-bold">
                <MessageCircle size={13} /> Log WhatsApp
              </button>
            </div>
            <div className="flex gap-2">
              <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note..."
                className="flex-1 border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2 text-sm outline-none" />
              <button onClick={() => handleActivity("note")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E8540A] text-white text-xs font-bold transition-colors hover:bg-[#c94508]">
                <StickyNote size={13} /> Add
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
            <h3 className="font-bold text-[#0F0F1A] text-sm mb-4">Activity Timeline</h3>
            {activities.length === 0 ? (
              <p className="text-[#9090A8] text-sm">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((a, index) => (
                  <div key={a._id} className="flex gap-3 text-sm border-b border-[#F1F2F7] pb-3 last:border-0">
                    <span className="serial-number shrink-0">{index + 1}</span>
                    <div>
                      <p className="text-[#0F0F1A]">{a.message || a.type}</p>
                      <p className="text-[#9090A8] text-xs">{a.by?.name || "System"} · {new Date(a.createdAt).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {user?.role === "super_admin" && (
            <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
              <h3 className="font-bold text-[#0F0F1A] text-sm mb-3 flex items-center gap-1.5"><UserIcon size={14} /> Assignment</h3>
              <p className="text-xs text-[#9090A8] mb-2">Currently: {lead.assignedTo?.name || "Unassigned"}</p>
              <select defaultValue="" onChange={(e) => handleAssign(e.target.value)}
                className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2 text-sm outline-none bg-white">
                <option value="">{lead.assignedTo ? "Reassign to..." : "Assign to..."}</option>
                {salespersons.map((s) => <option key={s._id} value={s._id} disabled={!s.isActive}>{s.name}{!s.isActive ? " (inactive)" : ""}</option>)}
              </select>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
            <h3 className="font-bold text-[#0F0F1A] text-sm mb-3">Next Follow-up</h3>
            <input type="datetime-local" value={followUp} onChange={(e) => setFollowUp(e.target.value)}
              className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-3 py-2 text-sm outline-none mb-2" />
            <button onClick={handleFollowUpSave} className="w-full py-2 rounded-xl bg-[#E8540A] text-white text-xs font-bold transition-colors hover:bg-[#c94508]">Save</button>
          </div>

          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
            <h3 className="font-bold text-[#0F0F1A] text-sm mb-3">Customer History</h3>
            {otherLeads.length === 0 && pastBookings.length === 0 ? (
              <p className="text-[#9090A8] text-xs">No previous leads or bookings for this number.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {otherLeads.map((l, index) => (
                  <p key={l._id} className="flex items-center gap-2 text-[#4A4A6A]"><span className="serial-number">{index + 1}</span><span>Lead {l.leadCode} — {l.status} ({new Date(l.createdAt).toLocaleDateString("en-IN")})</span></p>
                ))}
                {pastBookings.map((b, index) => (
                  <p key={b._id} className="flex items-center gap-2 font-semibold text-[#065F46]"><span className="serial-number">{index + 1}</span><span>Booking {b.bookingId} — Rs. {b.totalAmount?.toLocaleString("en-IN")}</span></p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
