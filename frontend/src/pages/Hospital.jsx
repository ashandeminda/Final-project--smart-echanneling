import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import image from "../assets/hospitals.jpg";
import hospitalService from "../api/hospitalService";

function Hospitals() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoading(true);
        const data = await hospitalService.getAllHospitals();
        setHospitals(data);
      } catch (err) {
        console.error("Failed to fetch hospitals:", err);
        setError("Failed to load hospitals. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const filteredHospitals = hospitals.filter((hospital) =>
    hospital.name.toLowerCase().includes(search.toLowerCase()) ||
    hospital.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6 md:p-10 lg:px-20 bg-slate-50 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HERO SECTION */}
        <div className="bg-gradient-to-r from-slate-800 via-indigo-900 to-slate-900 text-white p-10 md:p-16 text-center rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <span className="inline-block px-4 py-1.5 bg-white/10 text-blue-200 font-bold rounded-full text-xs uppercase tracking-widest mb-4 border border-white/20 backdrop-blur-md">Network</span>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">Find hospitals near you</h1>
            <p className="text-slate-300 text-lg sm:text-xl font-medium mb-8">Browse our network of trusted healthcare facilities</p>

            <form className="w-full flex justify-center gap-3 relative max-w-xl" onSubmit={handleSearchSubmit}>
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search hospital or location..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full py-4 pl-6 pr-4 rounded-full border-2 border-white/20 bg-white/10 text-white placeholder-slate-300 backdrop-blur-md focus:outline-none focus:border-blue-400 focus:bg-white/20 transition-all font-medium text-lg"
                />
              </div>
              <button type="submit" className="shrink-0 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-lg transition-colors absolute right-1.5 top-1.5 bottom-1.5 text-sm uppercase tracking-wide">
                Search
              </button>
            </form>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div>
          {loading && (
            <div className="flex justify-center p-12">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-8 rounded-3xl text-center max-w-2xl mx-auto font-medium">
              <span className="text-4xl block mb-3">⚠️</span>
              {error}
            </div>
          )}

          {!loading && !error && filteredHospitals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {filteredHospitals.map((h) => (
                <div key={h._id} className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 group flex flex-col h-full relative overflow-hidden">
                  
                  {/* Rating Badge */}
                  <div className="absolute top-8 right-8 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-bold border border-slate-200 shadow-sm flex items-center gap-1 z-10 text-amber-600">
                    ★ {h.rating || "N/A"}
                  </div>
                  
                  <div className="w-full h-48 md:h-56 rounded-2xl overflow-hidden mb-5 bg-slate-100 flex-shrink-0 relative">
                    <img
                      src={h.image ? `http://localhost:8080/uploads/${h.image}` : image}
                      alt="hospital"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <p className="text-indigo-600 text-[10px] font-extrabold tracking-widest uppercase mb-1">Facility</p>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">{h.name}</h3>
                    
                    <div className="flex items-start gap-2 mt-auto mb-6 text-slate-500 text-sm">
                      <span className="shrink-0 mt-0.5">📍</span>
                      <p className="font-medium leading-relaxed">{h.location}</p>
                    </div>

                    <button
                      onClick={() => navigate("/doctors", { state: { hospital: h.name } })}
                      className="w-full mt-auto py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                      View Doctors
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !loading && !error && (
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-16 text-center max-w-2xl mx-auto shadow-sm">
                <div className="w-24 h-24 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 border border-slate-100">🏥</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No hospitals found</h3>
                <p className="text-slate-500 font-medium">We couldn't find any hospitals matching "{search}". Try searching for another location.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default Hospitals;
