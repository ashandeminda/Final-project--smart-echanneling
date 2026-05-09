import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// Import useAuth hook to connect with backend registration
import { useAuth } from "../context/useAuth";

function Register() {

  const navigate = useNavigate();
  // Get register function from AuthContext (calls backend API)
  const { register } = useAuth();
  // Loading state to show feedback during API call
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle register - calls backend POST /api/v1/user/register
  const handleRegister = async () => {

    if (!form.name || !form.email || !form.password || !form.phone) {
      alert("Please fill all required fields");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);
    // Send registration data to backend via AuthContext
    const result = await register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
    });
    setLoading(false);

    if (result.success) {
      // Registration now signs the user in immediately.
      alert("Registration successful!");
      navigate("/");
    } else {
      // Show error from backend (e.g., "User already exists")
      alert(result.message);
    }
  };

  const inputClass = "w-full mt-2 mb-3.5 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-700 text-sm";
  const labelClass = "block text-sm font-semibold text-slate-700";

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-gradient-to-tr from-slate-50 via-white to-indigo-50 font-sans md:py-12 relative overflow-hidden">
      <div className="w-full max-w-[460px] bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-100 relative z-10">
        
        {/* Decorative elements */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-blue-500 rounded-full blur-[50px] opacity-[0.06] pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-teal-500 rounded-full blur-[50px] opacity-[0.06] pointer-events-none"></div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5 shadow-sm border border-indigo-100">
              👤
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Create Account</h2>
            <p className="text-slate-500 font-medium text-sm">Join Smart E-Channelling today</p>
          </div>

          <div className="space-y-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <label className={labelClass}>Full name</label>
            <input
              name="name"
              placeholder="John Doe"
              className={inputClass}
              value={form.name}
              onChange={handleChange}
            />

            <label className={labelClass}>Email address</label>
            <input
              name="email"
              type="email"
              placeholder="john@example.com"
              className={inputClass}
              value={form.email}
              onChange={handleChange}
            />

            <label className={labelClass}>Phone number</label>
            <input
              name="phone"
              placeholder="+94 XX XXX XXXX"
              className={inputClass}
              value={form.phone}
              onChange={handleChange}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Password</label>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className={inputClass}
                  value={form.password}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className={labelClass}>Confirm</label>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className={inputClass}
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <button 
            className="w-full mt-6 bg-slate-900 text-white font-bold py-4 px-4 rounded-xl shadow-[0_10px_20px_rgba(15,23,42,0.15)] hover:shadow-xl hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0"
            onClick={handleRegister} 
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-center mt-8 text-slate-600 text-sm font-medium">
            Already have an account?{" "}
            <span 
              onClick={() => navigate("/login")}
              className="text-blue-600 font-bold cursor-pointer hover:text-blue-800 transition-colors py-2"
            >
              Sign in
            </span>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Register;
