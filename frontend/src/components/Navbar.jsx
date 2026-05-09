import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import Logo from "../assets/logo.png";
import DefaultProfile from "../assets/doctor.jpg";
// Import useAuth hook to access logged-in user from AuthContext
import { useAuth } from "../context/useAuth";

function Navbar() {
  const navigate = useNavigate();
  // Get user & logout from AuthContext (backed by real backend auth)
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const profileImage = user?.profilePic
    ? `http://localhost:8080/uploads/${user.profilePic}`
    : DefaultProfile;

  // Handle logout - clears token and user from AuthContext and localStorage
  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate("/");
  };

  const navLinkClasses = ({ isActive }) =>
    `text-gray-700 font-medium transition-colors hover:text-blue-600 ${isActive ? "bg-blue-50 text-blue-600 px-4 py-2 rounded-full" : "px-4 py-2"}`;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate("/")}>
            <img src={Logo} alt="logo" className="h-18 w-auto" />
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex space-x-2 items-center">
            <NavLink to="/" className={navLinkClasses}>Home</NavLink>
            <NavLink to="/hospitals" className={navLinkClasses}>Hospitals</NavLink>
            <NavLink to="/symptomchecker" className={navLinkClasses}>Symptom Checkers</NavLink>
            <NavLink to="/telemedicine" className={navLinkClasses}>Telemedicine</NavLink>
            <NavLink to="/charity" className={navLinkClasses}>Charity</NavLink>
          </div>

          {/* Buttons & Profile - Desktop & Mobile */}
          <div className="flex items-center gap-4">
            {!user ? (
              <div className="hidden md:flex gap-3">
                <button onClick={() => navigate("/login")} className="px-5 py-2 text-sm rounded-full border border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white transition-colors font-medium">
                  Login
                </button>
                <button onClick={() => navigate("/register")} className="px-5 py-2 text-sm rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium">
                  Register
                </button>
              </div>
            ) : (
              <div className="relative">
                <div
                  className="flex items-center gap-2 cursor-pointer p-1 rounded-full hover:bg-gray-100 transition-colors"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <img
                    src={profileImage}
                    alt="profile"
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    onError={(e) => { e.currentTarget.src = DefaultProfile; }}
                  />
                  <span className="text-xs text-gray-500 mr-2">▼</span>
                </div>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50">
                    <p className="px-4 py-2 border-b border-gray-100 text-sm font-semibold text-center text-gray-800 truncate">
                      {user.name}
                    </p>
                    {user.role === "doctor" ? (
                      <button onClick={() => { navigate("/doctor-appointments"); setShowDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        Doctor Appointments
                      </button>
                    ) : user.role === "admin" ? (
                      <button onClick={() => { navigate("/admin-dashboard"); setShowDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        Open Admin Panel
                      </button>
                    ) : (
                      <>
                        <button onClick={() => { navigate("/myappoinment"); setShowDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          My Appointments
                        </button>
                        <button onClick={() => { navigate("/profile"); setShowDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          My Profile
                        </button>
                        <button onClick={() => { navigate("/health-records"); setShowDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          Health Records
                        </button>
                      </>
                    )}
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-md absolute w-full left-0 z-40">
          <div className="px-4 pt-2 pb-4 space-y-1 flex flex-col max-h-screen overflow-y-auto">
            <NavLink to="/" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `px-3 py-2 rounded-md text-base font-medium ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"}`}>Home</NavLink>
            <NavLink to="/hospitals" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `px-3 py-2 rounded-md text-base font-medium ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"}`}>Hospitals</NavLink>
            <NavLink to="/symptomchecker" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `px-3 py-2 rounded-md text-base font-medium ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"}`}>Symptom Checkers</NavLink>
            <NavLink to="/telemedicine" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `px-3 py-2 rounded-md text-base font-medium ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"}`}>Telemedicine</NavLink>
            <NavLink to="/charity" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `px-3 py-2 rounded-md text-base font-medium ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"}`}>Charity</NavLink>

            {!user && (
              <div className="pt-4 flex flex-col gap-3 px-3 border-t border-gray-100 mt-2">
                <button onClick={() => { navigate("/login"); setIsMobileMenuOpen(false); }} className="w-full text-center px-4 py-2 border border-gray-800 text-gray-800 rounded-full font-medium active:bg-gray-100">
                  Login
                </button>
                <button onClick={() => { navigate("/register"); setIsMobileMenuOpen(false); }} className="w-full text-center px-4 py-2 bg-blue-600 text-white rounded-full font-medium active:bg-blue-700">
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
