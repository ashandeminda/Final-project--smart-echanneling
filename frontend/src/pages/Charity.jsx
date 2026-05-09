import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import donationService from "../api/donationService";
import childImg from "../assets/child.jpg";
import cancerImg from "../assets/cancer.jpg";
import emergencyImg from "../assets/emergency.webp";
import  seniorImg from "../assets/senior.png";

const campaigns = [
  {
    id: 1,
    key: "child-healthcare",
    title: "Child Healthcare Fund",
    description: "Help provide essential medical care for underprivileged children.",
    image: childImg,
    raised: 325000,
    goal: 500000,
    priority: "high priority",
    priorityClass: "high",
  },
  {
    id: 2,
    key: "cancer-treatment",
    title: "Cancer Treatment Fund",
    description: "Support cancer patients with treatment costs and ongoing care.",
    image: cancerImg,
    raised: 450000,
    goal: 1000000,
    priority: "high priority",
    priorityClass: "high",
  },
  {
    id: 3,
    key: "emergency-aid",
    title: "Emergency Medical Aid",
    description: "Provide immediate medical assistance in urgent emergencies.",
    image: emergencyImg,
    raised: 300000,
    goal: 500000,
    priority: "medium priority",
    priorityClass: "medium",
  },
  {
    id: 4,
    key: "senior-care",
    title: "Senior Care Program",
    description: "Help elderly patients access medicine, checkups, and daily support.",
    image: seniorImg,
    raised: 560000,
    goal: 800000,
    priority: "community priority",
    priorityClass: "low",
  },
];

