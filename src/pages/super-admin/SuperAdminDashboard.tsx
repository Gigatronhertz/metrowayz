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
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 -m-6 p-8 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-secondary-500 rounded-xl p-2 shadow-sm">
              <Activity size={32} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold text-gray-900">Platform Dashboard</h1>
              <p className="text-secondary-600 mt-1 text-lg font-semibold">Super Admin Control Center</p>
            </div>
          </div>
          <p className="text-gray-600 mt-3">Overview of MetroWayz platform metrics and performance</p>
        </div>

        {/* Stats Cards */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-500 mt-4 font-medium">Loading statistics...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statCards.map((stat, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{stat.title}</p>
                      <p className="text-3xl font-display font-bold text-gray-900 mt-3">{stat.value}</p>
                      <p className="text-sm text-gray-600 mt-3 font-medium">{stat.trend}</p>
                    </div>
                    <div className={`${stat.color} rounded-xl p-4 shadow-sm`}>
                      <stat.icon size={32} className="text-white" strokeWidth={2} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vendor Performance */}
              <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-500 rounded-xl p-3 shadow-sm">
                    <TrendingUp size={24} className="text-white" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-display font-bold text-gray-900">Vendor Performance</h3>
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
              <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-secondary-500 rounded-xl p-3 shadow-sm">
                    <Activity size={24} className="text-white" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-display font-bold text-gray-900">Platform Activity</h3>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <a
                href="/super-admin/cancellations"
                className="bg-white border-2 border-red-200 rounded-2xl p-6 hover:shadow-card-hover transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Pending Cancellations</p>
                    <p className="text-4xl font-display font-bold mt-2 text-red-600">{stats?.pendingCancellations || 0}</p>
                  </div>
                  <div className="bg-red-100 rounded-xl p-3 group-hover:scale-105 transition-transform">
                    <XCircle size={36} className="text-red-600" strokeWidth={2} />
                  </div>
                </div>
                <p className="text-sm mt-4 font-semibold text-gray-700 flex items-center gap-2">
                  Review requests
                  <span className="text-lg text-red-600">→</span>
                </p>
              </a>

              <a
                href="/super-admin/events"
                className="bg-white border-2 border-secondary-200 rounded-2xl p-6 hover:shadow-card-hover transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Manage Events</p>
                    <p className="text-4xl font-display font-bold mt-2 text-secondary-600">{stats?.upcomingEvents || 0}</p>
                  </div>
                  <div className="bg-secondary-100 rounded-xl p-3 group-hover:scale-105 transition-transform">
                    <CalendarRange size={36} className="text-secondary-600" strokeWidth={2} />
                  </div>
                </div>
                <p className="text-sm mt-4 font-semibold text-gray-700 flex items-center gap-2">
                  Create new event
                  <span className="text-lg text-secondary-600">→</span>
                </p>
              </a>

              <a
                href="/super-admin/vendors"
                className="bg-white border-2 border-primary-200 rounded-2xl p-6 hover:shadow-card-hover transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">View Vendors</p>
                    <p className="text-4xl font-display font-bold mt-2 text-primary-600">{stats?.totalVendors || 0}</p>
                  </div>
                  <div className="bg-primary-100 rounded-xl p-3 group-hover:scale-105 transition-transform">
                    <Users size={36} className="text-primary-600" strokeWidth={2} />
                  </div>
                </div>
                <p className="text-sm mt-4 font-semibold text-gray-700 flex items-center gap-2">
                  Manage vendors
                  <span className="text-lg text-primary-600">→</span>
                </p>
              </a>
            </div>
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
