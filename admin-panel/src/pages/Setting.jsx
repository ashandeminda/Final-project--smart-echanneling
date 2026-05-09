import Layout from "../components/Layout";

const Settings = () => {
  return (
    <Layout>
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h5 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">System Settings</h5>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors px-4 -mx-4 rounded-xl gap-3">
            <div>
              <strong className="block text-gray-800 font-bold mb-1 text-sm">Email Notifications</strong>
              <div className="text-sm text-gray-500 font-medium">Send email notifications to users</div>
            </div>
            <button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600 px-5 py-2 rounded-full text-sm font-bold shadow-sm transition-all duration-300 self-start sm:self-auto">
              Configure
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors px-4 -mx-4 rounded-xl gap-3">
            <div>
              <strong className="block text-gray-800 font-bold mb-1 text-sm">SMS Notifications</strong>
              <div className="text-sm text-gray-500 font-medium">Send SMS reminders for appointments</div>
            </div>
            <button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600 px-5 py-2 rounded-full text-sm font-bold shadow-sm transition-all duration-300 self-start sm:self-auto">
              Configure
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors px-4 -mx-4 rounded-xl gap-3">
            <div>
              <strong className="block text-gray-800 font-bold mb-1 text-sm">Payment Gateway</strong>
              <div className="text-sm text-gray-500 font-medium">Manage payment gateway settings</div>
            </div>
            <button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600 px-5 py-2 rounded-full text-sm font-bold shadow-sm transition-all duration-300 self-start sm:self-auto">
              Configure
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors px-4 -mx-4 rounded-xl gap-3">
            <div>
              <strong className="block text-gray-800 font-bold mb-1 text-sm">Booking Settings</strong>
              <div className="text-sm text-gray-500 font-medium">Configure appointment booking rules</div>
            </div>
            <button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600 px-5 py-2 rounded-full text-sm font-bold shadow-sm transition-all duration-300 self-start sm:self-auto">
              Configure
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors px-4 -mx-4 rounded-xl gap-3">
            <div>
              <strong className="block text-gray-800 font-bold mb-1 text-sm">System Maintenance</strong>
              <div className="text-sm text-gray-500 font-medium">Database backup and maintenance</div>
            </div>
            <button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600 px-5 py-2 rounded-full text-sm font-bold shadow-sm transition-all duration-300 self-start sm:self-auto">
              Configure
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;