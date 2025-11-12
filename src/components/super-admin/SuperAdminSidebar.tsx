import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Package,
  XCircle,
  CalendarRange,
  Settings,
  LogOut,
  Shield
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const SuperAdminSidebar = () => {
  const { logout } = useAuth();

  const navItems = [
    { to: '/super-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/super-admin/vendors', icon: Users, label: 'Vendors' },
    { to: '/super-admin/bookings', icon: Calendar, label: 'Bookings' },
    { to: '/super-admin/services', icon: Package, label: 'Services' },
    { to: '/super-admin/cancellations', icon: XCircle, label: 'Cancellations' },
    { to: '/super-admin/events', icon: CalendarRange, label: 'Events' },
    { to: '/super-admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-900 text-white flex flex-col shadow-xl">
      {/* Logo */}
      <div className="p-6 border-b border-purple-700/50">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-2 shadow-lg">
            <Shield size={28} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-white">MetroWayz</h1>
            <p className="text-xs text-yellow-400 font-semibold">Super Admin</p>
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
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 shadow-lg font-semibold'
                      : 'text-purple-200 hover:bg-purple-800/50 hover:text-white'
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
      <div className="p-4 border-t border-purple-700/50">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-900/50 hover:text-white transition-all duration-200 w-full"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default SuperAdminSidebar;
