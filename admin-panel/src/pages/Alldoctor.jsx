import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import toast from "react-hot-toast";

const AllDoctors = () => {
  // Form state for adding a new doctor
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    specialization: "",
    experience: "",
    hospital: "",
    fee: "",
    availableDays: "",
    videoConsultationEnabled: false,
    chatConsultationEnabled: false,
  });
  const [image, setImage] = useState(null);
  const [addLoading, setAddLoading] = useState(false);

  // Doctor list from backend
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hospital list for dropdown
  const [hospitals, setHospitals] = useState([]);

  // Fetch all doctors (admin endpoint — includes unapproved)
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.get("/doctor/admin/all");
      setDoctors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch hospitals for the dropdown selector
  const fetchHospitals = async () => {
    try {
      const res = await api.get("/hospital/get-all");
      setHospitals(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchHospitals();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Add doctor — POST /doctor/create (multipart for image)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.password ||
      !formData.specialization ||
      !formData.hospital ||
      !formData.fee
    ) {
      return toast.error("Please fill in all required fields");
    }

    try {
      setAddLoading(true);
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("email", formData.email);
      fd.append("phone", formData.phone);
      fd.append("password", formData.password);
      fd.append("specialization", formData.specialization);
      fd.append("experience", formData.experience);
      fd.append("hospital", formData.hospital);
      fd.append("fee", formData.fee);
      if (formData.availableDays) {
        // Parse and format days: "Mon, TUESDAY , wed" -> ["Monday", "Tuesday", "Wednesday"]
        const dayMap = {
          Mon: "Monday",
          Tue: "Tuesday",
          Wed: "Wednesday",
          Thu: "Thursday",
          Fri: "Friday",
          Sat: "Saturday",
          Sun: "Sunday",
        };

        const parsedDays = formData.availableDays
          .split(",")
          .map((d) => {
            const trimmed = d.trim();
            const titleCased = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
            return dayMap[titleCased] || titleCased;
          })
          .filter(Boolean);

        fd.append("availableDays", JSON.stringify(parsedDays));
      }
      fd.append("videoConsultationEnabled", formData.videoConsultationEnabled);
      fd.append("chatConsultationEnabled", formData.chatConsultationEnabled);
      if (image) fd.append("image", image);

      await api.post("/doctor/create", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Doctor Added Successfully");
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        specialization: "",
        experience: "",
        hospital: "",
        fee: "",
        availableDays: "",
        videoConsultationEnabled: false,
        chatConsultationEnabled: false,
      });
      setImage(null);
      // Reset file input
      const fileInput = document.getElementById("doc-image-upload");
      if (fileInput) fileInput.value = "";
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error adding doctor");
    } finally {
      setAddLoading(false);
    }
  };

  // Approve or reject doctor — PUT /doctor/approve/:id
  const handleApprove = async (id, isApproved) => {
    try {
      await api.put(`/doctor/approve/${id}`, { isApproved });
      toast.success(isApproved ? "Doctor Approved" : "Doctor Rejected");
      fetchDoctors();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  // Delete doctor — DELETE /doctor/delete/:id
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this doctor?")) return;
    try {
      await api.delete(`/doctor/delete/${id}`);
      toast.success("Doctor Deleted");
      fetchDoctors();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  return (
    <Layout>
      <div className="w-full">
        {/* Add Doctor Form */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8 max-w-5xl">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <h5 className="text-xl font-bold text-gray-900 m-0">👨‍⚕️ Add Doctor</h5>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Doctor Name *</label>
                <input
                  type="text"
                  name="name"
                  className="w-full bg-white border border-gray-300 rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-gray-900 placeholder:text-gray-400"
                  placeholder="Dr. John Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  className="w-full bg-white border border-gray-300 rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-gray-900 placeholder:text-gray-400"
                  placeholder="doctor@hospital.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="text"
                  name="phone"
                  className="w-full bg-white border border-gray-300 rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-gray-900 placeholder:text-gray-400"
                  placeholder="+94 77 123 4567"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  name="password"
                  className="w-full bg-white border border-gray-300 rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-gray-900 placeholder:text-gray-400"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Specialization *</label>
                <input
                  type="text"
                  name="specialization"
                  className="w-full bg-white border border-gray-300 rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-gray-900 placeholder:text-gray-400"
                  placeholder="Cardiologist"
                  value={formData.specialization}
                  onChange={handleChange}
                />
              </div>
              <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">Experience</label>
                <input
                  type="text"
                  name="experience"
                  className="w-full bg-white border border-gray-300 rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g. 10 Years"
                  value={formData.experience}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hospital *</label>
                <select
                  name="hospital"
                  className="w-full bg-white border border-gray-300 rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-gray-900 placeholder:text-gray-400 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-no-repeat bg-[position:right_1rem_center]"
                  value={formData.hospital}
                  onChange={handleChange}
                >
                  <option value="">Select Hospital *</option>
                  {hospitals.map((h) => (
                    <option key={h._id} value={h.name}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fee (LKR) *</label>
                <input
                  type="number"
                  name="fee"
                  className="w-full bg-white border border-gray-300 rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-gray-900 placeholder:text-gray-400"
                  placeholder="3500"
                  value={formData.fee}
                  onChange={handleChange}
                />
              </div>
              <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">Available Days (Comma Separated)</label>
                <input
                  type="text"
                  name="availableDays"
                  className="w-full bg-white border border-gray-300 rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-gray-900 placeholder:text-gray-400"
                  placeholder="Monday, Tuesday, Wednesday"
                  value={formData.availableDays}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Telemedicine Capabilities */}
            <div className="pt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Telemedicine Capabilities</label>
              <div className="flex flex-col sm:flex-row gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <input
                      type="checkbox"
                      name="videoConsultationEnabled"
                      className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                      checked={formData.videoConsultationEnabled}
                      onChange={handleChange}
                    />
                    <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" viewBox="0 0 14 10" fill="none">
                      <title>Check</title>
                      <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">Video Consultation</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <input
                      type="checkbox"
                      name="chatConsultationEnabled"
                      className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                      checked={formData.chatConsultationEnabled}
                      onChange={handleChange}
                    />
                    <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" viewBox="0 0 14 10" fill="none">
                      <title>Check</title>
                      <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">Chat Consultation</span>
                </label>
              </div>
            </div>

            <div className="pt-2">
                 <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Image</label>
                <input
                  type="file"
                  id="doc-image-upload"
                  className="w-full bg-white border border-gray-300 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-gray-600 file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer file:transition-colors cursor-pointer"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                />
            </div>

            <div className="pt-4 flex justify-end">
               <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1 md:flex-none py-3.5 px-10 rounded-full shadow-md shadow-blue-600/20 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                disabled={addLoading}
              >
                {addLoading ? "Adding Doctor..." : "Add Doctor"}
              </button>
            </div>
          </form>
        </div>

        {/* Doctor List Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h5 className="font-bold text-gray-800 m-0 text-sm">All Doctors <span className="text-gray-500 font-normal">({doctors.length})</span></h5>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center flex items-center justify-center gap-3 text-gray-500 font-medium bg-gray-50/50">
                 <span className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin"></span>
                 Loading doctors...
              </div>
            ) : (
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Specialization</th>
                    <th className="px-6 py-4">Hospital</th>
                    <th className="px-6 py-4">Fee</th>
                    <th className="px-6 py-4">Patients</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {doctors.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500 font-medium bg-gray-50/50">
                        No doctors found
                      </td>
                    </tr>
                  ) : (
                    doctors.map((doc, i) => (
                      <tr key={doc._id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-6 py-4 text-gray-400 font-medium">{i + 1}</td>
                        <td className="px-6 py-4 font-bold text-gray-800">{doc.name}</td>
                        <td className="px-6 py-4 text-gray-600">
                           <span className="bg-blue-50 px-2.5 py-1 rounded-full text-xs font-bold text-blue-600">{doc.specialization}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{doc.hospital}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">LKR {doc.fee?.toLocaleString()}</td>
                        <td className="px-6 py-4 font-semibold text-blue-600">{doc.patientsCount || 0}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              doc.isApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {doc.isApproved ? "Approved" : "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right gap-2 flex justify-end">
                          {!doc.isApproved && (
                            <button
                              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all duration-300 hover:-translate-y-0.5"
                              onClick={() => handleApprove(doc._id, true)}
                            >
                              Approve
                            </button>
                          )}
                          {doc.isApproved && (
                            <button
                              className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-xs font-bold border border-amber-200 transition-all duration-300"
                              onClick={() => handleApprove(doc._id, false)}
                            >
                              Revoke
                            </button>
                          )}
                          <button
                            className="bg-white border border-gray-200 text-rose-600 hover:bg-rose-50 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ml-2 shadow-sm hover:border-rose-200"
                            onClick={() => handleDelete(doc._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AllDoctors;
