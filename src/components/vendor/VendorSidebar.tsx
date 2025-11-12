import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Calendar,
  DollarSign,
  Star,
  Settings,
  User,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const VendorSidebar = () => {
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
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="MetroWayz" className="w-10 h-10" />
          <div>
            <h1 className="text-xl font-display font-bold text-gray-900">MetroWayz</h1>
            <p className="text-xs text-gray-500 mt-0.5">Vendor Portal</p>
          </div>
        </div>
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

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-100">
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
