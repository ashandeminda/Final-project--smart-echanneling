import api from "./axios";

// ==========================================
// Donation API Services
// Matches backend routes: /api/v1/donation/*
// ==========================================

const donationService = {
  // POST /donation/donate - Create a new donation (public, no auth needed)
  // Body: { name?, amount, paymentMethod }
  // Note: name defaults to "Anonymous" if not provided
  createDonation: async (donationData) => {
    const response = await api.post("/donation/donate", donationData);
    return response.data;
  },

  // GET /donation/recent - Get 10 most recent donations (public)
  getRecentDonations: async () => {
    const response = await api.get("/donation/recent");
    return response.data;
  },

  // GET /donation/stats - Get completed donation totals for live campaign progress
  getDonationStats: async () => {
    const response = await api.get("/donation/stats");
    return response.data;
  },
};

export default donationService;
