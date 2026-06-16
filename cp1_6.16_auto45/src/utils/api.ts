const BASE = "/api";

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "请求失败" }));
    throw new Error(err.message || "请求失败");
  }
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: unknown }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { email: string; password: string; name: string; role: string }) =>
    request<{ token: string; user: unknown }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getEvents: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<unknown[]>(`/events${qs}`);
  },

  getEvent: (id: string) => request<unknown>(`/events/${id}`),

  createEvent: (data: unknown) =>
    request<unknown>("/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createTickets: (data: unknown) =>
    request<unknown>("/tickets", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getTickets: () => request<unknown[]>("/tickets"),

  checkinTicket: (ticketNo: string) =>
    request<unknown>(`/tickets/checkin`, {
      method: "POST",
      body: JSON.stringify({ ticketNo }),
    }),

  getAdminEvents: () => request<unknown[]>("/admin/events"),

  verifyEvent: (id: string, status: string, reason?: string) =>
    request<unknown>(`/admin/events/${id}/verify`, {
      method: "PUT",
      body: JSON.stringify({ status, reason }),
    }),

  getAnalytics: (eventId: string) =>
    request<unknown>(`/events/${eventId}/analytics`),
};
