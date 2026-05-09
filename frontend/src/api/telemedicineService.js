import api from "./axios";

const telemedicineService = {
  joinSession: async (sessionId, role) => {
    const response = await api.post("/telemedicine/join", { sessionId, role });
    return response.data;
  },

  sendSignal: async (sessionId, role, signalType, payload) => {
    const response = await api.post("/telemedicine/signal", {
      sessionId,
      role,
      signalType,
      payload,
    });
    return response.data;
  },

  getSignals: async (sessionId, role, since) => {
    const response = await api.get(`/telemedicine/signals/${sessionId}`, {
      params: { role, since },
    });
    return response.data;
  },

  leaveSession: async (sessionId, role) => {
    const response = await api.post("/telemedicine/leave", { sessionId, role });
    return response.data;
  },
};

export default telemedicineService;
