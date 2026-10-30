import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

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
};

export const usersApi = {
  getAll: () => api.get("/api/users"),
  create: (data: Record<string, unknown>) => api.post("/api/users", data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/api/users/${id}`, data),
  toggle: (id: string) => api.patch(`/api/users/${id}/toggle`),
};

export const leadsApi = {
  getAll: (params?: Record<string, string | number>) => api.get("/api/leads", { params }),
  getStats: () => api.get("/api/leads/stats"),
  getById: (id: string) => api.get(`/api/leads/${id}`),
  create: (data: Record<string, unknown>) => api.post("/api/leads", data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/api/leads/${id}`, data),
  assign: (id: string, assignedTo: string) => api.patch(`/api/leads/${id}/assign`, { assignedTo }),
  addActivity: (id: string, data: { type: string; message?: string }) => api.post(`/api/leads/${id}/activity`, data),
};
