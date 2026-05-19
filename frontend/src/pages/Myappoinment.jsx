import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import appointmentService from "../api/appointmentService";
import { useAuth } from "../context/useAuth";
import { formatDisplayTime } from "../utils/timeFormat";

const getAppointmentStart = (date, time) => {
  if (!date || !time) return null;

  const parsed = new Date(`${date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

function MyAppointment() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [tab, setTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState("");
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const getSessionAvailabilityText = (appointment) => {
    if (appointment.type === "Chat Consultation") {
      return "Instant chat";
    }

    return formatDisplayTime(appointment.time);
  };

  const getReferenceText = (appointment) => {
    if (appointment.type === "Chat Consultation") {
      return "Instant chat request";
    }

    return appointment.appointmentNo || "N/A";
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleJoin = (app) => {
    if (app.type === "Video Consultation") {
      if (app.meetingProvider === "teams" && app.meetingLink) {
        window.open(app.meetingLink, "_blank", "noopener,noreferrer");
        return;
      }

      navigate("/video-consultation", {
        state: {
          doctor: app.doctorId?.name,
          specialty: app.doctorId?.specialization,
          appointmentNo: app.appointmentNo,
          hospital: app.doctorId?.hospital,
          date: app.date,
          time: app.time,
        },
      });
      return;
    }

    if (app.type === "Chat Consultation") {
      navigate("/chat-consultation", {
        state: {
          sessionId: app._id,
          doctor: app.doctorId?.name,
          specialty: app.doctorId?.specialization,
          appointmentNo: app.appointmentNo,
          hospital: app.doctorId?.hospital,
          date: app.date,
          time: app.time,
          paymentStatus: "Completed",
        },
      });
    }
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const data = await appointmentService.getMyAppointments();
        setAppointments(data.appointments || []);
      } catch (err) {
        console.error("Failed to fetch appointments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [isAuthenticated, navigate]);

  const handleCancelAppointment = async (appointmentId) => {
    const confirmed = window.confirm("Do you want to cancel this appointment?");
    if (!confirmed) return;

    try {
      setCancellingId(appointmentId);
      const response = await appointmentService.cancelMyAppointment(appointmentId);
      const updatedAppointment = response.appointment;

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment._id === appointmentId ? { ...appointment, ...updatedAppointment } : appointment
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel appointment");
    } finally {
      setCancellingId("");
    }
  };

  const filtered = appointments.filter((app) => app.status === tab);

  const StatusBadge = ({ status }) => {
    let colorClass = "bg-slate-100 text-slate-700";
    if (status === "pending") colorClass = "bg-amber-100 text-amber-700 border-amber-200";
    if (status === "approved" || status === "completed") colorClass = "bg-green-100 text-green-700 border-green-200";
    if (status === "rejected" || status === "cancelled") colorClass = "bg-red-100 text-red-700 border-red-200";

    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize border ${colorClass}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen p-6 md:p-10 bg-slate-50 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <p className="mb-2 text-blue-600 text-xs font-bold tracking-widest uppercase">Patient Dashboard</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">My Appointments</h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 w-fit">
          {["pending", "approved", "rejected", "cancelled"].map((status) => (
            <button
              key={status}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-200 ${tab === status
                ? "bg-slate-900 text-white shadow-md"
                : "bg-transparent text-slate-600 hover:bg-slate-100"
                }`}
              onClick={() => setTab(status)}
            >
              {status}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center p-12">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}

        {!loading && filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-5 border border-blue-100">📅</div>
            <h4 className="text-2xl font-bold text-slate-900 mb-2">No {tab} appointments</h4>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">You currently have no {tab} consultation requests.</p>

            <button
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              onClick={() => navigate("/hospitals")}
            >
              + Book New Appointment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {!loading && filtered.map((app) => {
              const appointmentStart =
                app.type === "Chat Consultation" ? null : getAppointmentStart(app.date, app.time);
              const canJoin = !appointmentStart || currentTime >= appointmentStart;

              return (
                <div key={app._id} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">

                  {/* Decorative element based on status */}
                  <div className={`absolute top-0 left-0 w-2 h-full ${app.status === 'pending' ? 'bg-amber-400' :
                    app.status === 'approved' ? 'bg-green-500' :
                      'bg-slate-300'
                    }`}></div>

                  <div className="flex-1 pl-4">
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                      <div>
                        <h4 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">{app.doctorId?.name || "Doctor"}</h4>
                        <p className="text-sm font-semibold text-slate-500">
                          {app.type === "Chat Consultation" ? "Session:" : "Appointment Number:"}{" "}
                          <span className="text-slate-800">{getReferenceText(app)}</span>
                        </p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>

                    <p className="text-teal-700 font-bold capitalize mb-4">{app.doctorId?.specialization || ""}</p>

                    <div className="flex flex-wrap gap-3 mb-2">
                      <span className="inline-flex items-center px-4 py-1.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg border border-slate-200">
                        {app.date}
                      </span>
                      <span className="inline-flex items-center px-4 py-1.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg border border-slate-200">
                        {getSessionAvailabilityText(app)}
                      </span>
                      <span className="inline-flex items-center px-4 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider border border-indigo-100 ml-auto sm:ml-0">
                        {app.type || "In-Person"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end justify-center gap-3 pt-4 md:pt-0 md:pl-6 md:border-l border-slate-100 md:min-w-[180px]">
                    {tab === "approved" &&
                      (app.type === "Video Consultation" || app.type === "Chat Consultation") && (
                        <div className="w-full flex flex-col gap-2">
                          <button
                            className="w-full px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10 text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:shadow-none"
                            onClick={() => handleJoin(app)}
                            disabled={!canJoin}
                            title={!canJoin ? `Available at ${formatDisplayTime(app.time)} on ${app.date}` : ""}
                          >
                            {app.type === "Video Consultation"
                              ? app.meetingProvider === "teams"
                                ? "Open Teams Meeting"
                                : "Join Video Call"
                              : "Join Chat"}
                          </button>
                          {!canJoin && <p className="text-[11px] text-slate-500 font-medium text-center bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">Available at booked time</p>}
                        </div>
                      )}

                    {(tab === "pending" || tab === "approved") && (
                      <button
                        className="w-full px-5 py-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                        onClick={() => handleCancelAppointment(app._id)}
                        disabled={cancellingId === app._id}
                      >
                        {cancellingId === app._id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyAppointment;
