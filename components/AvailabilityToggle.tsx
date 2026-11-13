"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { authApi, presenceApi } from "@/lib/api";

// Salesperson's own switch: Busy pauses new leads without signing out.
export default function AvailabilityToggle() {
  const [availability, setAvailability] = useState<"available" | "busy" | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authApi.me().then(({ data }) => setAvailability(data.data.availability || "available")).catch(() => {});
  }, []);

  if (!availability) return null;
  const busy = availability === "busy";

  const toggle = async () => {
    const next = busy ? "available" : "busy";
    setSaving(true);
    try {
      await presenceApi.setAvailability(next);
      setAvailability(next);
      toast.success(next === "busy" ? "Marked Busy — new leads paused" : "Marked Available — you'll receive new leads");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not change availability");
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={saving}
      title={busy ? "Click to start receiving new leads" : "Click to pause new leads"}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition disabled:opacity-60 ${
        busy ? "border-[#fde2b8] bg-[#fff8ec] text-[#a1620f]" : "border-[#d9efe1] bg-[#f0faf3] text-[#28804a]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${busy ? "bg-[#e0a03a]" : "bg-[#32a85a]"}`} />
      {busy ? "Busy" : "Available"}
    </button>
  );
}
