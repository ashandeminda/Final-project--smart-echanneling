import api from "./axios";

// ==========================================
// User API Services
// Matches backend routes: /api/v1/user/*
// ==========================================

const userService = {
  // POST /user/register - Register a new user
  // Body: { name, email, password, phone }
  register: async (userData) => {
    const response = await api.post("/user/register", userData);
    return response.data;
  },

  // POST /user/login - Login and get JWT token
  // Body: { email, password }
  login: async (email, password) => {
    const response = await api.post("/user/login", { email, password });
    return response.data;
  },

  // POST /user/doctor-login - Doctor login and get JWT token
  // Body: { email, password }
  doctorLogin: async (email, password) => {
    const response = await api.post("/user/doctor-login", { email, password });
    return response.data;
  },

  // GET /user/get-user - Get current user (requires auth token)
  getCurrentUser: async () => {
    const response = await api.get("/user/get-user");
    return response.data;
  },

  // GET /user/admin/all-users - Get all users (admin only)
  getAllUsers: async () => {
    const response = await api.get("/user/admin/all-users");
    return response.data;
  },

  // PATCH /user/update-profile - Update current user's profile (requires auth)
  // Accepts FormData: { name?, email?, phone?, image? (file) }
  updateProfile: async (formData) => {
    const response = await api.patch("/user/update-profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};

export default userService;
