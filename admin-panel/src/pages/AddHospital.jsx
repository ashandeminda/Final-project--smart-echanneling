import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import toast from "react-hot-toast";

const AddHospital = () => {
  // Form state for adding a new hospital
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [rating, setRating] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // List of hospitals from backend
  const [hospitals, setHospitals] = useState([]);

  // Fetch all hospitals on page load
  const fetchHospitals = async () => {
    try {
      const res = await api.get("/hospital/get-all");
      setHospitals(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  // Handle form submit — POST /hospital/add
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !location) return toast.error("Name and Location are required");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", name);
      formData.append("location", location);
      formData.append("rating", rating || 0);
      if (image) formData.append("image", image);

      await api.post("/hospital/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Hospital Added Successfully");
      // Reset form
      setName("");
      setLocation("");
      setRating("");
      setImage(null);
      // Refresh list
      fetchHospitals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error adding hospital");
    } finally {
      setLoading(false);
    }
  };

  // Delete a hospital — DELETE /hospital/delete/:id
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this hospital?")) return;
    try {
      await api.delete(`/hospital/delete/${id}`);
      toast.success("Hospital Deleted");
      fetchHospitals();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  return (
    <Layout>
      <div className="w-full">
        {/* Add Hospital Form */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8 max-w-4xl">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <h5 className="text-xl font-bold text-gray-900 m-0">🏥 Add Hospital</h5>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hospital Name *</label>
                <input
                  type="text"
                  className="w-full bg-white border border-gray-300 rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-gray-900 placeholder:text-gray-400"
                  placeholder="General Hospital"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  className="w-full bg-white border border-gray-300 rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-gray-900 placeholder:text-gray-400"
                  placeholder="City, District"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rating (0-5)</label>
                <input
                  type="number"
                  className="w-full bg-white border border-gray-300 rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-gray-900 placeholder:text-gray-400"
                  placeholder="4.5"
                  min="0"
                  max="5"
                  step="0.1"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hospital Image</label>
                <input
                  type="file"
                  className="w-full bg-white border border-gray-300 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-gray-600 file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer file:transition-colors cursor-pointer"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-8 rounded-full shadow-md shadow-blue-600/20 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Hospital"}
              </button>
            </div>
          </form>
        </div>

        {/* Hospital List Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h5 className="font-bold text-gray-800 m-0 text-sm">All Hospitals <span className="text-gray-500 font-normal">({hospitals.length})</span></h5>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Image</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {hospitals.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 font-medium bg-gray-50/50">
                      No hospitals found
                    </td>
                  </tr>
                ) : (
                  hospitals.map((h, i) => (
                    <tr key={h._id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-6 py-4 text-gray-400 font-medium">{i + 1}</td>
                      <td className="px-6 py-4">
                        {h.image ? (
                          <img
                            src={`http://localhost:8080/uploads/${h.image}`}
                            alt={h.name}
                            className="w-10 h-10 rounded-xl object-cover shadow-sm border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm text-lg">🏥</div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">{h.name}</td>
                      <td className="px-6 py-4 text-gray-600">{h.location}</td>
                      <td className="px-6 py-4 font-medium text-amber-500 flex items-center gap-1 mt-2">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        <span className="text-gray-700">{h.rating || "N/A"}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          className="bg-white border border-gray-200 text-rose-600 hover:bg-rose-50 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 shadow-sm hover:border-rose-200"
                          onClick={() => handleDelete(h._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AddHospital;