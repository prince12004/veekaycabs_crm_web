"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { leadsApi } from "@/lib/api";

interface Props {
  leadId: string;
  value?: string;
  types: string[];
  onSaved?: (leadType: string) => void;
  className?: string;
}

// Picks the lead's category from the list Super Admin manages. A category
// that was later removed still shows on the leads already using it.
export default function LeadTypeSelect({ leadId, value = "", types, onSaved, className }: Props) {
  const [saving, setSaving] = useState(false);

  const save = async (next: string) => {
    if (next === value) return;
    setSaving(true);
    try {
      await leadsApi.update(leadId, { leadType: next });
      toast.success(next ? `Lead type set to ${next}` : "Lead type cleared");
      onSaved?.(next);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save lead type");
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={value}
      disabled={saving}
      aria-label="Lead type"
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => save(e.target.value)}
      className={className}
    >
      <option value="">Not set</option>
      {value && !types.includes(value) && <option value={value}>{value}</option>}
      {types.map((t) => <option key={t} value={t}>{t}</option>)}
    </select>
  );
}
