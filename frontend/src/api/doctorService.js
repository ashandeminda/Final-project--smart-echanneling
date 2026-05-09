import api from "./axios";

// ==========================================
// Doctor API Services
// Matches backend routes: /api/v1/doctor/*
// ==========================================

const doctorService = {
  // GET /doctor/all - Get all approved doctors (public, no auth needed)
  getAllDoctors: async () => {
    const response = await api.get("/doctor/all");
    return response.data;
  },

  // GET /doctor/:id - Get a single doctor by ID (public)
  getDoctorById: async (id) => {
    const response = await api.get(`/doctor/${id}`);
    return response.data;
  },

  // GET /doctor/me - Get logged-in doctor profile
  getMyDoctorProfile: async () => {
    const response = await api.get("/doctor/me");
    return response.data;
  },

  // POST /doctor/create - Create a new doctor profile (requires auth + image)
  // Body (FormData): { name, specialization, experience, hospital, fee, availableDays, image }
  createDoctor: async (formData) => {
    const response = await api.post("/doctor/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // PUT /doctor/update/:id - Update a doctor profile (requires auth)
  updateDoctor: async (id, formData) => {
    const response = await api.put(`/doctor/update/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // PUT /doctor/me/schedule - Update logged-in doctor schedule
  updateMyDoctorSchedule: async (payload) => {
    const response = await api.put("/doctor/me/schedule", payload);
    return response.data;
  },

  // DELETE /doctor/delete/:id - Delete a doctor (requires auth)
  deleteDoctor: async (id) => {
    const response = await api.delete(`/doctor/delete/${id}`);
    return response.data;
  },
};

export default doctorService;
