import { Bell, Search, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';

const SuperAdminHeader = () => {
  const { user } = useAuth();
  const [notifications] = useState(0);

  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-10 shadow-sm">
      {/* Search Bar */}
      <div className="flex-1 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search vendors, bookings, services..."
            className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl hover:bg-gray-50 transition-all duration-200">
          <Bell size={20} className="text-gray-600" />
          {notifications > 0 && (
            <span className="absolute top-0.5 right-0.5 bg-purple-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold shadow-md">
              {notifications}
            </span>
          )}
        </button>

        {/* Admin Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
            <Shield size={20} className="text-yellow-400" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{user?.name || 'Super Admin'}</p>
            <p className="text-xs text-purple-600 font-semibold">Super Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SuperAdminHeader;
