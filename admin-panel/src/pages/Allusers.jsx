import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all users — GET /user/admin/all-users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/user/admin/all-users");
        setUsers(res.data.users || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <Layout>
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-2xl font-bold text-gray-900">👥 All Users</h4>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-gray-500 font-medium">
            <span className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin"></span>
            Loading users...
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h5 className="font-bold text-gray-800 m-0 text-sm">Registered Users <span className="text-gray-500 font-normal">({users.length})</span></h5>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500 font-medium bg-gray-50/50">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((u, i) => (
                      <tr key={u._id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-6 py-4 text-gray-400 font-medium">{i + 1}</td>
                        <td className="px-6 py-4 font-bold text-gray-800">{u.name}</td>
                        <td className="px-6 py-4 font-medium text-gray-600">{u.email}</td>
                        <td className="px-6 py-4 font-medium text-gray-600">{u.phone}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${u.role === "admin"
                                ? "bg-rose-100 text-rose-700"
                                : u.role === "doctor"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AllUsers;