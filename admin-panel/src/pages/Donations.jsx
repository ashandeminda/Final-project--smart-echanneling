import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import Layout from "../components/Layout";

const CAMPAIGN_LABELS = {
  "child-healthcare": "Child Healthcare",
  "cancer-treatment": "Cancer Treatment",
  "emergency-aid": "Emergency Aid",
  "senior-care": "Senior Care",
  general: "General",
};

const Donations = () => {
  const [donations, setDonations] = useState([]);
  const [totals, setTotals] = useState({ totalRaised: 0, donationsCount: 0 });
  const [byCampaign, setByCampaign] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const res = await api.get("/donation/admin/all");
        setDonations(res.data.donations || []);
        setTotals(res.data.totals || { totalRaised: 0, donationsCount: 0 });
        setByCampaign(res.data.byCampaign || {});
      } catch (err) {
        const message =
          err.response?.data?.message || "Failed to load donation records.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, []);

  const campaignRows = useMemo(
    () =>
      Object.entries(byCampaign).map(([key, value]) => ({
        key,
        label: CAMPAIGN_LABELS[key] || key,
        totalRaised: value.totalRaised || 0,
        donationsCount: value.donationsCount || 0,
      })),
    [byCampaign]
  );

  return (
    <Layout>
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-2xl font-bold text-gray-900">Donations & Charity</h4>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-gray-500 font-medium">
            <span className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin"></span>
            Loading donations...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-8">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center border-l-4 border-l-rose-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-1">Total Raised</div>
                <h3 className="text-3xl font-bold text-gray-900">LKR {Number(totals.totalRaised).toLocaleString()}</h3>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center border-l-4 border-l-emerald-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-1">Completed Donations</div>
                <h3 className="text-3xl font-bold text-gray-900">{totals.donationsCount}</h3>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center border-l-4 border-l-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-1">Tracked Funds</div>
                <h3 className="text-3xl font-bold text-gray-900">{campaignRows.length}</h3>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8 max-w-4xl">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h5 className="font-bold text-gray-800 m-0 text-sm">Campaign Summary</h5>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Fund</th>
                      <th className="px-6 py-4">Raised</th>
                      <th className="px-6 py-4 text-right">Donations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {campaignRows.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-12 text-center text-gray-500 font-medium bg-gray-50/50">
                          No donation summaries available
                        </td>
                      </tr>
                    ) : (
                      campaignRows.map((row) => (
                        <tr key={row.key} className="hover:bg-blue-50/40 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-800">{row.label}</td>
                          <td className="px-6 py-4 font-medium text-emerald-600">LKR {Number(row.totalRaised).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right text-gray-600 font-medium">
                            <span className="bg-blue-50 text-blue-700 py-1 px-3 rounded-full text-xs font-bold">{row.donationsCount}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h5 className="font-bold text-gray-800 m-0 text-sm">Recent Donation Records <span className="text-gray-500 font-normal">({donations.length})</span></h5>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4">#</th>
                      <th className="px-6 py-4">Donor</th>
                      <th className="px-6 py-4">Fund</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Method</th>
                      <th className="px-6 py-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {donations.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500 font-medium bg-gray-50/50">
                          No donations found
                        </td>
                      </tr>
                    ) : (
                      donations.map((donation, index) => (
                        <tr key={donation._id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="px-6 py-4 text-gray-400 font-medium">{index + 1}</td>
                          <td className="px-6 py-4 font-bold text-gray-800">{donation.isAnonymous ? "Anonymous Donor" : donation.name}</td>
                          <td className="px-6 py-4 text-gray-600">{CAMPAIGN_LABELS[donation.campaignKey] || donation.campaignKey}</td>
                          <td className="px-6 py-4 font-semibold text-gray-900">LKR {Number(donation.amount).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className="bg-blue-50 text-blue-600 py-1 px-3 rounded-full text-xs font-bold uppercase tracking-wider">{donation.paymentMethod || "N/A"}</span>
                          </td>
                          <td className="px-6 py-4 text-right text-gray-500">{new Date(donation.createdAt).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Donations;
