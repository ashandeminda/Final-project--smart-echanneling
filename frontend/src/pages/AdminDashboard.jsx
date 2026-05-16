import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";

const initialDoctorForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  specialization: "",
  experience: "",
  hospital: "",
  fee: "",
  availableDays: "",
};

const initialHospitalForm = {
  name: "",
  location: "",
  rating: "",
};

function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalUsers: 0,
    totalAppointments: 0,
    totalHospitals: 0,
    pendingAppointments: 0,
  });
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [doctorForm, setDoctorForm] = useState(initialDoctorForm);
  const [hospitalForm, setHospitalForm] = useState(initialHospitalForm);
  const [doctorImage, setDoctorImage] = useState(null);
  const [hospitalImage, setHospitalImage] = useState(null);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, appointmentsRes, doctorsRes, usersRes, hospitalsRes] =
        await Promise.all([
          api.get("/user/admin/stats"),
          api.get("/appointment/all"),
          api.get("/doctor/admin/all"),
          api.get("/user/admin/all-users"),
          api.get("/hospital/get-all"),
        ]);

      setStats(statsRes.data.stats || {});
      setAppointments(appointmentsRes.data.appointments || []);
      setDoctors(doctorsRes.data || []);
      setUsers(usersRes.data.users || []);
      setHospitals(hospitalsRes.data || []);
    } catch (error) {
      console.error("Failed to load admin dashboard:", error);
      alert(error.response?.data?.message || "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (user?.role !== "admin") {
      navigate("/");
      return;
    }

    loadAdminData();
  }, [isAuthenticated, navigate, user]);

  const handleDoctorApprove = async (id, isApproved) => {
    try {
      setBusy(true);
      await api.put(`/doctor/approve/${id}`, { isApproved });
      await loadAdminData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update doctor");
    } finally {
      setBusy(false);
    }
  };

  const handleDoctorDelete = async (id) => {
    if (!window.confirm("Delete this doctor?")) return;

    try {
      setBusy(true);
      await api.delete(`/doctor/delete/${id}`);
      await loadAdminData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete doctor");
    } finally {
      setBusy(false);
    }
  };

  const handleHospitalDelete = async (id) => {
    if (!window.confirm("Delete this hospital?")) return;

    try {
      setBusy(true);
      await api.delete(`/hospital/delete/${id}`);
      await loadAdminData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete hospital");
    } finally {
      setBusy(false);
    }
  };

  const submitDoctor = async (e) => {
    e.preventDefault();

    if (
      !doctorForm.name ||
      !doctorForm.email ||
      !doctorForm.phone ||
      !doctorForm.password ||
      !doctorForm.specialization ||
      !doctorForm.hospital ||
      !doctorForm.fee
    ) {
      alert("Fill doctor name, email, phone, password, specialization, hospital, and fee");
      return;
    }

    try {
      setBusy(true);
      const fd = new FormData();
      fd.append("name", doctorForm.name);
      fd.append("email", doctorForm.email);
      fd.append("phone", doctorForm.phone);
      fd.append("password", doctorForm.password);
      fd.append("specialization", doctorForm.specialization);
      fd.append("experience", doctorForm.experience);
      fd.append("hospital", doctorForm.hospital);
      fd.append("fee", doctorForm.fee);
      if (doctorForm.availableDays) {
        const days = doctorForm.availableDays.split(",").map((day) => day.trim()).filter(Boolean);
        fd.append("availableDays", JSON.stringify(days));
      }
      if (doctorImage) fd.append("image", doctorImage);

      await api.post("/doctor/create", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setDoctorForm(initialDoctorForm);
      setDoctorImage(null);
      await loadAdminData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add doctor");
    } finally {
      setBusy(false);
    }
  };

  const submitHospital = async (e) => {
    e.preventDefault();

    if (!hospitalForm.name || !hospitalForm.location) {
      alert("Fill hospital name and location");
      return;
    }

    try {
      setBusy(true);
      const fd = new FormData();
      fd.append("name", hospitalForm.name);
      fd.append("location", hospitalForm.location);
      fd.append("rating", hospitalForm.rating || 0);
      if (hospitalImage) fd.append("image", hospitalImage);

      await api.post("/hospital/add", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setHospitalForm(initialHospitalForm);
      setHospitalImage(null);
      await loadAdminData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add hospital");
    } finally {
      setBusy(false);
    }
  };

  const latestAppointments = appointments.slice(0, 5);

  const StatusBadge = ({ status }) => {
    let colorClass = "bg-slate-100 text-slate-700";
    if (status === "pending") colorClass = "bg-amber-100 text-amber-700";
    if (status === "approved" || status === "completed") colorClass = "bg-green-100 text-green-700";
    if (status === "rejected" || status === "cancelled") colorClass = "bg-red-100 text-red-700";
    if (status === "doctor") colorClass = "bg-blue-100 text-blue-700";
    if (status === "admin") colorClass = "bg-red-100 text-red-700";
    if (status === "user") colorClass = "bg-slate-200 text-slate-700";

    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize ${colorClass}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen p-6 md:p-10 bg-slate-50 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HERO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-8 bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50">
          <div>
            <p className="mb-2 text-blue-600 text-xs font-extrabold tracking-widest uppercase">System Management</p>
            <h1 className="mb-3 text-slate-900 text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
            <p className="m-0 max-w-2xl text-slate-500 leading-relaxed text-lg">
              Manage doctors, patients, appointments, hospitals, and overall system activity.
            </p>
          </div>
          <div className="min-w-[180px] p-5 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 shadow-sm">
            <span className="block mb-1 text-xs uppercase tracking-wider font-semibold opacity-80">Signed in as</span>
            <strong className="text-xl">{user?.name || "Admin"}</strong>
          </div>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-3">
          {["overview", "appointments", "doctors", "patients", "hospitals"].map((tab) => (
            <button
              key={tab}
              className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 capitalize ${activeTab === tab ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500 text-lg">Loading dashboard data...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: "Doctors", value: stats.totalDoctors, icon: "👨‍⚕️", color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Patients", value: stats.totalUsers, icon: "👥", color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Appointments", value: stats.totalAppointments, icon: "📅", color: "text-teal-600", bg: "bg-teal-50" },
                    { label: "Hospitals", value: stats.totalHospitals, icon: "🏥", color: "text-rose-600", bg: "bg-rose-50" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center text-2xl`}>
                          {stat.icon}
                        </div>
                      </div>
                      <p className="text-slate-500 font-medium mb-1">{stat.label}</p>
                      <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
                    </div>
                  ))}
                </div>

                {stats.pendingAppointments > 0 && (
                  <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 shadow-sm flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <p><strong>{stats.pendingAppointments}</strong> appointment(s) currently waiting for approval.</p>
                  </div>
                )}

                {/* Latest Appointments */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Latest Appointments</h2>
                  <div className="grid gap-4">
                    {latestAppointments.map((item) => (
                      <div key={item._id} className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                        <div>
                          <strong className="text-lg text-slate-800 block mb-1">{item.doctorId?.name || "Doctor"}</strong>
                          <p className="text-slate-500 text-sm">
                            Patient: <span className="font-medium text-slate-700">{item.userId?.name || "N/A"}</span> • {item.date} • {item.time}
                          </p>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                    ))}
                    {latestAppointments.length === 0 && (
                      <p className="text-slate-500 text-center py-4">No recent appointments found.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "appointments" && (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Appointments</h2>
                  <p className="text-slate-500">
                    Appointment approval is handled by the assigned doctor. Admin can monitor status changes here.
                  </p>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Reference</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Patient</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Doctor</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Date/Time</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Type</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {appointments.map((item) => (
                        <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">
                            {item.type === "Chat Consultation" ? "Instant chat" : item.appointmentNo || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{item.userId?.name || "N/A"}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{item.doctorId?.name || "N/A"}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{item.date} • {item.time}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{item.type || "In-Person"}</td>
                          <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "doctors" && (
              <div className="space-y-8">
                {/* Add Doctor Form */}
                <form className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm" onSubmit={submitDoctor}>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Add Doctor</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                    <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Doctor name" value={doctorForm.name} onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })} />
                    <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" type="email" placeholder="Doctor email" value={doctorForm.email} onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })} />
                    <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Phone" value={doctorForm.phone} onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })} />
                    <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" type="password" placeholder="Login password" value={doctorForm.password} onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })} />
                    <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Specialization" value={doctorForm.specialization} onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })} />
                    <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Experience" value={doctorForm.experience} onChange={(e) => setDoctorForm({ ...doctorForm, experience: e.target.value })} />
                    <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-700" value={doctorForm.hospital} onChange={(e) => setDoctorForm({ ...doctorForm, hospital: e.target.value })}>
                      <option value="">Select hospital</option>
                      {hospitals.map((hospital) => (
                        <option key={hospital._id} value={hospital.name}>{hospital.name}</option>
                      ))}
                    </select>
                    <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" type="number" placeholder="Fee (LKR)" value={doctorForm.fee} onChange={(e) => setDoctorForm({ ...doctorForm, fee: e.target.value })} />
                    <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Available days (comma separated)" value={doctorForm.availableDays} onChange={(e) => setDoctorForm({ ...doctorForm, availableDays: e.target.value })} />
                    <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" type="file" accept="image/*" onChange={(e) => setDoctorImage(e.target.files[0])} />
                  </div>
                  <button className="px-8 py-3 bg-slate-900 border border-transparent rounded-xl text-white font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors disabled:opacity-50" disabled={busy}>
                    {busy ? "Saving..." : "Add Doctor"}
                  </button>
                </form>

                {/* Manage Doctors */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Manage Doctors</h2>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Name</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Specialization</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Hospital</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Fee</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Status</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {doctors.map((item) => (
                          <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.name}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{item.specialization}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{item.hospital}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">LKR {item.fee}</td>
                            <td className="px-6 py-4">
                              <StatusBadge status={item.isApproved ? "approved" : "pending"} />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${item.isApproved ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                  onClick={() => handleDoctorApprove(item._id, !item.isApproved)}
                                  disabled={busy}
                                >
                                  {item.isApproved ? "Revoke" : "Approve"}
                                </button>
                                <button
                                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                  onClick={() => handleDoctorDelete(item._id)}
                                  disabled={busy}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "patients" && (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Patients and Users</h2>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Name</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Email</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Phone</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Role</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {users.map((item) => (
                        <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{item.email}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{item.phone}</td>
                          <td className="px-6 py-4"><StatusBadge status={item.role} /></td>
                          <td className="px-6 py-4 text-sm text-slate-600">{new Date(item.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "hospitals" && (
              <div className="space-y-8">
                {/* Add Hospital Form */}
                <form className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm" onSubmit={submitHospital}>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Add Hospital</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Hospital name" value={hospitalForm.name} onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })} />
                    <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Location" value={hospitalForm.location} onChange={(e) => setHospitalForm({ ...hospitalForm, location: e.target.value })} />
                    <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" type="number" step="0.1" placeholder="Rating" value={hospitalForm.rating} onChange={(e) => setHospitalForm({ ...hospitalForm, rating: e.target.value })} />
                    <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" type="file" accept="image/*" onChange={(e) => setHospitalImage(e.target.files[0])} />
                  </div>
                  <button className="px-8 py-3 bg-slate-900 border border-transparent rounded-xl text-white font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors disabled:opacity-50" disabled={busy}>
                    {busy ? "Saving..." : "Add Hospital"}
                  </button>
                </form>

                {/* Manage Hospitals */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Manage Hospitals</h2>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Name</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Location</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Rating</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {hospitals.map((item) => (
                          <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.name}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{item.location}</td>
                            <td className="px-6 py-4 text-sm text-slate-600"><span className="text-amber-500 mr-1">★</span>{item.rating || "N/A"}</td>
                            <td className="px-6 py-4">
                              <button
                                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                onClick={() => handleHospitalDelete(item._id)}
                                disabled={busy}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
