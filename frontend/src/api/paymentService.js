import api from "./axios";

const paymentService = {
  initiateDonationPayment: async (payload) => {
    const response = await api.post("/payment/stripe/donation/initiate", payload);
    return response.data;
  },

  initiateAppointmentPayment: async (payload) => {
    const response = await api.post("/payment/stripe/appointment/initiate", payload);
    return response.data;
  },

  verifyStripeSession: async (sessionId) => {
    const response = await api.get(`/payment/stripe/session/${sessionId}`);
    return response.data;
  },
};

export default paymentService;
