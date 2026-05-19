import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import appointmentService from "../api/appointmentService";
import doctorService from "../api/doctorService";
import healthRecordService from "../api/healthRecordService";
import { useAuth } from "../context/useAuth";
import { formatDisplayTime } from "../utils/timeFormat";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const dayIndexMap = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const getNextDateForDay = (dayName) => {
  const today = new Date();
  const target = dayIndexMap[dayName];

  if (target === undefined) {
    return "";
  }

  const result = new Date(today);
  const diff = (target - today.getDay() + 7) % 7 || 7;
  result.setDate(today.getDate() + diff);

  return result.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getAppointmentStart = (date, time) => {
  if (!date || !time) return null;

  const parsed = new Date(`${date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeDoctorProfile = (doctor) => {
  if (!doctor) return null;

  return {
    ...doctor,
    availableDays: Array.isArray(doctor.availableDays) ? doctor.availableDays : [],
    videoConsultationEnabled: Boolean(doctor.videoConsultationEnabled),
    chatConsultationEnabled: Boolean(doctor.chatConsultationEnabled),
  };
};

const isTelemedicineAppointment = (appointment) =>
  appointment?.type === "Video Consultation" || appointment?.type === "Chat Consultation";

function DoctorAppointments() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [tab, setTab] = useState("approved");
  const [recordsPanel, setRecordsPanel] = useState({
    open: false,
    loading: false,
    patientName: "",
    records: [],
    error: "",
  });
  const currentDateLabel = new Date().toISOString().split("T")[0];
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

  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!isAuthenticated) {
        navigate("/doctor-login");
        return;
      }

      if (user?.role !== "doctor") {
        navigate("/");
        return;
      }

      try {
        setLoading(true);
        const [appointmentData, doctorData] = await Promise.all([
          appointmentService.getDoctorAppointments(),
          doctorService.getMyDoctorProfile(),
        ]);

        setAppointments(appointmentData.appointments || []);
        setDoctorProfile(normalizeDoctorProfile(doctorData.doctor));
      } catch (err) {
        console.error("Failed to fetch doctor appointments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [isAuthenticated, navigate, user]);

  const filtered = appointments.filter((app) => app.status === tab);
  const filteredPhysicalAppointments = filtered.filter(
    (app) => !isTelemedicineAppointment(app)
  );
  const filteredTelemedicineAppointments = filtered.filter(isTelemedicineAppointment);
  const approvedCount = appointments.filter((app) => app.status === "approved").length;
  const pendingCount = appointments.filter((app) => app.status === "pending").length;
  const rejectedCount = appointments.filter((app) => app.status === "rejected").length;
  const telemedicineCount = appointments.filter(
    (app) => app.type === "Video Consultation" || app.type === "Chat Consultation"
  ).length;
  const availableDaysCount = doctorProfile?.availableDays?.length || 0;
  const videoEnabled = Boolean(doctorProfile?.videoConsultationEnabled);
  const chatEnabled = Boolean(doctorProfile?.chatConsultationEnabled);
  const availabilityPreview = (doctorProfile?.availableDays || []).map((day) => ({
    day,
    nextDate: getNextDateForDay(day),
  }));

  const toggleDay = (day) => {
    setDoctorProfile((current) => {
      if (!current) return current;

      const currentDays = current.availableDays || [];
      const nextDays = currentDays.includes(day)
        ? currentDays.filter((item) => item !== day)
        : [...currentDays, day];

      return { ...current, availableDays: nextDays };
    });
  };

  const toggleTelemedicineMode = (field) => {
    setDoctorProfile((current) =>
      current ? { ...current, [field]: !current[field] } : current
    );
  };

  const handleSaveSchedule = async () => {
    if (!doctorProfile) return;

    try {
      setSavingSchedule(true);
      const data = await doctorService.updateMyDoctorSchedule({
        availableDays: doctorProfile.availableDays || [],
        videoConsultationEnabled: Boolean(doctorProfile.videoConsultationEnabled),
        chatConsultationEnabled: Boolean(doctorProfile.chatConsultationEnabled),
      });
      setDoctorProfile(normalizeDoctorProfile(data.doctor) || doctorProfile);
      alert("Availability updated successfully");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update availability");
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleAppointmentStatus = async (id, status) => {
    try {
      const appointment = appointments.find((item) => item._id === id);
      let extraData = {};

      if (status === "approved" && appointment?.type === "Video Consultation") {
        const teamsLink = window.prompt("Paste the Microsoft Teams meeting link for this consultation:");

        if (!teamsLink) {
          return;
        }

        extraData = { meetingLink: teamsLink.trim() };
      }

      setLoading(true);
      await appointmentService.updateAppointmentStatus(id, status, extraData);
      const appointmentData = await appointmentService.getDoctorAppointments();
      setAppointments(appointmentData.appointments || []);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update appointment");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = (app) => {
    if (app.type === "Video Consultation") {
      if (app.meetingProvider === "teams" && app.meetingLink) {
        window.open(app.meetingLink, "_blank", "noopener,noreferrer");
        return;
      }

      navigate("/video-consultation", {
        state: {
          doctor: doctorProfile?.name || user?.name || "Doctor",
          specialty: doctorProfile?.specialization || "",
          appointmentNo: app.appointmentNo,
          hospital: doctorProfile?.hospital || "",
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
          doctor: doctorProfile?.name || user?.name || "Doctor",
          specialty: doctorProfile?.specialization || "",
          appointmentNo: app.appointmentNo,
          hospital: doctorProfile?.hospital || "",
          date: app.date,
          time: app.time,
        },
      });
    }
  };

  const handleViewHealthRecords = async (app) => {
    try {
      setRecordsPanel({
        open: true,
        loading: true,
        patientName: app.userId?.name || "Patient",
        records: [],
        error: "",
      });

      const data = await healthRecordService.getPatientHealthRecords(
        app.userId?._id,
        app._id
      );

      setRecordsPanel({
        open: true,
        loading: false,
        patientName: app.userId?.name || "Patient",
        records: data.healthRecords || [],
        error: "",
      });
    } catch (error) {
      setRecordsPanel({
        open: true,
        loading: false,
        patientName: app.userId?.name || "Patient",
        records: [],
        error: error.response?.data?.message || "Failed to load health records",
      });
    }
  };

  const StatusBadge = ({ status }) => {
    let colorClass = "bg-slate-100 text-slate-700";
    if (status === "pending") colorClass = "bg-amber-100 text-amber-700";
    if (status === "approved" || status === "completed") colorClass = "bg-green-100 text-green-700";
    if (status === "rejected" || status === "cancelled") colorClass = "bg-red-100 text-red-700";

    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize ${colorClass}`}>
        {status}
      </span>
    );
  };

  const renderAppointmentCard = (app) => {
    const appointmentStart =
      app.type === "Chat Consultation" ? null : getAppointmentStart(app.date, app.time);
    const canJoin = !appointmentStart || currentTime >= appointmentStart;

    return (
      <div key={app._id} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row justify-between gap-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex-1">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <div>
              <p className="mb-1 text-blue-600 text-xs font-bold tracking-widest uppercase">Patient</p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{app.userId?.name || "Patient"}</h3>
            </div>
            <span className={`px-4 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider border ${
              isTelemedicineAppointment(app)
                ? "bg-blue-50 text-blue-700 border-blue-100"
                : "bg-emerald-50 text-emerald-700 border-emerald-100"
            }`}>
              {app.type || "In-Person"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { l: "Email", v: app.userId?.email || "No email" },
              { l: "Phone", v: app.userId?.phone || "No phone" },
              { l: "Date", v: app.date },
              { l: "Time", v: getSessionAvailabilityText(app) },
              { l: app.type === "Chat Consultation" ? "Session" : "Ref #", v: getReferenceText(app) },
              { l: "Type", v: app.type || "In-Person" }
            ].map((dt, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                <span className="block text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">{dt.l}</span>
                <strong className="text-slate-900 text-sm">{dt.v}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-3 mt-4 lg:mt-0 lg:pl-6 lg:border-l lg:border-slate-100 lg:min-w-[160px]">
          <StatusBadge status={app.status} />

          <button
            className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold rounded-xl transition-colors min-w-[120px]"
            onClick={() => handleViewHealthRecords(app)}
          >
            Health Records
          </button>

          {tab === "pending" && (app.type === "Video Consultation" || app.type === "Chat Consultation") && (
            <div className="flex lg:flex-col gap-2 w-full mt-auto">
              <button className="flex-1 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors min-w-[120px]" onClick={() => handleAppointmentStatus(app._id, "approved")} disabled={loading}>
                Approve
              </button>
              <button className="flex-1 px-4 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold rounded-xl transition-colors min-w-[120px]" onClick={() => handleAppointmentStatus(app._id, "rejected")} disabled={loading}>
                Reject
              </button>
            </div>
          )}

          {tab === "approved" && (app.type === "Video Consultation" || app.type === "Chat Consultation") && (
            <div className="flex flex-col gap-2 w-full mt-auto">
              <button
                className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white shadow-md text-sm font-bold rounded-xl disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none transition-all shadow-blue-600/20"
                onClick={() => handleJoin(app)}
                disabled={!canJoin}
                title={!canJoin ? `Available at ${formatDisplayTime(app.time)} on ${app.date}` : ""}
              >
                {app.type === "Video Consultation"
                  ? app.meetingProvider === "teams"
                    ? "Open Teams"
                    : "Join Video"
                  : "Join Chat"}
              </button>
              {!canJoin && <p className="text-xs text-slate-500 font-medium text-center">Available at booked time</p>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-10 bg-slate-50 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HERO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-stretch gap-6">
          <div className="flex-1 p-8 bg-white border border-slate-200 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-5 -me-10 -mt-10 pointer-events-none"></div>
            <p className="mb-2 text-blue-600 text-xs font-extrabold tracking-widest uppercase relative z-10">Doctor Workspace</p>
            <h1 className="mb-3 text-slate-900 text-3xl md:text-4xl font-bold relative z-10">{doctorProfile?.name || "Doctor Dashboard"}</h1>
            <p className="m-0 max-w-2xl text-slate-600 leading-relaxed relative z-10">
              Review appointments, manage telemedicine sessions, and keep your weekly availability up to date.
            </p>
          </div>
          <div className="min-w-[280px] w-full md:w-auto p-8 rounded-3xl bg-slate-900 text-white shadow-lg flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-2xl opacity-20 -me-10 -mt-10 pointer-events-none"></div>
            <span className="block mb-2 text-blue-300 text-xs font-bold uppercase tracking-widest relative z-10">Today</span>
            <strong className="block mb-3 text-3xl font-extrabold relative z-10">{currentDateLabel}</strong>
            <p className="m-0 text-slate-300 text-sm leading-relaxed relative z-10">{pendingCount} pending requests waiting for your attention</p>
          </div>
        </div>

        {doctorProfile && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_2fr] gap-6">
            
            {/* PROFILE CARD */}
            <div className="bg-white p-8 border border-slate-200 rounded-3xl shadow-sm">
              <p className="mb-3 text-blue-600 text-xs font-bold tracking-widest uppercase">Doctor Profile</p>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{doctorProfile.name}</h2>
              <p className="text-slate-500 mb-6 font-medium">
                {doctorProfile.specialization} at {doctorProfile.hospital}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full border border-blue-100">{doctorProfile.experience} experience</span>
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full border border-blue-100">LKR {doctorProfile.fee} fee</span>
                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-full border border-slate-200">{doctorProfile.userId?.email || "No email"}</span>
                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-full border border-slate-200">{doctorProfile.userId?.phone || "No phone"}</span>
              </div>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Total Appts", value: appointments.length },
                { label: "Pending", value: pendingCount },
                { label: "Approved", value: approvedCount },
                { label: "Telemedicine", value: telemedicineCount },
                { label: "Rejected", value: rejectedCount },
                { label: "Avail. Days", value: availableDaysCount }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <p className="m-0 mb-2 text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                  <h3 className="m-0 text-3xl font-extrabold text-slate-900">{stat.value}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          {doctorProfile && (
            <div className="bg-white p-6 sm:p-8 border border-slate-200 rounded-3xl shadow-sm h-fit">
              <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">Availability and Schedule</h3>
                  <p className="text-slate-500 text-sm">Choose the days and modes patients can book.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                  <button
                    type="button"
                    className="flex-1 sm:flex-none px-4 py-2 border border-slate-300 rounded-xl bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                    onClick={() => setDoctorProfile(current => current ? { ...current, availableDays: [] } : current)}
                    disabled={savingSchedule || !availableDaysCount}
                  >
                    Clear
                  </button>
                  <button
                    className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:bg-blue-400"
                    onClick={handleSaveSchedule}
                    disabled={savingSchedule}
                  >
                    {savingSchedule ? "Saving..." : "Save Schedule"}
                  </button>
                </div>
              </div>

              {/* Consultation Modes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <label className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${videoEnabled ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"}`}>
                  <div>
                    <span className="block mb-1 text-slate-500 text-xs font-bold uppercase tracking-wider">Video Consultation</span>
                    <strong className={`text-base ${videoEnabled ? "text-green-800" : "text-slate-900"}`}>{videoEnabled ? "Available" : "Not available"}</strong>
                  </div>
                  <input type="checkbox" className="w-5 h-5 accent-green-600 cursor-pointer" checked={videoEnabled} onChange={() => toggleTelemedicineMode("videoConsultationEnabled")} />
                </label>

                <label className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${chatEnabled ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"}`}>
                  <div>
                    <span className="block mb-1 text-slate-500 text-xs font-bold uppercase tracking-wider">Chat Consultation</span>
                    <strong className={`text-base ${chatEnabled ? "text-green-800" : "text-slate-900"}`}>{chatEnabled ? "Available" : "Not available"}</strong>
                  </div>
                  <input type="checkbox" className="w-5 h-5 accent-green-600 cursor-pointer" checked={chatEnabled} onChange={() => toggleTelemedicineMode("chatConsultationEnabled")} />
                </label>
              </div>

              {/* Day Selection */}
              <div className="flex flex-wrap gap-3 mb-5">
                {DAYS.map((day) => {
                  const active = doctorProfile.availableDays?.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`px-4 py-2 border rounded-full text-sm font-semibold transition-all ${active ? "bg-blue-50 border-blue-400 text-blue-700 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                      onClick={() => toggleDay(day)}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="text-sm text-slate-500 mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-700">Selected days:</span>{" "}
                {doctorProfile.availableDays?.length ? doctorProfile.availableDays.join(", ") : "No days selected yet"}
              </div>

              {/* Availability Preview */}
              <div className="pt-6 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-5">
                  <strong className="text-slate-900 text-lg">Upcoming telemedicine dates</strong>
                  <span className="text-slate-500 text-sm font-medium bg-slate-100 px-3 py-1 rounded-full">{availableDaysCount} day(s) active</span>
                </div>

                {availabilityPreview.length ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availabilityPreview.map((item) => (
                       <div key={item.day} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                         <span className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{item.day}</span>
                         <strong className="text-slate-900 text-sm">{item.nextDate || "Not set"}</strong>
                       </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No telemedicine days selected yet. Patients will not see available dates until you save at least one day.</p>
                )}
              </div>
            </div>
          )}

          {/* Quick Summary Panel */}
          <div className="bg-gradient-to-b from-blue-50 to-white p-6 border border-blue-100 rounded-3xl shadow-sm h-fit">
            <p className="mb-2 text-blue-600 text-xs font-bold tracking-widest uppercase">Quick Summary</p>
            <h3 className="text-xl font-bold text-slate-900 mb-6">Session Readiness</h3>
            
            <div className="flex flex-col gap-3">
              {[
                { val: approvedCount, label: "approved sessions" },
                { val: telemedicineCount, label: "online consultations" },
                { val: availableDaysCount, label: "days marked available" },
                { val: videoEnabled ? "On" : "Off", label: "video consultation" },
                { val: chatEnabled ? "On" : "Off", label: "chat consultation" },
              ].map((item, i) => (
                 <div key={i} className="flex flex-col p-4 bg-white border border-slate-200 shadow-sm rounded-2xl">
                   <strong className="text-2xl font-bold text-slate-900 mb-1">{item.val}</strong>
                   <span className="text-slate-500 text-sm">{item.label}</span>
                 </div>
              ))}
            </div>
          </div>
        </div>

        {/* APPOINTMENTS SECTION */}
        <div className="pt-8 border-t border-slate-200 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
            <div>
              <p className="mb-2 text-blue-600 text-xs font-bold tracking-widest uppercase">Appointments</p>
              <h2 className="text-3xl font-bold text-slate-900">Manage Sessions</h2>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto bg-slate-100 p-1.5 rounded-full border border-slate-200">
              {["pending", "approved", "rejected"].map((status) => (
                <button
                  key={status}
                  className={`flex-1 md:flex-none px-6 py-2.5 rounded-full text-sm font-semibold capitalize transition-all duration-200 ${tab === status ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  onClick={() => setTab(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {loading && (
             <div className="flex justify-center p-12">
               <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
             </div>
          )}

          {!loading && filtered.length === 0 && (
             <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 border border-slate-100">📅</div>
               <h3 className="text-2xl font-bold text-slate-900 mb-2">No {tab} appointments</h3>
               <p className="text-slate-500">Your {tab} consultation requests will appear here.</p>
             </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Physical Appointments</h3>
                    <p className="text-sm text-slate-500">In-person hospital visits.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                    {filteredPhysicalAppointments.length} Total
                  </span>
                </div>
                {filteredPhysicalAppointments.length ? (
                  filteredPhysicalAppointments.map(renderAppointmentCard)
                ) : (
                  <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500 shadow-sm">
                    No physical appointments in this tab.
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Telemedicine Appointments</h3>
                    <p className="text-sm text-slate-500">Video and chat consultation requests.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                    {filteredTelemedicineAppointments.length} Total
                  </span>
                </div>
                {filteredTelemedicineAppointments.length ? (
                  filteredTelemedicineAppointments.map(renderAppointmentCard)
                ) : (
                  <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500 shadow-sm">
                    No telemedicine appointments in this tab.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {recordsPanel.open && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <p className="mb-2 text-blue-600 text-xs font-bold tracking-widest uppercase">Patient Records</p>
                <h3 className="text-2xl font-bold text-slate-900">{recordsPanel.patientName}</h3>
              </div>
              <button
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
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
              <div className="flex justify-center p-8">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : recordsPanel.error ? (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl font-medium">
                {recordsPanel.error}
              </div>
            ) : recordsPanel.records.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 font-medium">
                No health records uploaded for this patient yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recordsPanel.records.map((record) => (
                  <div key={record._id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">{record.title}</h4>
                        <p className="text-sm text-slate-500 font-medium">{record.recordType}</p>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {new Date(record.recordDate || record.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {record.description && (
                      <p className="text-sm text-slate-600 mb-4">{record.description}</p>
                    )}
                    <a
                      href={`http://localhost:8080${record.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors"
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
    </div>
  );
}

export default DoctorAppointments;
