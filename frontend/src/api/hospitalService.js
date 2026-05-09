import api from "./axios";

// ==========================================
// Hospital API Services
// Matches backend routes: /api/v1/hospital/*
// ==========================================

const hospitalService = {
  // GET /hospital/get-all - Fetch all hospitals (public, no auth needed)
  getAllHospitals: async () => {
    const response = await api.get("/hospital/get-all");
    return response.data;
  },

  // POST /hospital/add - Add a new hospital
  // Body: { name, location, rating, image }
  addHospital: async (hospitalData) => {
    const response = await api.post("/hospital/add", hospitalData);
    return response.data;
  },
};

export default hospitalService;
