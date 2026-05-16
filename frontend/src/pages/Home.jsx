import React from "react";
import { useNavigate } from "react-router-dom";
import heroImg from "../assets/check.png";
// No custom css - using Tailwind

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-linear-to-br from-slate-900 via-blue-900 to-indigo-900 text-white py-20 lg:py-32 px-6 sm:px-12 lg:px-24 flex flex-col lg:flex-row items-center justify-between min-h-[80vh]">
        {/* Background decorative blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="w-full lg:w-1/2 z-10 mb-16 lg:mb-0 text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Your Health, <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-teal-300">Our Priority</span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100/80 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Book appointments, consult doctors online, check symptoms
            and support healthcare — all in one elegantly simple smart platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5">
            <button
              onClick={() => navigate("/hospitals")}
              className="w-full sm:w-auto px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.7)] transition-all duration-300 transform hover:-translate-y-1"
            >
              Make an Appointment
            </button>
            <button
              onClick={() => navigate("/symptom-checker")}
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white font-semibold rounded-full shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              AI Symptom Checker
            </button>
          </div>
        </div>

        <div className="w-full lg:w-1/2 z-10 flex justify-center lg:justify-end relative">
          <div className="relative">
            {/* Soft glow behind image */}
            <div className="absolute -inset-1 bg-linear-to-r from-blue-500 to-teal-500 rounded-3xl blur opacity-30"></div>
            <img
              src={heroImg}
              alt="Healthcare professional"
              className="relative w-full max-w-md lg:max-w-lg rounded-3xl shadow-2xl object-cover transform rotate-2 hover:rotate-0 transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-18 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Everything you need</h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">A comprehensive suite of healthcare tools at your fingertips.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div onClick={() => navigate("/hospitals")} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group cursor-pointer">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
              🏥
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Find Hospitals</h3>
            <p className="text-gray-500 leading-relaxed">Search trusted hospitals and specialists near you with verified reviews.</p>
          </div>

          {/* Feature 2 */}
          <div onClick={() => navigate("/symptomchecker")} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group cursor-pointer">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm">
              🤖
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">AI Checker</h3>
            <p className="text-gray-500 leading-relaxed">Analyze your symptoms instantly and get personalized doctor recommendations.</p>
          </div>

          {/* Feature 3 */}
          <div onClick={() => navigate("/telemedicine")} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group cursor-pointer">
            <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300 shadow-sm">
              💻
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Telemedicine</h3>
            <p className="text-gray-500 leading-relaxed">Consult with specialized doctors online via secure high-quality video or chat.</p>
          </div>

          {/* Feature 4 */}
          <div onClick={() => navigate("/charity")} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group cursor-pointer">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300 shadow-sm">
              ❤️
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Charity Support</h3>
            <p className="text-gray-500 leading-relaxed">Support essential healthcare services for underprivileged communities effortlessly.</p>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative overflow-hidden bg-blue-600 py-20 px-6">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-indigo-500 rounded-full opacity-50 blur-3xl"></div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to take care of your health?</h2>
          <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">Join thousands of users who have simplified their healthcare journey with Smart EChanneling.</p>
          <button
            onClick={() => navigate("/register")}
            className="px-10 py-4 bg-white text-blue-600 font-bold rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            Get Started Now
          </button>
        </div>
      </section>



    </div>
  );
}

export default Home;
