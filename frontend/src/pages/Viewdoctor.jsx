import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import doctorImg from "../assets/doctor.jpg";
import doctorService from "../api/doctorService";

function Doctors() {
  const navigate = useNavigate();
  const location = useLocation();
  const hospitalFilter = location.state?.hospital || "";

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const data = await doctorService.getAllDoctors();
        setDoctors(data);
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
        setError("Failed to load doctors. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const specialtyOptions = useMemo(() => {
    const specialties = doctors
      .map((doc) => String(doc.specialization || "").trim())
      .filter(Boolean);

    return ["All", ...new Set(specialties)];
  }, [doctors]);

  const filteredDoctors = doctors.filter((doc) => {
    const matchesHospital = hospitalFilter
      ? String(doc.hospital || "").toLowerCase().includes(hospitalFilter.toLowerCase())
      : true;

    const matchesSearch = search
      ? String(doc.name || "").toLowerCase().includes(search.toLowerCase()) ||
        String(doc.specialization || "").toLowerCase().includes(search.toLowerCase())
      : true;

    const matchesSpecialty =
      selectedSpecialty === "All" ||
      String(doc.specialization || "").trim().toLowerCase() === selectedSpecialty.toLowerCase();

    return matchesHospital && matchesSearch && matchesSpecialty;
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  return (
    <div className="min-h-screen p-6 md:p-10 lg:px-20 bg-slate-50 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HERO SECTION */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex-1 max-w-2xl text-center lg:text-left">
            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 font-bold text-[10px] uppercase tracking-widest rounded-full mb-4 border border-indigo-100">
              Find Your Specialist
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 leading-tight">
              {hospitalFilter
                ? `Doctors at ${hospitalFilter}`
                : `${filteredDoctors.length} Doctors Available`}
            </h2>
            <p className="text-slate-500 font-medium text-lg">Select your preferred specialist and book an appointment instantly.</p>
          </div>
          
          <div className="flex gap-4 flex-wrap justify-center lg:justify-end shrink-0">
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl min-w-[140px] text-center shadow-sm">
              <strong className="block text-2xl font-extrabold text-slate-900 mb-1">{filteredDoctors.length}</strong>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Specialists</span>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl min-w-[160px] max-w-[200px] text-center shadow-sm flex flex-col justify-center">
              <strong className="block text-base font-bold text-indigo-900 mb-1 truncate px-2" title={hospitalFilter || "All Hospitals"}>{hospitalFilter || "All Hospitals"}</strong>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Showing</span>
            </div>
          </div>
        </div>

        {/* SEARCH BAR */}
        <form className="flex w-full gap-3 relative" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search doctor name or specialty..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 py-4 pl-6 pr-4 rounded-2xl border-2 border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-lg text-slate-900 shadow-sm"
          />
          <button type="submit" className="shrink-0 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-md transition-colors text-sm uppercase tracking-wide">
            Search
          </button>
        </form>

        <div className="max-w-md">
          <div className="relative">
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full appearance-none rounded-[1.5rem] border-2 border-slate-200 bg-white px-6 py-4 pr-14 text-lg font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            >
              <option value="All">Select Specialization</option>
              {specialtyOptions
                .filter((specialty) => specialty !== "All")
                .map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-2xl text-slate-500">
              ˅
            </span>
          </div>
        </div>

        {/* CONTENT */}
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

          <div className="flex flex-col gap-6">
            {!loading && !error && filteredDoctors.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-16 text-center shadow-sm">
                <div className="w-24 h-24 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 border border-slate-100">👨‍⚕️</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No doctors found</h3>
                <p className="text-slate-500 font-medium">We couldn't find any specialist matching your search.</p>
              </div>
            )}

            {!loading && !error && filteredDoctors.map((doc) => (
              <div key={doc._id} className="bg-white border border-slate-200 rounded-[1.5rem] p-5 md:p-6 shadow-[0_4px_15px_rgb(0,0,0,0.03)] hover:shadow-[0_15px_30px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col md:flex-row gap-6 md:items-center relative">
                
                {/* Image */}
                <div className="w-full md:w-48 h-56 md:h-auto md:aspect-[4/5] bg-slate-100 rounded-[1rem] overflow-hidden shrink-0 border border-slate-100">
                  <img
                    src={doc.image ? `http://localhost:8080/uploads/${doc.image}` : doctorImg}
                    alt="doctor"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col py-2">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-1 leading-tight">{doc.name || "Doctor"}</h3>
                      <span className="text-teal-600 font-bold capitalize text-sm">{doc.specialization || "Specialist"}</span>
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold text-sm shadow-sm shrink-0 flex items-center gap-1.5">
                      <span className="text-amber-500 text-lg leading-none">★</span> {doc.rating || "N/A"}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 mb-6">
                    <div className="flex items-center gap-2.5 text-slate-600">
                      <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-[10px] border border-blue-100 shrink-0">📍</div>
                      <span className="font-medium text-[15px]">{doc.hospital || "Not specified"}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-600">
                      <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px] border border-indigo-100 shrink-0">⏳</div>
                      <span className="font-medium text-[15px]">{doc.experience || "Not specified"} experience</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-600 sm:col-span-2">
                      <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-[10px] border border-emerald-100 shrink-0">💸</div>
                      <span className="font-medium text-[15px]">Consultation Fee: <strong className="text-slate-900">LKR {doc.fee ? Number(doc.fee).toLocaleString() : "N/A"}</strong></span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <button
                      onClick={() =>
                        navigate("/booking", {
                          state: {
                            doctorId: doc._id,
                            doctor: doc.name,
                            specialty: doc.specialization,
                            hospital: doc.hospital,
                            fee: doc.fee,
                            image: doc.image,
                            rating: doc.rating,
                            experience: doc.experience,
                            patientsCount: doc.patientsCount || 0
                          },
                        })
                      }
                      className="w-full md:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold tracking-wide rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                      View Details & Book
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

export default Doctors;
