import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Calendar,
  DollarSign,
  Star,
  Settings,
  User,
  LogOut,
  Shield
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface VendorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const VendorSidebar = ({ isOpen, onClose }: VendorSidebarProps) => {
  const { logout } = useAuth();

  const navItems = [
    { to: '/vendor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/vendor/services', icon: Package, label: 'My Services' },
    { to: '/vendor/bookings', icon: Calendar, label: 'Bookings' },
    { to: '/vendor/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/vendor/financial', icon: DollarSign, label: 'Financial' },
    { to: '/vendor/reviews', icon: Star, label: 'Reviews' },
    { to: '/vendor/profile', icon: User, label: 'Profile' },
    { to: '/vendor/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm z-40 transform transition-transform duration-300 lg:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="MetroWayz" className="w-10 h-10" />
          <div>
            <h1 className="text-xl font-display font-bold text-gray-900">MetroWayz</h1>
            <p className="text-xs text-gray-500 mt-0.5">Vendor Portal</p>
          </div>
        </div>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout and Admin Access */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        <NavLink
          to="/super-admin/login"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-purple-600 hover:bg-purple-50 transition-all duration-200 w-full"
        >
          <Shield size={20} />
          <span className="font-medium text-sm">Super Admin</span>
        </NavLink>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 w-full"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default VendorSidebar;
