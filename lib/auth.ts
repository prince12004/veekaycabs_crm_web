export interface CrmSessionUser {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "salesperson";
}

export function getCrmUser(): CrmSessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("crm_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isSuperAdmin(): boolean {
  return getCrmUser()?.role === "super_admin";
}

export function logout() {
  localStorage.removeItem("crm_token");
  localStorage.removeItem("crm_user");
  window.location.href = "/login";
}
