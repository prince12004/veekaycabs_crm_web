import axios from "axios";

// NEXT_PUBLIC_API_URL is baked in at build time. A live build made without it,
// or with a local .env still pointing at localhost, must reach the live API.
const LIVE_API_URL = "https://crm-api.veekaycabs.com";
const BUILD_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
const onLiveSite = typeof window !== "undefined" && window.location.hostname.endsWith("veekaycabs.com");
const API_URL = onLiveSite && /localhost|127\.0\.0\.1/.test(BUILD_API_URL) ? LIVE_API_URL : BUILD_API_URL;

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("crm_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      const message = error?.response?.data?.message;
      if (message && localStorage.getItem("crm_token")) sessionStorage.setItem("crm_signout_reason", message);
      localStorage.removeItem("crm_token");
      localStorage.removeItem("crm_user");
      if (window.location.pathname !== "/login") window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) => api.post("/api/auth/login", { email, password }),
  me: () => api.get("/api/auth/me"),
  logout: (reason?: "inactive") => api.post("/api/auth/logout", { reason }),
};

export const presenceApi = {
  heartbeat: (active: boolean) => api.post("/api/presence/heartbeat", { active }),
  setAvailability: (availability: "available" | "busy") => api.patch("/api/presence/availability", { availability }),
  getTeam: () => api.get("/api/presence/team"),
};

export const usersApi = {
  getAll: () => api.get("/api/users"),
  create: (data: Record<string, unknown>) => api.post("/api/users", data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/api/users/${id}`, data),
  toggle: (id: string) => api.patch(`/api/users/${id}/toggle`),
};

export const leadTypesApi = {
  getAll: () => api.get("/api/lead-types"),
  create: (name: string) => api.post("/api/lead-types", { name }),
  update: (id: string, name: string) => api.put(`/api/lead-types/${id}`, { name }),
  remove: (id: string) => api.delete(`/api/lead-types/${id}`),
};

export const leadsApi = {
  getAll: (params?: Record<string, string | number>) => api.get("/api/leads", { params }),
  getStats: () => api.get("/api/leads/stats"),
  getLost: (params?: Record<string, string | number>) => api.get("/api/leads/lost", { params }),
  getById: (id: string) => api.get(`/api/leads/${id}`),
  create: (data: Record<string, unknown>) => api.post("/api/leads", data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/api/leads/${id}`, data),
  assign: (id: string, assignedTo: string) => api.patch(`/api/leads/${id}/assign`, { assignedTo }),
  addActivity: (id: string, data: { type: string; message?: string }) => api.post(`/api/leads/${id}/activity`, data),
};
