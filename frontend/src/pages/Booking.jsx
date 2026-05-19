import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import doctorImg from "../assets/doctor.jpg";
import {
  clearStoredAppointmentPaymentData,
  getStoredAppointmentPaymentData,
  setStoredAppointmentPaymentData,
} from "../utils/paymentBookingStorage";
import { formatDisplayTime } from "../utils/timeFormat";

const weeklyAvailability = [
  { day: "Monday", times: ["09:00", "10:00", "11:00", "14:00"] },
  { day: "Wednesday", times: ["09:00", "10:00", "11:00", "14:00"] },
  { day: "Friday", times: ["09:00", "10:00", "11:00", "14:00"] },
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
  return result.toISOString().split("T")[0];
};

function Booking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const storedPaymentData = useMemo(() => getStoredAppointmentPaymentData(), []);
  const incomingState = useMemo(() => {
    if (location.state && Object.keys(location.state).length > 0) {
      return location.state;
    }

    if (
      storedPaymentData?.returnPath === "/booking" &&
      storedPaymentData?.source === "booking" &&
      storedPaymentData?.fromPaymentReturn
    ) {
      return storedPaymentData;
    }

    return {};
  }, [location.state, storedPaymentData]);
  const isReturningFromPayment =
    incomingState.source === "booking" &&
    incomingState.returnPath === "/booking" &&
    Boolean(incomingState.fromPaymentReturn);

  const doctorData = useMemo(
    () =>
      incomingState || {
        doctorId: null,
        doctor: "Dr. Michel",
        specialty: "cardiologist",
        hospital: "City General Hospital",
        fee: 3500,
        experience: "15 years experience",
        image: "",
        rating: "4.8",
      },
    [incomingState]
  );

  const initialFormState = useMemo(
    () =>
      isReturningFromPayment
        ? {
            day: incomingState.day || "",
            date: incomingState.date || "",
            time: incomingState.time || "",
          }
        : { day: "", date: "", time: "" },
    [incomingState.date, incomingState.day, incomingState.time, isReturningFromPayment]
  );

  const [form, setForm] = useState(initialFormState);
  const telemedicineAvailable =
    Boolean(doctorData.videoConsultationEnabled) || Boolean(doctorData.chatConsultationEnabled);

  useEffect(() => {
    setForm(initialFormState);
  }, [initialFormState]);

  useEffect(() => {
    if (!isReturningFromPayment) {
      clearStoredAppointmentPaymentData();
    }
  }, [isReturningFromPayment]);

  const handleTimeSelect = (day, time) => {
    setForm({
      day,
      time,
      date: getNextDateForDay(day),
    });
  };

  const handleProceedToPayment = () => {
    if (!isAuthenticated) {
      alert("Please login to book an appointment");
      navigate("/login");
      return;
    }

    if (!form.date || !form.time) {
      alert("Please select a weekly slot");
      return;
    }

    if (!doctorData.doctorId) {
      alert("Invalid doctor. Please select a doctor from the doctors page.");
      navigate("/doctors");
      return;
    }

    const paymentState = {
      doctorId: doctorData.doctorId,
      doctor: doctorData.doctor,
      specialty: doctorData.specialty,
      hospital: doctorData.hospital,
      fee: doctorData.fee,
      experience: doctorData.experience,
      image: doctorData.image,
      rating: doctorData.rating,
      patientsCount: doctorData.patientsCount,
      date: form.date,
      day: form.day,
      time: form.time,
      type: "In-Person",
      reservedAppointmentNo: isReturningFromPayment ? incomingState.reservedAppointmentNo || "" : "",
      hasReservedSession: false,
      source: "booking",
      returnPath: "/booking",
      fromPaymentReturn: false,
    };

    setStoredAppointmentPaymentData(paymentState);

    navigate("/appointment-payment", {
      state: paymentState,
    });
  };

  return (
    <div className="min-h-screen p-6 md:p-10 bg-slate-50 font-sans">
      <div className="max-w-5xl mx-auto">
        <button 
          className="flex items-center text-slate-500 hover:text-slate-900 font-bold mb-6 transition-colors"
          onClick={() => navigate(-1)}
        >
          <span className="mr-2">←</span> Back to search
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8 items-start">
          
          <div className="flex flex-col gap-6">
            {/* Doctor Profile Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-48 h-56 sm:h-auto shrink-0 relative rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
                <img
                  src={doctorData.image ? `http://localhost:8080/uploads/${doctorData.image}` : doctorImg}
                  alt={doctorData.doctor}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">{doctorData.doctor}</h2>
                    <p className="text-teal-600 font-bold capitalize">{doctorData.specialty}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-700 font-bold px-3 py-1 rounded-full text-sm border border-amber-200 shadow-sm shrink-0">
                    <span className="text-amber-500">★</span> {doctorData.rating || "4.8"}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100 mb-4">
                  <div>
                    <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Hospital</span>
                    <strong className="text-slate-900 text-sm">{doctorData.hospital || "City General Hospital"}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Experience</span>
                    <strong className="text-slate-900 text-sm">{doctorData.experience || "15 years experience"}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Patients</span>
                    <strong className="text-slate-900 text-sm">{Number(doctorData.patientsCount || 0).toLocaleString()} patients</strong>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Qualifications</span>
                    <strong className="text-slate-900 text-sm">MBBS, MD (Cardiology), FRCP</strong>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Languages</span>
                    <strong className="text-slate-900 text-sm">English, Sinhala</strong>
                  </div>
                </div>

                <div className="text-slate-700 flex items-center gap-2">
                  <span className="text-sm font-medium">Consultation fee:</span>
                  <strong className="text-xl text-slate-900">LKR {Number(doctorData.fee || 0).toLocaleString()}</strong>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {doctorData.videoConsultationEnabled && (
                    <span className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full border border-blue-100">
                      Video Consultation Available
                    </span>
                  )}
                  {doctorData.chatConsultationEnabled && (
                    <span className="inline-flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full border border-emerald-100">
                      Chat Consultation Available
                    </span>
                  )}
                </div>
              </div>
            </div>

            {telemedicineAvailable && (
              <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 rounded-3xl p-6 sm:p-7 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  <div className="max-w-2xl">
                    <span className="inline-block px-3 py-1 bg-white text-slate-700 font-bold text-[10px] uppercase tracking-widest rounded-full mb-3 border border-slate-200">
                      Flexible Option
                    </span>
                    <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
                      This doctor also supports telemedicine
                    </h3>
                    <p className="text-slate-600 font-medium leading-relaxed">
                      If visiting the hospital is inconvenient, you can switch to an online consultation and book
                      video or chat directly from the telemedicine page.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="shrink-0 px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-md transition-all"
                    onClick={() =>
                      navigate("/telemedicine", {
                        state: {
                          selectedDoctor: {
                            _id: doctorData.doctorId,
                            name: doctorData.doctor,
                            specialization: doctorData.specialty,
                            hospital: doctorData.hospital,
                            fee: doctorData.fee,
                            image: doctorData.image,
                            availableDays: [],
                            videoConsultationEnabled: Boolean(doctorData.videoConsultationEnabled),
                            chatConsultationEnabled: Boolean(doctorData.chatConsultationEnabled),
                          },
                          search: doctorData.doctor || "",
                        },
                      })
                    }
                  >
                    Book Online Instead
                  </button>
                </div>
              </div>
            )}

            {/* Availability Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Weekly Availability</h3>

              <div className="space-y-4">
                {weeklyAvailability.map((slot) => (
                  <div key={slot.day} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <h4 className="text-slate-700 font-bold mb-4">{slot.day}</h4>
                    <div className="flex flex-wrap gap-3">
                      {slot.times.map((time) => {
                        const isActive = form.day === slot.day && form.time === time;
                        return (
                          <button
                            key={time}
                            type="button"
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                              isActive
                                ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                                : "bg-white border border-slate-200 text-slate-600 hover:border-teal-500 hover:text-teal-700 shadow-sm"
                            }`}
                            onClick={() => handleTimeSelect(slot.day, time)}
                          >
                            {formatDisplayTime(time)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Panel */}
          <aside className="lg:sticky lg:top-24 mt-6 lg:mt-0">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Book Appointment</h3>

              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-5 mb-6 flex flex-col gap-2">
                <span className="text-slate-600 text-sm font-semibold">Consultation Fee</span>
                <strong className="text-indigo-700 text-2xl font-extrabold">LKR {Number(doctorData.fee || 0).toLocaleString()}</strong>
              </div>

              <button 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 mb-4"
                onClick={handleProceedToPayment}
              >
                Confirm Booking
              </button>

              <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className={`text-sm font-medium ${form.day && form.time ? 'text-teal-700' : 'text-slate-500'}`}>
                  {form.day && form.time
                    ? `Selected: ${form.day} at ${formatDisplayTime(form.time)}`
                    : "Select your preferred date and time to continue"}
                </p>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}

export default Booking;
