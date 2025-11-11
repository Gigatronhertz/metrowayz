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
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-primary-500">MetroWayz</h1>
        <p className="text-sm text-gray-500 mt-1">Vendor Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default VendorSidebar;
