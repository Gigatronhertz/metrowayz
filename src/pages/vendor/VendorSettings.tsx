import VendorLayout from '../../components/vendor/VendorLayout';
import { Bell, Lock, CreditCard, Shield } from 'lucide-react';

const VendorSettings = () => {
  return (
    <VendorLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account preferences</p>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive booking updates via email</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-blue-600" />
            </label>

            <label className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Booking Alerts</p>
                <p className="text-sm text-gray-500">Get notified for new booking requests</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-blue-600" />
            </label>

            <label className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Marketing Updates</p>
                <p className="text-sm text-gray-500">Receive tips and promotional content</p>
              </div>
              <input type="checkbox" className="rounded text-blue-600" />
            </label>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Security</h2>
          </div>

          <div className="space-y-4">
            <div className="py-3 border-b border-gray-200">
              <p className="font-medium text-gray-900 mb-1">Password</p>
              <p className="text-sm text-gray-500 mb-3">Last changed 30 days ago</p>
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                Change Password
              </button>
            </div>

            <div className="py-3">
              <p className="font-medium text-gray-900 mb-1">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500 mb-3">Add an extra layer of security</p>
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                Enable 2FA
              </button>
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Payment Information</h2>
          </div>

          <div className="space-y-4">
            <div className="py-3 border-b border-gray-200">
              <p className="font-medium text-gray-900 mb-1">Bank Account</p>
              <p className="text-sm text-gray-500 mb-3">For receiving payouts</p>
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                Add Bank Account
              </button>
            </div>

            <div className="py-3">
              <p className="font-medium text-gray-900 mb-1">Payout Schedule</p>
              <select className="mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option>Weekly</option>
                <option>Bi-weekly</option>
                <option>Monthly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Privacy</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Profile Visibility</p>
                <p className="text-sm text-gray-500">Show your profile to customers</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-blue-600" />
            </label>

            <label className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Share Analytics</p>
                <p className="text-sm text-gray-500">Help improve MetroWayz with usage data</p>
              </div>
              <input type="checkbox" className="rounded text-blue-600" />
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-red-200">
          <h2 className="text-xl font-bold text-red-600 mb-4">Danger Zone</h2>

          <div className="space-y-4">
            <div className="py-3 border-b border-gray-200">
              <p className="font-medium text-gray-900 mb-1">Deactivate Account</p>
              <p className="text-sm text-gray-500 mb-3">Temporarily disable your vendor account</p>
              <button className="text-red-600 hover:text-red-700 font-medium">
                Deactivate
              </button>
            </div>

            <div className="py-3">
              <p className="font-medium text-gray-900 mb-1">Delete Account</p>
              <p className="text-sm text-gray-500 mb-3">Permanently delete your account and data</p>
              <button className="text-red-600 hover:text-red-700 font-medium">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
};

export default VendorSettings;
