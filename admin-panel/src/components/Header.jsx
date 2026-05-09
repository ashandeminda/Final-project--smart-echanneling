const Header = ({ toggleSidebar }) => {
  return (
    <header className="flex justify-between items-center bg-white px-4 md:px-6 py-4 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar}
          className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-blue-100 hidden sm:inline-block">
          Admin Portal
        </span>
      </div>

      <button
        className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 md:px-6 rounded-full shadow-sm hover:shadow-md transition-all duration-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 active:scale-95"
        onClick={() => {
          localStorage.removeItem("adminToken");
          window.location.reload();
        }}
      >
        Log out
      </button>
    </header>
  );
};

export default Header;