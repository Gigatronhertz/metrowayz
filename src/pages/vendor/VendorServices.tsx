import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import VendorLayout from '../../components/vendor/VendorLayout';
import vendorApi from '../../services/vendor/vendorApi';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const VendorServices = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch vendor's services
  const { data: servicesData, isLoading, error, isError } = useQuery({
    queryKey: ['vendor-services', statusFilter],
    queryFn: async () => {
      console.log('🚀 FETCHING VENDOR SERVICES - Status filter:', statusFilter);
      const result = await vendorApi.service.getMyServices({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      console.log('✅ VENDOR SERVICES RESULT:', result);
      console.log('📊 Services count:', result?.data?.length);
      return result;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Log for debugging
  console.log('🔍 VendorServices State:', {
    isLoading,
    isError,
    error,
    hasData: !!servicesData,
    dataLength: servicesData?.data?.length,
    servicesData
  });

  // Delete service mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorApi.service.deleteService(id),
    onSuccess: () => {
      toast.success('Service deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['vendor-services'] });
    },
    onError: () => {
      toast.error('Failed to delete service');
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      vendorApi.service.updateServiceStatus(id, status),
    onSuccess: () => {
      toast.success('Service status updated');
      queryClient.invalidateQueries({ queryKey: ['vendor-services'] });
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    toggleStatusMutation.mutate({ id, status: newStatus });
  };

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
    <VendorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Services</h1>
            <p className="text-gray-500 mt-1">Manage your service listings</p>
          </div>
          <button
            onClick={() => navigate('/vendor/services/new')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add New Service
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex gap-2">
            {['all', 'active', 'inactive', 'pending'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{service.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{service.category}</p>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{service.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        ₦{service.price?.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">per {service.priceUnit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{service.bookings || 0} bookings</p>
                      <p className="text-sm text-gray-600">★ {service.rating?.toFixed(1) || '0.0'}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/vendor/services/edit/${service._id}`)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(service._id, service.status)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {service.status === 'active' ? <EyeOff size={16} /> : <Eye size={16} />}
                      {service.status === 'active' ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => handleDelete(service._id, service.title)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Plus size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No services yet</h3>
              <p className="text-gray-500 mb-6">
                Start by creating your first service listing to attract customers.
              </p>
              <button
                onClick={() => navigate('/vendor/services/new')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Service
              </button>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  );
};

export default VendorServices;
