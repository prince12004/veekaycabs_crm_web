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

// Ends the session on the server first, so a salesperson's untouched leads
// move to someone available straight away.
export async function logout(reason?: "inactive") {
  try {
    const { authApi } = await import("./api");
    await authApi.logout(reason);
  } catch {
    // Already signed out on the server, or offline — clear locally regardless.
  }
  if (reason === "inactive") {
    sessionStorage.setItem("crm_signout_reason", "You were signed out after 5 minutes of inactivity. Your uncontacted leads were passed to an available teammate.");
  }
  localStorage.removeItem("crm_token");
  localStorage.removeItem("crm_user");
  window.location.href = "/login";
}
