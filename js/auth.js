// ─── Auth Module ─────────────────────────────────────────────────────────────

const auth = {
  // ─── Register ──────────────────────────────────────────────────────────────
  register: async (username, email, password) => {
    return await api.post("/auth/register", {
      username,
      email,
      password,
    });
  },

  // ─── Login ─────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    const data = await api.post("/auth/login", { email, password });
    setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  // ─── Logout ────────────────────────────────────────────────────────────────
  logout: async () => {
    const refreshToken = getRefreshToken();
    try {
      await api.post("/auth/logout", { refreshToken });
    } finally {
      clearTokens();
      globalThis.location.href = "/login.html";
    }
  },

  // ─── Forgot Password ───────────────────────────────────────────────────────
  forgotPassword: async (email) => {
    return await api.post("/auth/forgot-password", { email });
  },

  // ─── Reset Password ────────────────────────────────────────────────────────
  resetPassword: async (token, password) => {
    return await api.post("/auth/reset-password", { token, password });
  },
};