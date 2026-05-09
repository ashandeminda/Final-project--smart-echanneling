import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import doctorImg from "../assets/doctor.jpg";

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

  const doctorData = location.state || {
    doctorId: null,
    doctor: "Dr. Michel",
    specialty: "cardiologist",
    hospital: "City General Hospital",
    fee: 3500,
    experience: "15 years experience",
    image: "",
    rating: "4.8",
  };

  const [form, setForm] = useState({
    day: "",
    date: "",
    time: "",
  });

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

    navigate("/appointment-payment", {
      state: {
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
      },
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
              </div>
            </div>

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
                            {time}
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
                    ? `Selected: ${form.day} at ${form.time}`
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
