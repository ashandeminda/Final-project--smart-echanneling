import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import appointmentService from "../api/appointmentService";
import paymentService from "../api/paymentService";
import { useAuth } from "../context/useAuth";

const APPOINTMENT_BOOKING_STORAGE_KEY = "appointment-payment-booking";

const formatAppointmentDate = (dateValue) => {
  if (!dateValue) {
    return "-";
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return parsedDate.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatAppointmentDay = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  const parsedDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleDateString("en-US", {
    weekday: "long",
  });
};

const getStoredBookingData = () => {
  try {
    const stored = sessionStorage.getItem(APPOINTMENT_BOOKING_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

function AppointmentPayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const bookingData = location.state || getStoredBookingData();
  const stripeSessionId = searchParams.get("session_id");
  const isCancelled = searchParams.get("cancelled") === "true";

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(Boolean(stripeSessionId));
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState(null);
  const [appointmentNumber, setAppointmentNumber] = useState(null);

  useEffect(() => {
    if (location.state && Object.keys(location.state).length > 0) {
      sessionStorage.setItem(APPOINTMENT_BOOKING_STORAGE_KEY, JSON.stringify(location.state));
    }
  }, [location.state]);

  useEffect(() => {
    if (stripeSessionId) {
      paymentService
        .verifyStripeSession(stripeSessionId)
        .then((response) => {
          if (response.status !== "completed") {
            throw new Error("Payment has not been completed yet.");
          }

          setSuccessData(response);
        })
        .catch((err) => {
          console.error("Stripe verification failed:", err);
          setError(err.response?.data?.message || err.message || "Unable to verify payment.");
        })
        .finally(() => setVerifying(false));

      return;
    }

    if (bookingData.doctorId && bookingData.date) {
      appointmentService
        .getNextAppointmentNumber(bookingData.doctorId, bookingData.date)
        .then((res) => {
          if (res.success) {
            setAppointmentNumber(res.appointmentNo);
          }
        })
        .catch((err) => console.error("Failed to fetch appointment no:", err));
    } else {
      setAppointmentNumber(null);
    }
  }, [bookingData.date, bookingData.doctorId, stripeSessionId]);

  useEffect(() => {
    if (successData) {
      sessionStorage.removeItem(APPOINTMENT_BOOKING_STORAGE_KEY);
    }
  }, [successData]);

  const handlePayment = async () => {
    if (!isAuthenticated) {
      alert("Please login to continue");
      navigate("/login");
      return;
    }

    if (!bookingData.doctorId || !bookingData.date || !bookingData.time) {
      alert("Booking details are missing. Please select the appointment slot again.");
      navigate("/booking", { state: bookingData });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await paymentService.initiateAppointmentPayment({
        doctorId: bookingData.doctorId,
        date: bookingData.date,
        time: bookingData.time,
        type: bookingData.type || "In-Person",
        amount: Number(bookingData.fee || 0),
        doctor: bookingData.doctor || "",
        hospital: bookingData.hospital || "",
      });

      if (!response.checkoutUrl) {
        throw new Error("Stripe checkout URL was not returned.");
      }

      window.location.href = response.checkoutUrl;
    } catch (err) {
      console.error("Payment initialization failed:", err);
      setError(err.response?.data?.message || err.message || "Payment failed. Please try again.");
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm max-w-md w-full">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin mb-4"></div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifying payment</h2>
          <p className="text-slate-500 font-medium">Please wait while we confirm your Stripe transaction.</p>
        </div>
      </div>
    );
  }

  if (successData) {
    const appointment = successData.appointment || {};
    const appointmentPayload = successData.payload || {};
    const appointmentNo = appointment.appointmentNo || "N/A";
    const appointmentDate = appointment.date || appointmentPayload.date || bookingData.date || "";
    const appointmentTime = appointment.time || appointmentPayload.time || bookingData.time || "";
    const appointmentType = appointment.type || appointmentPayload.type || bookingData.type || "In-Person";
    const appointmentDoctor = appointmentPayload.doctor || bookingData.doctor || "Doctor";
    const appointmentHospital = appointmentPayload.hospital || bookingData.hospital || "Hospital";
    const appointmentDay = bookingData.day || formatAppointmentDay(appointmentDate);
    const appointmentFee = Number(successData.amount || bookingData.fee || 0);

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-emerald-200 rounded-3xl p-8 shadow-sm max-w-lg w-full text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl text-emerald-600 mb-5">
            ✓
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Appointment confirmed</h2>
          <p className="text-slate-500 font-medium mb-8">
            Your Stripe payment was successful and the appointment has been created.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left mb-6">
            <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.18em]">Appointment Details</p>
                <h3 className="text-slate-900 text-lg font-bold mt-1">{appointmentDoctor}</h3>
                <p className="text-slate-500 text-sm mt-1">{appointmentHospital}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  Confirmed
                </span>
                <p className="text-slate-400 text-xs font-semibold mt-2">No. {appointmentNo}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:col-span-2">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Doctor</p>
                <strong className="text-slate-900 text-lg">{appointmentDoctor}</strong>
                <p className="text-slate-500 text-sm mt-1">{appointmentHospital}</p>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-4">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Appointment No</p>
                <strong className="text-slate-900 text-lg">{appointmentNo}</strong>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-4">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Type</p>
                <strong className="text-slate-900 text-lg">{appointmentType}</strong>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-4">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Date</p>
                <strong className="text-slate-900 text-lg">{formatAppointmentDate(appointmentDate)}</strong>
                {appointmentDay && <p className="text-slate-500 text-sm mt-1">{appointmentDay}</p>}
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-4">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Time</p>
                <strong className="text-slate-900 text-lg">{appointmentTime || "-"}</strong>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:col-span-2">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Consultation Fee</p>
                <strong className="text-indigo-700 text-lg">LKR {appointmentFee.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          <button
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-2xl transition-all"
            onClick={() => navigate("/myappoinment")}
          >
            View My Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10 bg-slate-50 font-sans">
      <div className="max-w-4xl mx-auto">
        <button
          className="flex items-center text-slate-500 hover:text-slate-900 font-bold mb-6 transition-colors"
          onClick={() => navigate(-1)}
        >
          <span className="mr-2">&larr;</span> Back to booking
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-8 items-start">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Stripe Payment</h2>
            <p className="text-slate-500 mb-6 font-medium">
              Continue to Stripe Checkout to securely pay the consultation fee and confirm your appointment.
            </p>

            {isCancelled && (
              <div className="mb-5 p-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-200 text-sm font-semibold">
                Payment was cancelled. You can try again whenever you are ready.
              </div>
            )}

            {error && (
              <div className="mb-5 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-200 text-sm font-semibold">
                {error}
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-3">What happens next</h3>
              <div className="space-y-3 text-sm text-slate-600 font-medium">
                <p>1. Click the button below to open Stripe Checkout.</p>
                <p>2. Complete your card payment on Stripe's secure page.</p>
                <p>3. We will automatically verify the payment and create your appointment.</p>
              </div>
            </div>

            <button
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0 text-lg"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? "Redirecting to Stripe..." : "Pay with Stripe"}
            </button>
          </div>

          <aside className="lg:sticky lg:top-24 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
            <h3 className="text-xl font-bold text-slate-900">Appointment Summary</h3>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Appointment No</span>
                <strong className="text-blue-600 text-base">{appointmentNumber || "Fetching..."}</strong>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Doctor</span>
                <strong className="text-slate-900 text-base">{bookingData.doctor || "Doctor"}</strong>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Hospital</span>
                <strong className="text-slate-900 text-base">{bookingData.hospital || "Hospital"}</strong>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Time Slot</span>
                <strong className="text-slate-900 text-base">
                  {bookingData.day || "-"} {bookingData.time ? `- ${bookingData.time}` : ""}
                </strong>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Appointment Date</span>
                <strong className="text-slate-900 text-base">{bookingData.date || "-"}</strong>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-5 mt-2 flex flex-col gap-2">
              <span className="text-slate-600 text-sm font-semibold">Consultation Fee</span>
              <strong className="text-indigo-700 text-3xl font-extrabold">
                LKR {Number(bookingData.fee || 0).toLocaleString()}
              </strong>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default AppointmentPayment;
