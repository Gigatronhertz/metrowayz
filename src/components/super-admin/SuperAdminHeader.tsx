import { Bell, Search, Shield, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';

interface SuperAdminHeaderProps {
  onMenuClick: () => void;
}

const SuperAdminHeader = ({ onMenuClick }: SuperAdminHeaderProps) => {
  const { user } = useAuth();
  const [notifications] = useState(0);

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 z-10 shadow-sm">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
      >
        <Menu className="w-6 h-6 text-gray-600" />
      </button>
      {/* Search Bar - Hidden on small screens */}
      <div className="hidden md:flex flex-1 max-w-2xl">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search vendors, bookings, services..."
            className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
          />
        </div>
      </div>

      {/* Mobile - Show title instead of search */}
      <div className="flex-1 md:hidden">
        <h1 className="text-lg font-display font-bold text-gray-900">Super Admin</h1>
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
        <div className="flex items-center gap-2 lg:gap-3 pl-2 lg:pl-4 border-l border-gray-100">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-secondary-500 rounded-full flex items-center justify-center shadow-sm">
            <Shield size={16} className="lg:w-5 lg:h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-gray-900">{user?.name || 'Super Admin'}</p>
            <p className="text-xs text-secondary-600 font-semibold">Super Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SuperAdminHeader;
