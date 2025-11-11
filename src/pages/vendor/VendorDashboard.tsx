import { useQuery } from '@tanstack/react-query';
import VendorLayout from '../../components/vendor/VendorLayout';
import vendorApi from '../../services/vendor/vendorApi';
import {
  DollarSign,
  Package,
  Calendar,
  TrendingUp,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

const VendorDashboard = () => {
  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['vendor-stats'],
    queryFn: vendorApi.dashboard.getStats,
  });

  // Fetch recent bookings
  const { data: recentBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['recent-bookings'],
    queryFn: vendorApi.dashboard.getRecentBookings,
  });

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₦${stats?.stats?.totalRevenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'bg-green-500',
      trend: '+12.5%',
    },
    {
      title: 'Active Services',
      value: stats?.stats?.totalServices || 0,
      icon: Package,
      color: 'bg-blue-500',
      trend: '+2',
    },
    {
      title: 'Total Bookings',
      value: stats?.stats?.totalBookings || 0,
      icon: Calendar,
      color: 'bg-purple-500',
      trend: '+8',
    },
    {
      title: 'Pending Approval',
      value: stats?.stats?.pendingBookings || 0,
      icon: Clock,
      color: 'bg-orange-500',
      trend: null,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's what's happening with your business.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  {stat.trend && (
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                      <TrendingUp size={16} />
                      {stat.trend} from last month
                    </p>
                  )}
                </div>
                <div className={`${stat.color} rounded-full p-3`}>
                  <stat.icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
            <p className="text-sm text-gray-500 mt-1">Latest bookings for your services</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookingsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Loading bookings...
                    </td>
                  </tr>
                ) : recentBookings?.bookings?.length > 0 ? (
                  recentBookings.bookings.slice(0, 5).map((booking: any) => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.serviceName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{booking.userId?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{booking.userId?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(booking.checkInDate), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          to {format(new Date(booking.checkOutDate), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₦{booking.totalAmount?.toLocaleString() || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No bookings yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-200 text-center">
            <a href="/vendor/bookings" className="text-primary-600 hover:text-primary-700 font-medium">
              View All Bookings →
            </a>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="/vendor/services/new"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="bg-primary-100 rounded-full p-3">
                <Package size={24} className="text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Add New Service</h3>
                <p className="text-sm text-gray-500">Create a new service listing</p>
              </div>
            </div>
          </a>

          <a
            href="/vendor/bookings?status=pending"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 rounded-full p-3">
                <Clock size={24} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Pending Requests</h3>
                <p className="text-sm text-gray-500">{stats?.stats?.pendingBookings || 0} awaiting approval</p>
              </div>
            </div>
          </a>

          <a
            href="/vendor/financial"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="bg-green-100 rounded-full p-3">
                <DollarSign size={24} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">View Earnings</h3>
                <p className="text-sm text-gray-500">Check your financial reports</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </VendorLayout>
  );
};

export default VendorDashboard;
