const API_URL = "http://localhost:3000/api/v1";

// ─── Token Management ────────────────────────────────────────────────────────

const getAccessToken = () => localStorage.getItem("accessToken");
const getRefreshToken = () => localStorage.getItem("refreshToken");

const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
};

const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("currentEvent");
};

// ─── Redirect Helpers ────────────────────────────────────────────────────────

const redirectToLogin = () => {
  clearTokens();
  globalThis.location.href = "/login.html";
};

// ─── Token Refresh ───────────────────────────────────────────────────────────

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    setTokens(data.accessToken);
    return true;
  } catch {
    return false;
  }
};

// ─── Core Request ────────────────────────────────────────────────────────────

const request = async (endpoint, options = {}, retry = true) => {
  const token = getAccessToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  // Token expired → refresh and retry once
  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request(endpoint, options, false);
    redirectToLogin();
    return;
  }

  // Not authenticated at all
  if (response.status === 403) {
    globalThis.location.href = "/login.html";
    return;
  }

  const data = await response.json();

  // Throw error responses so callers can catch them
  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
};

// ─── HTTP Methods ────────────────────────────────────────────────────────────

const api = {
  get: (endpoint) =>
    request(endpoint, { method: "GET" }),

  post: (endpoint, body) =>
    request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: (endpoint, body) =>
    request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (endpoint) =>
    request(endpoint, { method: "DELETE" }),

  // CSV download (special case)
  download: async (endpoint, filename) => {
    const token = getAccessToken();
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await response.blob();
    const url = globalThis.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    globalThis.URL.revokeObjectURL(url);
  },
};

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

const isAuthenticated = () => !!getAccessToken();

const getCurrentEvent = () => {
  const event = localStorage.getItem("currentEvent");
  return event ? JSON.parse(event) : null;
};

const setCurrentEvent = (event) => {
  localStorage.setItem("currentEvent", JSON.stringify(event));
};

// ─── Guard for protected pages ───────────────────────────────────────────────

const requireAuth = () => {
  if (!isAuthenticated()) {
    redirectToLogin();
  }
};
