import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import Layout from "../components/Layout";

const AllAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [recordsPanel, setRecordsPanel] = useState({
    open: false,
    loading: false,
    patientName: "",
    records: [],
    error: "",
  });

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/appointment/all");
      setAppointments(res.data.appointments || []);
    } catch (error) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const appointment = appointments.find((item) => item._id === id);
      let payload = { status };

      if (status === "approved" && appointment?.type === "Video Consultation") {
        const teamsLink = window.prompt("Paste the Microsoft Teams meeting link for this consultation:");

        if (!teamsLink) {
          return;
        }

        payload = { status, meetingLink: teamsLink.trim() };
      }

      setUpdatingId(id);
      await api.put(`/appointment/update/${id}`, payload);
      toast.success(`Appointment ${status}`);
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || "Update Failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteAppointment = async (id) => {
    const confirmed = window.confirm("Do you want to delete this appointment?");
    if (!confirmed) return;

    try {
      setDeletingId(id);
      await api.delete(`/appointment/delete/${id}`);
      toast.success("Appointment deleted");
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete Failed");
    } finally {
      setDeletingId(null);
    }
  };

  const viewHealthRecords = async (appointment) => {
    try {
      setRecordsPanel({
        open: true,
        loading: true,
        patientName: appointment.userId?.name || "Patient",
        records: [],
        error: "",
      });

      const res = await api.get(`/health-record/patient/${appointment.userId?._id}`, {
        params: { appointmentId: appointment._id },
      });

      setRecordsPanel({
        open: true,
        loading: false,
        patientName: appointment.userId?.name || "Patient",
        records: res.data.healthRecords || [],
        error: "",
      });
    } catch (error) {
      setRecordsPanel({
        open: true,
        loading: false,
        patientName: appointment.userId?.name || "Patient",
        records: [],
        error: error.response?.data?.message || "Failed to load health records",
      });
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <Layout>
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-2xl font-bold text-gray-900">All Appointments</h4>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-gray-500 font-medium">
            <span className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin"></span>
            Loading appointments...
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500 text-lg font-medium">No appointments found</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Appointment No</th>
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Doctor</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {appointments.map((appointment, index) => (
                    <tr key={appointment._id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-6 py-4 text-gray-400 font-medium">{index + 1}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{appointment.appointmentNo || "N/A"}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{appointment.userId?.name || "N/A"}</td>
                      <td className="px-6 py-4 text-gray-600">{appointment.doctorId?.name || "N/A"}</td>
                      <td className="px-6 py-4 text-gray-600">{appointment.date}</td>
                      <td className="px-6 py-4 text-gray-600">{appointment.time}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${appointment.status === "approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : appointment.status === "rejected" ||
                                appointment.status === "cancelled"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                        >
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right gap-2 flex justify-end">
                        <button
                          className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300"
                          onClick={() => viewHealthRecords(appointment)}
                        >
                          Health Records
                        </button>
                        {appointment.status === "pending" ? (
                          <>
                            <button
                              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 shadow-sm disabled:opacity-50 hover:-translate-y-0.5"
                              disabled={updatingId === appointment._id}
                              onClick={() => updateStatus(appointment._id, "approved")}
                            >
                              {updatingId === appointment._id ? "..." : "Approve"}
                            </button>
                            <button
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 disabled:opacity-50 border border-rose-200"
                              disabled={updatingId === appointment._id}
                              onClick={() => updateStatus(appointment._id, "rejected")}
                            >
                              {updatingId === appointment._id ? "..." : "Reject"}
                            </button>
                          </>
                        ) : (
                          <button
                            className="bg-white border border-gray-200 text-rose-600 hover:bg-rose-50 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 disabled:opacity-50 hover:border-rose-200"
                            disabled={deletingId === appointment._id}
                            onClick={() => deleteAppointment(appointment._id)}
                          >
                            {deletingId === appointment._id ? "..." : "Delete"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {recordsPanel.open && (
          <div className="mt-6 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Patient Records</div>
                <h5 className="text-2xl font-bold text-gray-900">{recordsPanel.patientName}</h5>
              </div>
              <button
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                onClick={() =>
                  setRecordsPanel({
                    open: false,
                    loading: false,
                    patientName: "",
                    records: [],
                    error: "",
                  })
                }
              >
                Close
              </button>
            </div>

            {recordsPanel.loading ? (
              <div className="flex items-center gap-3 text-gray-500 font-medium">
                <span className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin"></span>
                Loading health records...
              </div>
            ) : recordsPanel.error ? (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-medium">
                {recordsPanel.error}
              </div>
            ) : recordsPanel.records.length === 0 ? (
              <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-500 font-medium">
                No health records uploaded for this patient yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recordsPanel.records.map((record) => (
                  <div key={record._id} className="border border-gray-100 rounded-2xl p-5 bg-gray-50">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div>
                        <h6 className="text-lg font-bold text-gray-900">{record.title}</h6>
                        <div className="text-sm text-gray-500 font-medium">{record.recordType}</div>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        {new Date(record.recordDate || record.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {record.description && (
                      <p className="text-sm text-gray-600 mb-4">{record.description}</p>
                    )}
                    <a
                      href={`http://localhost:8080${record.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
                    >
                      View Record
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AllAppointments;
