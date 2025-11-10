import { useQuery } from '@tanstack/react-query';
import SuperAdminLayout from '../../components/super-admin/SuperAdminLayout';
import superAdminApi from '../../services/super-admin/superAdminApi';
import {
  Users,
  Package,
  Calendar,
  TrendingUp,
  DollarSign,
  XCircle,
  CalendarRange,
  Activity
} from 'lucide-react';

const SuperAdminDashboard = () => {
  // Fetch platform stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: superAdminApi.dashboard.getStats,
  });

  const statCards = [
    {
      title: 'Total Vendors',
      value: stats?.totalVendors || 0,
      icon: Users,
      color: 'bg-blue-500',
      trend: `+${stats?.newVendorsThisMonth || 0} this month`,
    },
    {
      title: 'Total Services',
      value: stats?.totalServices || 0,
      icon: Package,
      color: 'bg-green-500',
      trend: `${stats?.activeServices || 0} active`,
    },
    {
      title: 'Total Bookings',
      value: stats?.totalBookings || 0,
      icon: Calendar,
      color: 'bg-purple-500',
      trend: `${stats?.pendingBookings || 0} pending`,
    },
    {
      title: 'Platform Revenue',
      value: `₦${stats?.platformRevenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      trend: `5% platform fee`,
    },
    {
      title: 'Cancellation Requests',
      value: stats?.pendingCancellations || 0,
      icon: XCircle,
      color: 'bg-red-500',
      trend: 'Awaiting review',
    },
    {
      title: 'Upcoming Events',
      value: stats?.upcomingEvents || 0,
      icon: CalendarRange,
      color: 'bg-indigo-500',
      trend: `${stats?.totalEvents || 0} total`,
    },
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of MetroWayz platform metrics</p>
        </div>

        {/* Stats Cards */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading statistics...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statCards.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                      <p className="text-sm text-gray-500 mt-2">{stat.trend}</p>
                    </div>
                    <div className={`${stat.color} rounded-full p-4`}>
                      <stat.icon size={28} className="text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vendor Performance */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 rounded-full p-2">
                    <TrendingUp size={20} className="text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Vendor Performance</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Top Performing Vendor</span>
                    <span className="font-semibold text-gray-900">{stats?.topVendor?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Average Rating</span>
                    <span className="font-semibold text-gray-900">★ {stats?.averageRating?.toFixed(1) || '0.0'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-semibold text-green-600">{stats?.completionRate || 0}%</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-100 rounded-full p-2">
                    <Activity size={20} className="text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Platform Activity</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Today's Bookings</span>
                    <span className="font-semibold text-gray-900">{stats?.todayBookings || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">This Week</span>
                    <span className="font-semibold text-gray-900">{stats?.weekBookings || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">This Month</span>
                    <span className="font-semibold text-gray-900">{stats?.monthBookings || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/super-admin/cancellations"
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Pending Cancellations</p>
                    <p className="text-3xl font-bold mt-1">{stats?.pendingCancellations || 0}</p>
                  </div>
                  <XCircle size={32} className="opacity-80" />
                </div>
                <p className="text-sm mt-3 opacity-90">→ Review requests</p>
              </a>

              <a
                href="/super-admin/events"
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Manage Events</p>
                    <p className="text-3xl font-bold mt-1">{stats?.upcomingEvents || 0}</p>
                  </div>
                  <CalendarRange size={32} className="opacity-80" />
                </div>
                <p className="text-sm mt-3 opacity-90">→ Create new event</p>
              </a>

              <a
                href="/super-admin/vendors"
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">View Vendors</p>
                    <p className="text-3xl font-bold mt-1">{stats?.totalVendors || 0}</p>
                  </div>
                  <Users size={32} className="opacity-80" />
                </div>
                <p className="text-sm mt-3 opacity-90">→ Manage vendors</p>
              </a>
            </div>
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
