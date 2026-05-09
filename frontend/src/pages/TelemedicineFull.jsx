import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import doctorImg from "../assets/doctor.jpg";
import doctorService from "../api/doctorService";
import appointmentService from "../api/appointmentService";
import paymentService from "../api/paymentService";
import { useAuth } from "../context/useAuth";

const defaultTimeSlots = ["09:00", "10:00", "11:00", "14:00"];

const dayIndexMap = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const orderedDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const getNextDateForDay = (dayName) => {
  const today = new Date();
  const target = dayIndexMap[dayName];

  if (target === undefined) {
    return "";
  }

  const result = new Date(today);
  const diff = (target - today.getDay() + 7) % 7 || 7;
  result.setDate(today.getDate() + diff);
  return result.toISOString().split("T")[0];
};

const formatDisplayDate = (dateValue) => {
  if (!dateValue) return "";

  const parsedDate = new Date(`${dateValue}T00:00:00`);
  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function TelemedicineFull() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [sessionType, setSessionType] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState({ day: "", time: "", date: "" });
  const [search, setSearch] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [nextAppointmentNo, setNextAppointmentNo] = useState(null);

  useEffect(() => {
    if (selectedDoctor?._id && selectedSlot.date) {
      appointmentService
        .getNextAppointmentNumber(selectedDoctor._id, selectedSlot.date)
        .then((res) => {
          if (res.success) setNextAppointmentNo(res.appointmentNo);
        })
        .catch((err) => console.error("Failed to fetch appointment no:", err));
    } else {
      setNextAppointmentNo(null);
    }
  }, [selectedDoctor, selectedSlot.date]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const data = await doctorService.getAllDoctors();
        setDoctors(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const name = String(doc?.name || "").toLowerCase();
      const specialization = String(doc?.specialization || "").toLowerCase();
      const keyword = search.toLowerCase();
      const matchesSearch = name.includes(keyword) || specialization.includes(keyword);
      const supportsSession =
        sessionType === "Video Consultation"
          ? Boolean(doc?.videoConsultationEnabled)
          : sessionType === "Chat Consultation"
            ? Boolean(doc?.chatConsultationEnabled)
            : Boolean(doc?.videoConsultationEnabled || doc?.chatConsultationEnabled);

      return matchesSearch && supportsSession;
    });
  }, [doctors, search, sessionType]);

  const availableDoctorCount = useMemo(() => {
    if (!sessionType) {
      return doctors.filter(
        (doc) => doc?.videoConsultationEnabled || doc?.chatConsultationEnabled
      ).length;
    }

    return doctors.filter((doc) =>
      sessionType === "Video Consultation"
        ? Boolean(doc?.videoConsultationEnabled)
        : Boolean(doc?.chatConsultationEnabled)
    ).length;
  }, [doctors, sessionType]);

  const consultationFee = useMemo(() => {
    const baseFee = Number(selectedDoctor?.fee || 0);
    if (sessionType === "Chat Consultation") {
      return Math.round(baseFee * 0.7);
    }
    return baseFee;
  }, [selectedDoctor, sessionType]);

  const needsPayment =
    (sessionType === "Video Consultation" || sessionType === "Chat Consultation") &&
    consultationFee > 0;

  const doctorAvailability = useMemo(() => {
    const savedDays = Array.isArray(selectedDoctor?.availableDays)
      ? selectedDoctor.availableDays
      : [];

    const normalizedDays = savedDays
      .filter((day) => orderedDays.includes(day))
      .sort((a, b) => orderedDays.indexOf(a) - orderedDays.indexOf(b));

    return normalizedDays.map((day) => ({
      day,
      date: getNextDateForDay(day),
      times: defaultTimeSlots,
    }));
  }, [selectedDoctor]);

  const readiness = [
    { label: "Consultation Mode", done: Boolean(sessionType) },
    { label: "Doctor Selection", done: Boolean(selectedDoctor?._id) },
    { label: "Meeting Slot", done: Boolean(selectedSlot.date && selectedSlot.time) },
    { label: "Payment", done: !needsPayment || Boolean(selectedDoctor?._id && selectedSlot.date && selectedSlot.time) },
  ];

  const completedCount = readiness.filter((item) => item.done).length;

  const handleSelectSlot = (day, time) => {
    setSelectedSlot({
      day,
      time,
      date: getNextDateForDay(day),
    });
  };

  const handleConfirm = async () => {
    if (!isAuthenticated) {
      alert("Please login to continue");
      navigate("/login");
      return;
    }

    if (!sessionType) {
      alert("Please select consultation type");
      return;
    }

    if (!selectedDoctor?._id) {
      alert("Please select a doctor");
      return;
    }

    if (!selectedSlot.date || !selectedSlot.time) {
      alert("Please select an appointment time");
      return;
    }

    try {
      setSubmitting(true);

      if (needsPayment) {
        const response = await paymentService.initiateAppointmentPayment({
          doctorId: selectedDoctor._id,
          date: selectedSlot.date,
          time: selectedSlot.time,
          type: sessionType,
          amount: consultationFee,
          doctor: selectedDoctor.name || "",
          hospital: selectedDoctor.hospital || "",
        });

        if (!response.checkoutUrl) {
          throw new Error("Stripe checkout URL was not returned.");
        }

        window.location.href = response.checkoutUrl;
        return;
      }

      const data = await appointmentService.createAppointment({
        doctorId: selectedDoctor._id,
        date: selectedSlot.date,
        time: selectedSlot.time,
        type: sessionType,
      });

      const appointmentNo = data?.appointment?.appointmentNo || data?.appointmentNo || "N/A";
      alert(`Consultation booked successfully!\nAppointment No: ${appointmentNo}`);
      navigate("/myappoinment");
    } catch (err) {
      console.error("Booking failed:", err);
      alert(err.response?.data?.message || err.message || "Failed to confirm consultation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 font-bold text-[11px] uppercase tracking-widest rounded-full mb-4 border border-blue-100">
              Telemedicine Studio
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight tracking-tight">
              Online doctor consultations, simplified
            </h1>
            <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-md">
              Pick a consultation mode, choose a specialist, and confirm your session from one clean booking workspace.
            </p>
          </div>
          <div className="flex gap-4 flex-wrap justify-start lg:justify-end shrink-0">
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-[1.5rem] min-w-[150px] flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Modes</span>
              <strong className="block text-xl font-extrabold text-slate-900 text-center">Video + Chat</strong>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-[1.5rem] min-w-[150px] flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Available Doctors</span>
              <strong className="block text-2xl font-extrabold text-slate-900 text-center">{availableDoctorCount || 0}</strong>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[1.5rem] min-w-[150px] flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2 block">Ready</span>
              <strong className="block text-3xl font-extrabold text-emerald-900 text-center">{completedCount} <span className="text-xl opacity-50">/ {readiness.length}</span></strong>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start relative">
          <div className="xl:col-span-2 flex flex-col gap-8">
            <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-8 shadow-sm">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-widest rounded-full mb-3 border border-slate-200">
                  Step 1
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900">Select consultation mode</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  className={`text-left p-6 rounded-[1.5rem] border-2 transition-all duration-300 relative overflow-hidden group ${
                    sessionType === "Video Consultation"
                      ? "border-blue-500 bg-blue-50/50 shadow-md transform -translate-y-1"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                  onClick={() => setSessionType("Video Consultation")}
                >
                  <span className={`inline-block mb-3 text-xs font-bold uppercase tracking-widest ${sessionType === "Video Consultation" ? "text-blue-600" : "text-emerald-600"}`}>
                    Live Video
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Video Consultation</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">Best for full reviews, discussion, and guided visual consultation.</p>
                </button>

                <button
                  type="button"
                  className={`text-left p-6 rounded-[1.5rem] border-2 transition-all duration-300 relative overflow-hidden group ${
                    sessionType === "Chat Consultation"
                      ? "border-blue-500 bg-blue-50/50 shadow-md transform -translate-y-1"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                  onClick={() => setSessionType("Chat Consultation")}
                >
                  <span className={`inline-block mb-3 text-xs font-bold uppercase tracking-widest ${sessionType === "Chat Consultation" ? "text-blue-600" : "text-indigo-600"}`}>
                    Text Session
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Chat Consultation</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">Good for follow-ups, quick questions, and low-friction support.</p>
                </button>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-8 shadow-sm">
              <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-widest rounded-full mb-3 border border-slate-200">
                    Step 2
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-900">Search your specialist</h2>
                </div>
                <div className="w-full md:max-w-[300px]">
                  <input
                    type="text"
                    placeholder="Search name or specialty..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all text-slate-900 placeholder-slate-400 font-medium"
                  />
                </div>
              </div>

              {loading && (
                <div className="flex justify-center p-8">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              )}
              {!loading && filteredDoctors.length === 0 && (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <p className="text-slate-500 font-medium">No doctors available for this selection right now.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDoctors.map((doc) => (
                  <button
                    type="button"
                    key={doc._id}
                    onClick={() => setSelectedDoctor(doc)}
                    className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 flex gap-4 items-start ${
                      selectedDoctor?._id === doc._id
                        ? "border-blue-500 bg-blue-50/30 shadow-md ring-4 ring-blue-50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="w-20 h-24 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200/60">
                      <img
                        src={doc.image ? `http://localhost:8080/uploads/${doc.image}` : doctorImg}
                        alt={doc.name || "doctor"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 mb-0.5 truncate">{doc.name || "Doctor"}</h3>
                      <span className="inline-block bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-indigo-100 mb-2 truncate max-w-full">
                        {doc.specialization || "Specialist"}
                      </span>
                      <p className="text-xs text-slate-500 font-medium mb-3 truncate block w-full" title={doc.hospital || "Hospital not specified"}>{doc.hospital || "Hospital not specified"}</p>
                      <strong className="block text-slate-900 font-extrabold text-sm">LKR {Number(doc.fee || 0).toLocaleString()}</strong>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-8 shadow-sm">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-widest rounded-full mb-3 border border-slate-200">
                  Step 3
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900">Pick an available slot</h2>
              </div>

              {!selectedDoctor && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl text-sm font-bold">
                  Please select a doctor first to see available days.
                </div>
              )}

              {selectedDoctor && !doctorAvailability.length && (
                <div className="bg-slate-50 border border-slate-200 text-slate-500 p-6 rounded-xl text-center font-medium">
                  This doctor has not saved telemedicine availability yet.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctorAvailability.map((slot) => (
                  <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm" key={slot.day}>
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                      <h3 className="font-bold text-slate-900 text-lg">{slot.day}</h3>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">{formatDisplayDate(slot.date)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {slot.times.map((time) => (
                        <button
                          key={time}
                          type="button"
                          className={`px-4 py-2 text-sm font-bold rounded-xl border transition-all ${
                            selectedSlot.day === slot.day && selectedSlot.time === time
                              ? "bg-slate-900 text-white border-slate-900 shadow-md transform -translate-y-0.5"
                              : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                          }`}
                          onClick={() => handleSelectSlot(slot.day, time)}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {needsPayment && (
              <div className="bg-slate-50 border-2 border-slate-300 rounded-[2rem] p-8 shadow-sm shadow-blue-900/5">
                <div className="mb-6">
                  <span className="inline-block px-3 py-1 bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-widest rounded-full mb-3 border border-slate-300">
                    Step 4
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">Stripe Payment <span className="text-sm font-bold ml-auto bg-slate-900 text-white px-3 py-1 rounded-xl">LKR {consultationFee.toLocaleString()}</span></h2>
                </div>

                <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <p className="text-slate-600 font-medium leading-relaxed">
                    After you confirm, we will redirect you to Stripe Checkout to securely complete the telemedicine payment.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <span className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Mode</span>
                      <strong className="text-slate-900">{sessionType}</strong>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <span className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Doctor</span>
                      <strong className="text-slate-900">{selectedDoctor?.name || "-"}</strong>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <span className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Amount</span>
                      <strong className="text-slate-900">LKR {consultationFee.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="xl:col-span-1">
            <div className="bg-slate-900 text-white rounded-[2rem] p-8 shadow-xl sticky top-24 border border-slate-800">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 bg-white/10 text-slate-300 font-bold text-[10px] uppercase tracking-widest rounded-full mb-3">
                  Summary
                </span>
                <h2 className="text-2xl font-bold">Booking Summary</h2>
              </div>

              <div className="space-y-3 mb-8 bg-black/20 p-5 rounded-2xl border border-white/5">
                {readiness.map((item) => (
                  <div key={item.label} className={`flex justify-between items-center py-1.5 border-b border-white/5 last:border-0 ${item.done ? "opacity-100" : "opacity-40"}`}>
                    <strong className="text-sm font-medium">{item.label}</strong>
                    {item.done ? (
                      <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Done</span>
                    ) : (
                      <span className="bg-white/10 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Pending</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Consultation</span>
                  <strong className="text-[15px]">{sessionType || "Not selected"}</strong>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Appointment No</span>
                  <strong className="text-[15px] text-blue-400">{nextAppointmentNo || "-"}</strong>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Doctor</span>
                  <strong className="text-[15px]">{selectedDoctor?.name || "Not selected"}</strong>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Specialty</span>
                    <strong className="text-sm truncate" title={selectedDoctor?.specialization || "-"}>{selectedDoctor?.specialization || "-"}</strong>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Hospital</span>
                    <strong className="text-sm truncate" title={selectedDoctor?.hospital || "-"}>{selectedDoctor?.hospital || "-"}</strong>
                  </div>
                </div>
                <div className="flex flex-col gap-1 pt-4 border-t border-white/10">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Time</span>
                  <strong className="text-[15px] text-blue-300">
                    {selectedSlot.day && selectedSlot.time ? `${selectedSlot.day} - ${selectedSlot.time}` : "Not selected"}
                  </strong>
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-white/10">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Fee</span>
                  <strong className="text-2xl text-emerald-400">LKR {consultationFee.toLocaleString()}</strong>
                </div>
              </div>

              <button
                type="button"
                className="w-full py-4 px-6 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-[15px] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95 flex items-center justify-center gap-2"
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-slate-900 border-t-transparent animate-spin"></span>
                    {needsPayment ? "Redirecting..." : "Confirming..."}
                  </>
                ) : needsPayment ? "Continue to Stripe" : "Confirm Telemedicine Booking"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TelemedicineFull;
