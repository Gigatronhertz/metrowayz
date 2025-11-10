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
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-purple-900 to-indigo-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-purple-700">
        <div className="flex items-center gap-2">
          <Shield size={32} className="text-yellow-400" />
          <div>
            <h1 className="text-xl font-bold">MetroWayz</h1>
            <p className="text-xs text-purple-300">Super Admin</p>
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
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-purple-700 text-white'
                      : 'text-purple-200 hover:bg-purple-800'
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
      <div className="p-4 border-t border-purple-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-300 hover:bg-red-900 transition-colors w-full"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default SuperAdminSidebar;