function Charity() {
  const [amount, setAmount] = useState(null);
  const [recentDonations, setRecentDonations] = useState([]);
  const [donationStats, setDonationStats] = useState({ totals: { totalRaised: 0, donationsCount: 0 }, byCampaign: {} });
  const [selectedCampaignKey, setSelectedCampaignKey] = useState(campaigns[0].key);
  const navigate = useNavigate();

  const presetAmounts = [1000, 2500, 5000, 10000];

  useEffect(() => {
    const fetchCharityData = async () => {
      try {
        const [recent, stats] = await Promise.all([
          donationService.getRecentDonations(),
          donationService.getDonationStats(),
        ]);
        setRecentDonations(recent);
        setDonationStats(stats);
      } catch (err) {
        console.error("Failed to fetch charity data:", err);
      }
    };

    fetchCharityData();
    const intervalId = window.setInterval(fetchCharityData, 10000);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleDonate = () => {
    if (!amount || amount <= 0) {
      alert("Please select or enter a valid amount");
      return;
    }

    navigate("/donate", {
      state: { amount: Number(amount), campaignKey: selectedCampaignKey },
    });
  };

  return (
    <div className="min-h-screen p-6 md:p-10 font-sans relative">
      {/* Background with slight rose tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50/80 via-white to-pink-50/80 -z-10"></div>
      
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="inline-block px-4 py-1.5 bg-rose-100 text-rose-700 font-extrabold rounded-full text-xs uppercase tracking-widest mb-4 border border-rose-200 shadow-sm">
            Heart for Healing
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Support Healthcare for All</h2>
          <p className="text-lg text-slate-600 font-medium leading-relaxed">
            Your donation helps provide medical care, urgent treatment, and long-term support for patients in need.
          </p>
        </div>

        {/* CONTENT LAYOUT */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8 xl:gap-12 items-start">
          
          {/* CAMPAIGNS LIST */}
          <div className="flex flex-col gap-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Featured Funds</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campaigns.map((campaign) => {
                const liveRaised =
                  campaign.raised + (donationStats.byCampaign?.[campaign.key]?.totalRaised || 0);
                const progress = Math.min(
                  100,
                  Math.round((liveRaised / campaign.goal) * 100)
                );
                const isSelected = selectedCampaignKey === campaign.key;

                let priorityClasses = "bg-slate-100 text-slate-700 border-slate-200";
                if (campaign.priorityClass === "high") priorityClasses = "bg-rose-100 text-rose-700 border-rose-200";
                if (campaign.priorityClass === "medium") priorityClasses = "bg-amber-100 text-amber-700 border-amber-200";
                if (campaign.priorityClass === "low") priorityClasses = "bg-sky-100 text-sky-700 border-sky-200";

                return (
                  <div
                    className={`flex flex-col bg-white rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-300 border-2 group ${
                      isSelected 
                        ? "border-rose-500 shadow-[0_20px_40px_rgba(244,63,94,0.15)] ring-4 ring-rose-50" 
                        : "border-transparent shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.1)] hover:border-rose-200"
                    }`}
                    key={campaign.id}
                    onClick={() => setSelectedCampaignKey(campaign.key)}
                  >
                    <div className="w-full h-48 sm:h-56 relative overflow-hidden bg-slate-100">
                      <img 
                        src={campaign.image} 
                        alt={campaign.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {isSelected && (
                         <div className="absolute top-4 right-4 bg-white text-rose-600 rounded-full p-2 shadow-lg">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                          </svg>
                         </div>
                      )}
                    </div>

                    <div className="p-6 sm:p-8 flex flex-col flex-1">
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <h3 className="text-xl font-bold text-slate-900 leading-tight">
                          {campaign.title}
                        </h3>
                        <span className={`inline-block px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider border whitespace-nowrap ${priorityClasses}`}>
                          {campaign.priority}
                        </span>
                      </div>

                      <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
                        {campaign.description}
                      </p>

                      <div className="mt-auto">
                        <div className="flex justify-between text-sm font-bold mb-2">
                          <span className="text-slate-700">Progress</span>
                          <span className="text-rose-600">{progress}%</span>
                        </div>
                        
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4 border border-slate-200/50">
                          <div 
                            className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                          <div className="flex flex-col">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Raised</span>
                            <strong className="text-slate-900 text-base">LKR {liveRaised.toLocaleString()}</strong>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Goal</span>
                            <strong className="text-slate-500 text-sm">LKR {campaign.goal.toLocaleString()}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RECENT DONATIONS */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 mt-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h4 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="text-rose-500">❤</span> Recent Donations
              </h4>

              {recentDonations.length === 0 ? (
                <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-slate-500 font-medium">No donations yet. Be the first to contribute!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentDonations.map((donation) => (
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100" key={donation._id}>
                      <span className="font-bold text-slate-700 text-sm">
                        {donation.isAnonymous ? "Anonymous" : donation.name || "Anonymous"}
                      </span>
                      <span className="font-extrabold text-rose-600">LKR {Number(donation.amount || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* DONATION FORM STICKY SIDEBAR */}
          <div className="xl:sticky xl:top-24 mt-8 xl:mt-0">
            <div className="bg-white border border-rose-200 rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_40px_rgba(244,63,94,0.08)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500 rounded-full blur-[60px] opacity-10 pointer-events-none"></div>
              
              <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl flex items-center justify-center text-white text-3xl mb-6 shadow-lg shadow-rose-500/30">
                ❤
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 mb-2">Make a Donation</h3>
              <p className="text-slate-500 font-medium text-sm mb-8">Every contribution makes a direct impact.</p>

              <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl mb-8 flex flex-col gap-1">
                <span className="text-rose-500 text-[10px] font-extrabold uppercase tracking-widest">Selected Fund</span>
                <strong className="text-rose-900 text-lg">
                  {campaigns.find((campaign) => campaign.key === selectedCampaignKey)?.title}
                </strong>
              </div>

              <h4 className="text-slate-900 font-bold mb-4">Select Amount</h4>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {presetAmounts.map((value) => {
                  const isActive = amount === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setAmount(value)}
                      className={`py-3.5 px-2 rounded-xl text-sm font-bold border transition-all ${
                        isActive 
                          ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      LKR {value.toLocaleString()}
                    </button>
                  );
                })}
              </div>

              <h4 className="text-slate-900 font-bold mb-4">Or Enter Custom Amount</h4>

              <div className="relative mb-8">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 font-bold">LKR</span>
                </div>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min="1"
                  className="w-full py-4 pl-14 pr-4 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-rose-400 transition-all font-bold text-lg text-slate-900"
                />
              </div>

              <button 
                className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold py-5 px-6 rounded-2xl shadow-xl shadow-rose-500/20 hover:shadow-2xl hover:shadow-rose-500/30 hover:-translate-y-1 transition-all duration-300 text-lg flex justify-center items-center gap-2"
                onClick={handleDonate}
              >
                <span>❤</span> Donate Now
              </button>

              <div className="mt-6 text-center">
                <p className="text-slate-400 text-xs font-medium leading-relaxed">
                  Your donation is securely processed. You'll receive a receipt sent directly to your email.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Charity;
