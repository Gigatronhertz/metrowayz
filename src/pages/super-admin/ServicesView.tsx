import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import SuperAdminLayout from '../../components/super-admin/SuperAdminLayout';
import superAdminApi from '../../services/super-admin/superAdminApi';
import { Star } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Accommodation',
  'Transportation',
  'Events',
  'Cleaning',
  'Entertainment',
  'Health & Wellness',
  'Professional Services'
];

const ServicesView = () => {
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch services
  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['super-admin-services', categoryFilter, statusFilter],
    queryFn: () => superAdminApi.services.getAllServices({
      category: categoryFilter === 'All' ? undefined : categoryFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services Overview</h1>
          <p className="text-gray-500 mt-1">View all services across the platform</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="space-y-4">
            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'active', 'inactive', 'pending'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    categoryFilter === category
                      ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Services</p>
            <p className="text-2xl font-bold text-gray-900">{servicesData?.total || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {servicesData?.data?.filter((s: any) => s.status === 'active').length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-600">
              {servicesData?.data?.filter((s: any) => s.status === 'pending').length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Avg Rating</p>
            <p className="text-2xl font-bold text-purple-600">
              {servicesData?.averageRating?.toFixed(1) || '0.0'} ★
            </p>
          </div>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading services...</p>
          </div>
        ) : servicesData?.data?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicesData.data.map((service: any) => (
              <div key={service._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Service Image */}
                <div className="relative h-48 bg-gray-200">
                  {service.images && service.images.length > 0 ? (
                    <img
                      src={service.images[0].url}
                      alt={service.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(service.status)}`}>
                    {service.status}
                  </span>
                </div>

                {/* Service Info */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{service.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{service.category}</p>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{service.description}</p>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xl font-bold text-purple-600">
                        ₦{service.price?.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">per {service.priceUnit}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={16} fill="currentColor" />
                        <span className="font-semibold">{service.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                      <p className="text-xs text-gray-500">{service.reviewCount || 0} reviews</p>
                    </div>
                  </div>

                  {/* Vendor Info */}
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">By {service.creatorName || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{service.bookings || 0} bookings</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">No services found</p>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default ServicesView;
