import api from "./axios";

const healthRecordService = {
  uploadHealthRecord: async (formData) => {
    const response = await api.post("/health-record/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  getMyHealthRecords: async () => {
    const response = await api.get("/health-record/my");
    return response.data;
  },

  getPatientHealthRecords: async (userId, appointmentId) => {
    const response = await api.get(`/health-record/patient/${userId}`, {
      params: { appointmentId },
    });
    return response.data;
  },

  getHealthRecordDetails: async (id) => {
    const response = await api.get(`/health-record/details/${id}`);
    return response.data;
  },

  deleteHealthRecord: async (id) => {
    const response = await api.delete(`/health-record/delete/${id}`);
    return response.data;
  },
};

export default healthRecordService;
