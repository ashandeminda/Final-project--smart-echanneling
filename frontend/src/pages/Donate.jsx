import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import paymentService from "../api/paymentService";

function Donate() {
  const location = useLocation();
  const amount = location.state?.amount || 0;
  const campaignKey = location.state?.campaignKey || "general";
  const isCancelled = new URLSearchParams(location.search).get("cancelled") === "true";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDonate = async () => {
    setError("");

    if (!amount || Number(amount) <= 0) {
      setError("Invalid donation amount. Please restart from the Charity page.");
      return;
    }

    if (!isAnonymous && !name.trim()) {
      setError("Please enter your name or choose anonymous donation.");
      return;
    }

    if (!email.trim() || !phone.trim()) {
      setError("Please enter your email and phone number.");
      return;
    }

    try {
      setLoading(true);
      const response = await paymentService.initiateDonationPayment({
        name: isAnonymous ? "Anonymous" : name,
        amount: Number(amount),
        isAnonymous,
        email,
        phone,
        campaignKey,
      });

      if (!response.checkoutUrl) {
        throw new Error("Stripe checkout URL was not returned.");
      }

      window.location.href = response.checkoutUrl;
    } catch (err) {
      console.error("Donation initialization failed:", err);
      setError(err.response?.data?.message || err.message || "Donation failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 font-sans flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white p-8 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl mb-5 shadow-sm border border-rose-100">
            <span className="text-3xl">&#10084;</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Donate with Stripe</h2>
          <p className="text-slate-500 font-medium text-sm">Every contribution makes a difference.</p>
        </div>

        {isCancelled && (
          <div className="mb-6 p-4 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
            <p className="text-sm font-semibold">Payment was cancelled. You can try again anytime.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-start gap-3 transition-opacity">
            <span className="text-lg leading-none mt-0.5">!</span>
            <p className="text-sm font-semibold leading-relaxed">{error}</p>
          </div>
        )}

        <div className="bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100 shadow-inner">
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200/60">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Fund</span>
            <strong className="text-slate-800 text-sm capitalize">{campaignKey.replace(/-/g, " ")}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Amount</span>
            <strong className="text-rose-600 text-2xl font-extrabold">
              LKR {Number(amount).toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              Donor Name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              value={isAnonymous ? "Anonymous Donation" : name}
              onChange={(e) => setName(e.target.value)}
              disabled={isAnonymous}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-rose-400 focus:bg-white transition-all text-slate-900 placeholder-slate-400 font-medium disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed shadow-sm"
            />
          </div>

          <label className="flex items-center gap-3 p-3.5 border-2 border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors group">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-5 h-5 rounded text-rose-500 focus:ring-rose-500 accent-rose-500 cursor-pointer"
            />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
              Donate anonymously
            </span>
          </label>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 mt-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-rose-400 focus:bg-white transition-all text-slate-900 placeholder-slate-400 font-medium shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              Phone Number
            </label>
            <input
              type="text"
              placeholder="077XXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-rose-400 focus:bg-white transition-all text-slate-900 placeholder-slate-400 font-medium font-mono shadow-sm"
            />
          </div>
        </div>

        <button
          onClick={handleDonate}
          disabled={loading || Number(amount) <= 0}
          className="w-full mt-8 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-95"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-white animate-spin"></span>
              Redirecting to Stripe...
            </span>
          ) : (
            "Proceed to Stripe"
          )}
        </button>
      </div>
    </div>
  );
}

export default Donate;
