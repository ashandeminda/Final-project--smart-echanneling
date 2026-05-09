import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import healthRecordService from "../api/healthRecordService";
import { useAuth } from "../context/useAuth";

function HealthRecords() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    recordType: "Other",
    recordDate: "",
    file: null,
  });

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await healthRecordService.getMyHealthRecords();
      setRecords(data.healthRecords || []);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    loadRecords();
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, file }));
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      recordType: "Other",
      recordDate: "",
      file: null,
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Please enter a title for the health record");
      return;
    }

    if (!form.file) {
      alert("Please choose a file to upload");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("recordType", form.recordType);
      if (form.recordDate) {
        formData.append("recordDate", form.recordDate);
      }
      formData.append("file", form.file);

      const data = await healthRecordService.uploadHealthRecord(formData);
      setRecords((prev) => [data.healthRecord, ...prev]);
      resetForm();
      const fileInput = document.getElementById("health-record-file");
      if (fileInput) {
        fileInput.value = "";
      }
      alert("Health record uploaded successfully");
    } catch (error) {
      alert(error.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this health record?");
    if (!ok) return;

    try {
      await healthRecordService.deleteHealthRecord(id);
      setRecords((prev) => prev.filter((record) => record._id !== id));
      alert("Health record deleted");
    } catch (error) {
      alert(error.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-10 bg-slate-50 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div>
            <span className="inline-block px-3 py-1 bg-teal-50 text-teal-700 font-bold text-[10px] uppercase tracking-widest rounded-full mb-3 border border-teal-100">
              Medical History
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">My Health Records</h2>
            <p className="text-slate-500 mt-2 font-medium">Manage and view your uploaded medical documents</p>
          </div>
          <button 
            className="shrink-0 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow-md transition-all hover:-translate-y-0.5"
            onClick={() => document.getElementById("health-record-upload-form")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            Upload New Record
          </button>
        </div>

        <form
          id="health-record-upload-form"
          onSubmit={handleUpload}
          className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-5"
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Upload Health Record</h3>
              <p className="text-slate-500 mt-2 font-medium">
                Upload PDFs, JPG, JPEG, or PNG files for your medical history.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Blood test result"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Record Type
              </label>
              <select
                name="recordType"
                value={form.recordType}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Other">Other</option>
                <option value="Lab Report">Lab Report</option>
                <option value="Prescription">Prescription</option>
                <option value="Scan">Scan</option>
                <option value="Discharge Summary">Discharge Summary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Record Date
              </label>
              <input
                type="date"
                name="recordDate"
                value={form.recordDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                File
              </label>
              <input
                id="health-record-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="4"
                placeholder="Optional note about this report"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
            <p className="text-sm text-slate-500 font-medium">
              Allowed files: PDF, JPG, JPEG, PNG
            </p>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-70"
            >
              {uploading ? "Uploading..." : "Upload Record"}
            </button>
          </div>
        </form>

        {/* CONTENT */}
        {loading ? (
          <div className="flex justify-center items-center p-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
             <div className="w-10 h-10 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 border border-slate-200">
              📄
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No records found</h3>
            <p className="text-slate-500 font-medium">You haven't uploaded any health records yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {records.map((record) => (
              <div key={record._id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-slate-200 flex flex-col justify-between transition-all group overflow-hidden relative">
                
                {/* Decorative Side Bar */}
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-teal-500 transform origin-left scale-y-0 group-hover:scale-y-100 transition-transform duration-300 ease-out"></div>
                
                <div className="flex-1 pl-2">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center text-xl shadow-inner border border-teal-100 shrink-0">
                      ⚕️
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                      {new Date(record.recordDate || record.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 mb-1 leading-tight group-hover:text-teal-700 transition-colors">{record.title}</h4>
                  <p className="text-sm text-slate-500 font-medium mb-6 capitalize px-2.5 py-1 bg-slate-50 inline-block rounded-lg">{record.recordType}</p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 pl-2">
                  <a 
                    href={`http://localhost:8080${record.fileUrl}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 text-center py-2.5 bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-700 border border-slate-200 hover:border-teal-200 text-sm font-bold rounded-xl transition-colors"
                  >
                    View Record
                  </a>
                  <button 
                    onClick={() => handleDelete(record._id)}
                    className="flex-1 py-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-sm font-bold rounded-xl transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HealthRecords;
