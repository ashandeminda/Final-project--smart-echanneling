import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// Import useAuth hook to connect with backend authentication
import { useAuth } from "../context/useAuth";

const handleRoleRedirect = (result, navigate, logout) => {
  if (result.user?.role === "doctor") {
    navigate("/doctor-appointments");
    return;
  }

  if (result.user?.role === "admin") {
    navigate("/admin-dashboard");
    return;
  }

  navigate("/");
};

function Auth() {

  const navigate = useNavigate();
  // Get login function from AuthContext (calls backend API)
  const { login, logout } = useAuth();
  const [step, setStep] = useState("login");
  // Loading state to show feedback during API call
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    newPassword: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle login - calls backend POST /api/v1/user/login
  const handleLogin = async () => {
    if (!form.email || !form.password) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);
    // Call the login function from AuthContext which sends request to backend
    const result = await login(form.email, form.password);
    setLoading(false);

    if (result.success) {
      handleRoleRedirect(result, navigate, logout);
    } else {
      // Show error message from backend
      alert(result.message);
    }
  };

  const inputClass = "w-full mt-2 mb-4 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-700";
  const labelClass = "block text-sm font-semibold text-slate-700";
  const btnClass = "w-full mt-4 bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0";

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 relative overflow-hidden via-white to-blue-50 font-sans">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-100 relative z-10">
        
        {/* Decorative corner accent */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600 rounded-full blur-3xl opacity-[0.08] pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-600 rounded-full blur-3xl opacity-[0.08] pointer-events-none"></div>

        <div className="relative z-10">
          {/* 🔹 LOGIN */}
          {step === "login" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm border border-blue-100">
                👋
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome Back</h2>
              <p className="text-slate-500 mb-8 text-base">
                Sign in to your account
              </p>

              <div>
                <label className={labelClass}>Email address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="your.email@example.com"
                  className={inputClass}
                  value={form.email}
                  onChange={handleChange}
                />

                <label className={labelClass}>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  className={inputClass}
                  value={form.password}
                  onChange={handleChange}
                />

                <div className="flex justify-end -mt-2 mb-6">
                  <span 
                    onClick={() => setStep("forgot")}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
                  >
                    Forgot password?
                  </span>
                </div>

                <button className={btnClass} onClick={handleLogin} disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </button>

                <div className="mt-8 space-y-4 text-center">
                  <p className="text-slate-600 text-sm">
                    Don’t have an account?{" "}
                    <span 
                      onClick={() => navigate("/register")}
                      className="text-blue-600 font-semibold cursor-pointer py-1 hover:underline"
                    >
                      Register here
                    </span>
                  </p>
                  <div className="h-px bg-slate-100 w-full"></div>
                  <p className="text-slate-500 text-xs mt-4">
                    Admin access?{" "}
                    <span 
                      onClick={() => navigate("/login")}
                      className="text-slate-800 font-medium cursor-pointer hover:underline"
                    >
                      Admin login
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 🔹 FORGOT PASSWORD */}
          {step === "forgot" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button 
                onClick={() => setStep("login")}
                className="text-slate-400 hover:text-slate-800 transition-colors flex items-center text-sm font-medium mb-8 outline-none"
              >
                ← Back to login
              </button>

              <h3 className="text-2xl font-bold text-slate-900 mb-2">Forgot Password</h3>
              <p className="text-slate-500 mb-6 font-medium text-sm">
                Enter your registered email address to receive a reset code.
              </p>

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className={inputClass}
                value={form.email}
                onChange={handleChange}
              />

              <button className={btnClass} onClick={() => setStep("otp")}>
                Send Verfication Code
              </button>
            </div>
          )}

          {/* 🔹 OTP */}
          {step === "otp" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button 
                onClick={() => setStep("forgot")}
                className="text-slate-400 hover:text-slate-800 transition-colors flex items-center text-sm font-medium mb-8 outline-none"
              >
                ← Back
              </button>

              <h3 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h3>
              <p className="text-slate-500 mb-8 font-medium text-sm">
                We've sent a 4-digit verification code to your email.
              </p>

              <div className="flex justify-between gap-3 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <input 
                    key={i} 
                    maxLength={1} 
                    className="w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900"
                  />
                ))}
              </div>

              <button className={btnClass} onClick={() => setStep("change")}>
                Verify Code
              </button>
              
              <p className="text-center mt-6 text-sm text-slate-500 font-medium">
                Didn't receive the code? <span className="text-blue-600 cursor-pointer hover:underline">Resend</span>
              </p>
            </div>
          )}

          {/* 🔹 CHANGE PASSWORD */}
          {step === "change" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button 
                onClick={() => setStep("otp")}
                className="text-slate-400 hover:text-slate-800 transition-colors flex items-center text-sm font-medium mb-8 outline-none"
              >
                ← Back
              </button>

              <h3 className="text-2xl font-bold text-slate-900 mb-6">Create New Password</h3>

              <label className={labelClass}>New Password</label>
              <input
                type="password"
                name="newPassword"
                placeholder="Enter new password"
                className={inputClass}
                value={form.newPassword}
                onChange={handleChange}
              />

              <button className={btnClass} onClick={() => setStep("success")}>
                Update Password
              </button>
            </div>
          )}

          {/* 🔹 SUCCESS */}
          {step === "success" && (
            <div className="animate-in fade-in zoom-in duration-500 text-center py-6">
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm border border-green-100">
                ✓
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Password Reset!</h3>
              <p className="text-slate-500 mb-8 font-medium">Your password has been successfully changed.</p>

              <button className={btnClass} onClick={() => setStep("login")}>
                Back to Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Auth;
