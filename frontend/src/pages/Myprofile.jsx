import React, { useEffect, useState } from "react";
import DefaultProfile from "../assets/doctor.jpg";
import { useAuth } from "../context/useAuth";
import userService from "../api/userService";
import appointmentService from "../api/appointmentService";

function MyProfile() {
  const { user, updateUser, isAuthenticated } = useAuth();
  const [editUser, setEditUser] = useState({});
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });

  useEffect(() => {
    if (!user) return;

    setEditUser(user);
    setSelectedImage(null);
    setImagePreview(
      user.profilePic ? `http://localhost:8080/uploads/${user.profilePic}` : ""
    );
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isAuthenticated) return;

      try {
        const data = await appointmentService.getMyAppointments();
        const appointments = data.appointments || [];

        setStats({
          total: appointments.length,
          pending: appointments.filter((a) => a.status === "pending").length,
          approved: appointments.filter((a) => a.status === "approved").length,
        });
      } catch (err) {
        console.error("Failed to fetch appointment stats:", err);
      }
    };

    fetchStats();
  }, [isAuthenticated]);

  const handleChange = (e) => {
    setEditUser((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    setSelectedImage(file || null);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  };

  const handleCancel = () => {
    setEdit(false);
    setSelectedImage(null);
    setEditUser(user || {});
    setImagePreview(
      user?.profilePic ? `http://localhost:8080/uploads/${user.profilePic}` : ""
    );
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const formData = new FormData();

      if (editUser.name) formData.append("name", editUser.name);
      if (editUser.email) formData.append("email", editUser.email);
      if (editUser.phone) formData.append("phone", editUser.phone);
      if (selectedImage) formData.append("image", selectedImage);

      const data = await userService.updateProfile(formData);
      updateUser(data.user);
      setEdit(false);
      setSelectedImage(null);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const profileImageSrc =
    imagePreview ||
    (user?.profilePic
      ? `http://localhost:8080/uploads/${user.profilePic}`
      : DefaultProfile);

  return (
    <div className="min-h-screen p-6 md:p-10 bg-slate-50 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Top Header Section */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div className="max-w-xl">
            <p className="mb-2 text-teal-700 text-xs font-extrabold tracking-widest uppercase">Account Center</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">My Profile</h1>
            <p className="text-slate-500 leading-relaxed text-sm sm:text-base">
              Update your personal details, keep your profile photo current, and
              review your appointment activity from one place.
            </p>
          </div>

          {!edit ? (
            <button 
              className="w-full md:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-full shadow-md hover:-translate-y-0.5 transition-all duration-200" 
              onClick={() => setEdit(true)}
            >
              Edit profile
            </button>
          ) : (
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
              <button 
                className="w-full sm:w-auto px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-full transition-colors" 
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button 
                className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-full shadow-md transition-colors disabled:opacity-70" 
                onClick={handleSave} 
                disabled={loading}
              >
                {loading ? "Saving..." : "Save changes"}
              </button>
            </div>
          )}
        </section>

        {/* Profile Details Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 mb-8">
          
          {/* Sidebar */}
          <aside className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-fit">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="relative">
                <img
                  src={profileImageSrc}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  onError={(e) => { e.currentTarget.src = DefaultProfile; }}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">{user?.name || "User"}</h2>
                <p className="text-slate-500 text-sm">{user?.email || "No email available"}</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full uppercase tracking-wide">
                {user?.profilePic ? "Custom photo" : "Default photo"}
              </span>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</span>
                <strong className="text-slate-900 text-sm">{user?.phone || "Not added"}</strong>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Session</span>
                <strong className="text-slate-900 text-sm">{isAuthenticated ? "Active" : "Guest"}</strong>
              </div>
            </div>

            {edit && (
              <div className="mt-2 bg-slate-50 border border-dashed border-slate-300 p-4 rounded-2xl flex flex-col gap-3 items-center text-center">
                <label htmlFor="profile-image" className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-full cursor-pointer transition-colors shadow-sm">
                  {selectedImage ? "Photo selected" : "Choose profile photo"}
                </label>
                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <p className="text-xs text-slate-500 leading-relaxed px-2">
                  Square images work best. Max size 2MB.
                </p>
              </div>
            )}
          </aside>

          {/* Main Info Area */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-fit">
            <div className="mb-6 border-b border-slate-100 pb-4">
              <p className="text-sky-600 text-xs font-extrabold tracking-widest uppercase mb-1">Personal Information</p>
              <h3 className="text-2xl font-bold text-slate-900">Basic details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full name</label>
                {edit ? (
                  <input 
                    name="name" 
                    value={editUser.name || ""} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white text-slate-900"
                  />
                ) : (
                  <p className="text-slate-900 font-semibold text-lg">{user?.name}</p>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email address</label>
                {edit ? (
                  <input 
                    name="email" 
                    value={editUser.email || ""} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white text-slate-900"
                  />
                ) : (
                  <p className="text-slate-900 font-semibold text-lg">{user?.email}</p>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone number</label>
                {edit ? (
                  <input 
                    name="phone" 
                    value={editUser.phone || ""} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white text-slate-900 m-0"
                  />
                ) : (
                  <p className="text-slate-900 font-semibold text-lg">{user?.phone || "Not added"}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <span className="block text-sky-600 text-xs font-extrabold tracking-widest uppercase mb-3 relative z-10">All bookings</span>
            <h3 className="text-4xl font-extrabold text-slate-900 mb-1 relative z-10">{stats.total}</h3>
            <p className="text-slate-500 text-sm relative z-10">Total Appointments</p>
          </div>

          <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <span className="block text-amber-600 text-xs font-extrabold tracking-widest uppercase mb-3 relative z-10">Awaiting review</span>
            <h3 className="text-4xl font-extrabold text-slate-900 mb-1 relative z-10">{stats.pending}</h3>
            <p className="text-slate-500 text-sm relative z-10">Pending Appointments</p>
          </div>

          <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <span className="block text-teal-600 text-xs font-extrabold tracking-widest uppercase mb-3 relative z-10">Confirmed</span>
            <h3 className="text-4xl font-extrabold text-slate-900 mb-1 relative z-10">{stats.approved}</h3>
            <p className="text-slate-500 text-sm relative z-10">Approved Appointments</p>
          </div>
        </section>

      </div>
    </div>
  );
}

export default MyProfile;
