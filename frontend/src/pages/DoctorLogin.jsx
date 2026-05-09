import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function DoctorLogin() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/login", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-50 to-blue-50 font-sans p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-[0_20px_40px_-15px_rgba(30,58,138,0.15)] text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-6 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </div>
        
        <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase tracking-widest rounded-full mb-4">
          Redirecting
        </span>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Single Login Page</h2>
        
        <p className="text-slate-500 font-medium leading-relaxed">
          Doctors, admins, and patients now sign in from the same unified login portal. Please wait...
        </p>
        
        <div className="mt-8 flex justify-center">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorLogin;
