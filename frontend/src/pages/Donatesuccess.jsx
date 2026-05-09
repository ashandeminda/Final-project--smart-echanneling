import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import paymentService from "../api/paymentService";

function DonationSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(Boolean(sessionId));
  const [error, setError] = useState("");
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      setError("Missing Stripe session details.");
      return;
    }

    paymentService
      .verifyStripeSession(sessionId)
      .then((response) => {
        if (response.status !== "completed") {
          throw new Error("Donation payment has not been completed yet.");
        }

        setAmount(response.amount || response.donation?.amount || 0);
      })
      .catch((err) => {
        console.error("Donation verification failed:", err);
        setError(err.response?.data?.message || err.message || "Unable to verify donation.");
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm max-w-lg w-full text-center">
        {loading ? (
          <>
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin mb-4"></div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifying donation</h2>
            <p className="text-slate-500 font-medium">Please wait while we confirm your Stripe payment.</p>
          </>
        ) : error ? (
          <>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Unable to confirm donation</h2>
            <p className="text-red-600 font-medium mb-6">{error}</p>
            <button
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-2xl transition-all"
              onClick={() => navigate("/charity")}
            >
              Back to charity
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl text-emerald-600 mb-5">
              ✓
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Donation successful</h2>
            <p className="text-slate-500 font-medium mb-6">
              Thank you for donating LKR {Number(amount).toLocaleString()} through Stripe.
            </p>

            <button
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-2xl transition-all"
              onClick={() => navigate("/charity")}
            >
              Back to charity
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default DonationSuccess;
