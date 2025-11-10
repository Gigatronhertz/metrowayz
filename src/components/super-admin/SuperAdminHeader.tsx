import { Bell, Search, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';

const SuperAdminHeader = () => {
  const { user } = useAuth();
  const [notifications] = useState(0);

  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search vendors, bookings, services..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={20} className="text-gray-600" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>

        {/* Admin Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Shield size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.name || 'Super Admin'}</p>
            <p className="text-xs text-purple-600 font-semibold">Super Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SuperAdminHeader;
