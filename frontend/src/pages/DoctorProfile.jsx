import React, { useEffect, useMemo, useState } from "react";
import doctorImg from "../assets/doctor.jpg";
import appointmentService from "../api/appointmentService";
import doctorService from "../api/doctorService";
import { useAuth } from "../context/useAuth";

function DoctorProfile() {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [form, setForm] = useState({});
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, chat: 0, video: 0 });

  useEffect(() => {
    const loadDoctorProfile = async () => {
      try {
        setLoading(true);
        const [profileData, appointmentsData] = await Promise.all([
          doctorService.getMyDoctorProfile(),
          appointmentService.getDoctorAppointments(),
        ]);

        const doctorProfile = profileData.doctor;
        const appointments = appointmentsData.appointments || [];

        setDoctor(doctorProfile);
        setForm({
          name: doctorProfile?.name || "",
          email: doctorProfile?.userId?.email || "",
          phone: doctorProfile?.userId?.phone || "",
          specialization: doctorProfile?.specialization || "",
          experience: doctorProfile?.experience || "",
          hospital: doctorProfile?.hospital || "",
          fee: doctorProfile?.fee || "",
          videoConsultationEnabled: Boolean(doctorProfile?.videoConsultationEnabled),
          chatConsultationEnabled: Boolean(doctorProfile?.chatConsultationEnabled),
        });
        setImagePreview(
          doctorProfile?.image ? `http://localhost:8080/uploads/${doctorProfile.image}` : ""
        );
        setStats({
          total: appointments.length,
          pending: appointments.filter((item) => item.status === "pending").length,
          approved: appointments.filter((item) => item.status === "approved").length,
          chat: appointments.filter((item) => item.type === "Chat Consultation").length,
          video: appointments.filter((item) => item.type === "Video Consultation").length,
        });
      } catch (error) {
        alert(error.response?.data?.message || "Failed to load doctor profile");
      } finally {
        setLoading(false);
      }
    };

    loadDoctorProfile();
  }, []);

  const profileImage = useMemo(() => {
    if (imagePreview) return imagePreview;
    if (doctor?.image) return `http://localhost:8080/uploads/${doctor.image}`;
    return doctorImg;
  }, [doctor?.image, imagePreview]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    setSelectedImage(file || null);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  };

  const handleCancel = () => {
    setEdit(false);
    setSelectedImage(null);
    setForm({
      name: doctor?.name || "",
      email: doctor?.userId?.email || "",
      phone: doctor?.userId?.phone || "",
      specialization: doctor?.specialization || "",
      experience: doctor?.experience || "",
      hospital: doctor?.hospital || "",
      fee: doctor?.fee || "",
      videoConsultationEnabled: Boolean(doctor?.videoConsultationEnabled),
      chatConsultationEnabled: Boolean(doctor?.chatConsultationEnabled),
    });
    setImagePreview(doctor?.image ? `http://localhost:8080/uploads/${doctor.image}` : "");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("name", form.name || "");
      formData.append("email", form.email || "");
      formData.append("phone", form.phone || "");
      formData.append("specialization", form.specialization || "");
      formData.append("experience", form.experience || "");
      formData.append("hospital", form.hospital || "");
      formData.append("fee", form.fee || "");
      formData.append("videoConsultationEnabled", String(form.videoConsultationEnabled));
      formData.append("chatConsultationEnabled", String(form.chatConsultationEnabled));
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const response = await doctorService.updateMyDoctorProfile(formData);
      setDoctor(response.doctor);
      setEdit(false);
      setSelectedImage(null);
      setImagePreview(response.doctor?.image ? `http://localhost:8080/uploads/${response.doctor.image}` : "");
      alert("Doctor profile updated successfully");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update doctor profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 md:p-10 bg-slate-50 font-sans flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10 bg-slate-50 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="max-w-2xl">
            <p className="mb-2 text-blue-600 text-xs font-extrabold tracking-widest uppercase">Doctor Account</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">My Profile</h1>
            <p className="text-slate-500 leading-relaxed text-sm sm:text-base">
              Manage your doctor information, telemedicine availability, and personal contact details from one page.
            </p>
          </div>

          {!edit ? (
            <button
              className="w-full md:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-full shadow-md transition-all"
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
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-md transition-colors disabled:opacity-70"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <aside className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-sm h-fit">
            <div className="flex flex-col items-center text-center gap-4">
              <img
                src={profileImage}
                alt="Doctor"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                onError={(e) => {
                  e.currentTarget.src = doctorImg;
                }}
              />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">{doctor?.name || user?.name || "Doctor"}</h2>
                <p className="text-slate-500 text-sm">{doctor?.specialization || "Specialist"}</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wide border border-emerald-100">
                {doctor?.isApproved ? "Approved profile" : "Pending approval"}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hospital</span>
                <strong className="text-slate-900 text-sm">{doctor?.hospital || "Not added"}</strong>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fee</span>
                <strong className="text-slate-900 text-sm">LKR {Number(doctor?.fee || 0).toLocaleString()}</strong>
              </div>
            </div>

            {edit && (
              <div className="bg-slate-50 border border-dashed border-slate-300 p-4 rounded-2xl flex flex-col gap-3 items-center text-center">
                <label htmlFor="doctor-profile-image" className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-full cursor-pointer transition-colors shadow-sm">
                  {selectedImage ? "Photo selected" : "Choose profile photo"}
                </label>
                <input
                  id="doctor-profile-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <p className="text-xs text-slate-500 leading-relaxed">Upload a clear professional profile photo.</p>
              </div>
            )}
          </aside>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="mb-6 border-b border-slate-100 pb-4">
              <p className="text-blue-600 text-xs font-extrabold tracking-widest uppercase mb-1">Profile Details</p>
              <h3 className="text-2xl font-bold text-slate-900">Professional information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { label: "Full name", name: "name" },
                { label: "Email address", name: "email" },
                { label: "Phone number", name: "phone" },
                { label: "Specialization", name: "specialization" },
                { label: "Experience", name: "experience" },
                { label: "Hospital", name: "hospital" },
                { label: "Consultation fee", name: "fee", type: "number" },
              ].map((field) => (
                <div key={field.name} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {field.label}
                  </label>
                  {edit ? (
                    <input
                      name={field.name}
                      type={field.type || "text"}
                      value={form[field.name] || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                    />
                  ) : (
                    <p className="text-slate-900 font-semibold text-lg">
                      {field.name === "fee"
                        ? `LKR ${Number(form[field.name] || 0).toLocaleString()}`
                        : form[field.name] || "Not added"}
                    </p>
                  )}
                </div>
              ))}

              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Telemedicine availability
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: "videoConsultationEnabled", label: "Video Consultation" },
                    { name: "chatConsultationEnabled", label: "Chat Consultation" },
                  ].map((option) => (
                    <label
                      key={option.name}
                      className={`flex items-center justify-between p-4 border rounded-2xl ${
                        form[option.name] ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"
                      }`}
                    >
                      <span className="font-semibold text-slate-900">{option.label}</span>
                      {edit ? (
                        <input
                          type="checkbox"
                          name={option.name}
                          checked={Boolean(form[option.name])}
                          onChange={handleChange}
                          className="w-5 h-5 accent-emerald-600"
                        />
                      ) : (
                        <span className={`text-sm font-bold ${form[option.name] ? "text-emerald-700" : "text-slate-500"}`}>
                          {form[option.name] ? "Enabled" : "Disabled"}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
          {[
            { label: "Total Appointments", value: stats.total, tone: "text-slate-900" },
            { label: "Pending Requests", value: stats.pending, tone: "text-amber-600" },
            { label: "Approved Sessions", value: stats.approved, tone: "text-emerald-600" },
            { label: "Chat Consultations", value: stats.chat, tone: "text-blue-600" },
            { label: "Video Consultations", value: stats.video, tone: "text-indigo-600" },
          ].map((item) => (
            <div key={item.label} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
              <span className="block text-slate-500 text-xs font-extrabold tracking-widest uppercase mb-3">
                {item.label}
              </span>
              <h3 className={`text-4xl font-extrabold ${item.tone}`}>{item.value}</h3>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default DoctorProfile;
