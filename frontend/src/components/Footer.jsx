import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-8 px-6 sm:px-12 lg:px-24 w-full mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
        
        <div className="md:col-span-5">
          <h3 className="text-white text-xl font-bold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs">EC</span>
            E-Channelling
          </h3>
          <p className="leading-relaxed mb-4 max-w-sm text-sm">
            Smarter access to appointments, online consultations, and everyday
            healthcare support. Making health accessible to everyone.
          </p>
        </div>

        <div className="md:col-span-3">
          <h4 className="text-white font-semibold mb-4 uppercase tracking-wider text-xs">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link to="/hospitals" className="hover:text-white transition-colors">Hospitals</Link></li>
            <li><Link to="/telemedicine" className="hover:text-white transition-colors">Telemedicine</Link></li>
            <li><Link to="/charity" className="hover:text-white transition-colors">Charity</Link></li>
          </ul>
        </div>

        <div className="md:col-span-4">
          <h4 className="text-white font-semibold mb-4 uppercase tracking-wider text-xs">Contact Us</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-blue-500">✉️</span>
              <span>support@echannelling.com</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-500">📞</span>
              <span>+94 11 234 5678</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-500">📍</span>
              <span>123 Health Avenue, Colombo 03, Sri Lanka</span>
            </li>
          </ul>
        </div>

      </div>
      
      <div className="max-w-7xl mx-auto mt-8 pt-4 border-t border-slate-800 text-xs text-center md:text-left flex flex-col md:flex-row justify-between items-center">
        <p>© {new Date().getFullYear()} E-Channelling. All rights reserved.</p>
        <div className="flex gap-4 mt-2 md:mt-0">
          <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
          <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
