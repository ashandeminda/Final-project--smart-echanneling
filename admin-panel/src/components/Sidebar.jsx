import { Link, useLocation } from "react-router-dom";

const Sidebar = ({ isOpen, closeSidebar }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `flex items-center px-4 py-3 mb-1 rounded-xl transition-all duration-300 font-medium text-sm ${
      isActive(path)
        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
        : "text-gray-500 hover:bg-blue-50 hover:text-blue-600"
    }`;

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      closeSidebar();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-20 md:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}
      
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-gray-100 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-500/30">
                EC
             </div>
            <h5 className="text-lg font-bold text-gray-900 m-0 leading-tight">Smart<br/><span className="text-blue-600">E-Channelling</span></h5>
          </div>
          <button className="md:hidden text-gray-400 hover:text-gray-700 p-1 transition-colors" onClick={closeSidebar}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 flex-1 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 px-4">Main Menu</p>
          <nav className="space-y-0.5">
            <Link to="/" className={linkClass("/")} onClick={handleLinkClick}>
              <span className="mr-3 text-lg opacity-80">📊</span>
              Dashboard
            </Link>

            <Link to="/appointments" className={linkClass("/appointments")} onClick={handleLinkClick}>
              <span className="mr-3 text-lg opacity-80">📅</span>
              Appointments
            </Link>

            <Link to="/doctors" className={linkClass("/doctors")} onClick={handleLinkClick}>
              <span className="mr-3 text-lg opacity-80">👨‍⚕️</span>
              Doctors
            </Link>

            <Link to="/add-hospital" className={linkClass("/add-hospital")} onClick={handleLinkClick}>
              <span className="mr-3 text-lg opacity-80">🏥</span>
              Hospitals
            </Link>

            <Link to="/users" className={linkClass("/users")} onClick={handleLinkClick}>
              <span className="mr-3 text-lg opacity-80">👥</span>
              Users
            </Link>

            <Link to="/donations" className={linkClass("/donations")} onClick={handleLinkClick}>
              <span className="mr-3 text-lg opacity-80">❤️</span>
              Donations
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100">
          <Link to="/settings" className={linkClass("/settings")} onClick={handleLinkClick}>
            <span className="mr-3 text-lg opacity-80">⚙️</span>
            Settings
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
