import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import Layout from "../components/Layout";

const Home = () => {
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalUsers: 0,
    totalAppointments: 0,
    totalHospitals: 0,
    pendingAppointments: 0,
    totalRaised: 0,
    donationsCount: 0,
  });
  const [latestAppointments, setLatestAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError("");
        const res = await api.get("/user/admin/stats");
        setStats(res.data.stats);
        setLatestAppointments(res.data.latestAppointments || []);
      } catch (err) {
        const message =
          err.response?.data?.message || "Failed to load admin dashboard details.";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <Layout>
      <div className="w-full">
        <h4 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h4>

        {loading ? (
          <div className="flex items-center gap-3 text-gray-500 font-medium">
            <span className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin"></span>
            Loading stats...
          </div>
        ) : error ? (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-start gap-3">
            <span className="text-lg leading-none mt-0.5">⚠️</span>
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-3xl"></div>
                <h3 className="text-3xl font-extrabold text-gray-900 mb-1">{stats.totalDoctors}</h3>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Doctors</p>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-3xl"></div>
                <h3 className="text-3xl font-extrabold text-gray-900 mb-1">{stats.totalAppointments}</h3>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Appointments</p>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-l-3xl"></div>
                <h3 className="text-3xl font-extrabold text-gray-900 mb-1">{stats.totalUsers}</h3>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Patients</p>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 rounded-l-3xl"></div>
                <h3 className="text-3xl font-extrabold text-gray-900 mb-1">{stats.totalHospitals}</h3>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Hospitals</p>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 rounded-l-3xl"></div>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-1">LKR {Number(stats.totalRaised).toLocaleString()}</h3>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Charity Raised</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex items-center justify-between">
              <span className="text-gray-600 font-medium text-sm">Completed donations</span>
              <span className="bg-blue-50 text-blue-700 py-1 px-3 rounded-full font-bold text-sm">{stats.donationsCount}</span>
            </div>

            {stats.pendingAppointments > 0 && (
              <div className="mb-6 p-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-200 flex items-center gap-3">
                <span className="text-lg">⏳</span>
                <p className="text-sm font-medium">
                  You have <strong className="font-bold">{stats.pendingAppointments}</strong> pending appointment(s) awaiting approval.
                </p>
              </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h5 className="font-bold text-gray-800 m-0 text-sm">Latest Bookings</h5>
              </div>
              <div className="p-0">
                {latestAppointments.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 bg-gray-50/50">
                    <p className="mb-0 font-medium">No bookings yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {latestAppointments.map((a) => (
                      <div
                        key={a._id}
                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center px-6 py-4 hover:bg-gray-50 transition-colors gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <strong className="text-gray-900 text-sm">{a.doctorId?.name || "Doctor"}</strong>
                            <span className="text-gray-500 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                              {a.doctorId?.specialization || "General"}
                            </span>
                          </div>
                          <div className="text-gray-500 text-xs flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-700">{a.userId?.name || "N/A"}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span>{a.date} at {a.time}</span>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-auto ${a.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : a.status === "cancelled" || a.status === "rejected"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                            }`}
                        >
                          {a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Home;
