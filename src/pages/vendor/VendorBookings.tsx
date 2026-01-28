import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import VendorLayout from '../../components/vendor/VendorLayout';
import vendorApi from '../../services/vendor/vendorApi';
import { Check, X, Eye, Clock, Calendar, User, MapPin, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const VendorBookings = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch bookings
  const { data: bookingsData, isLoading, error } = useQuery({
    queryKey: ['vendor-bookings', statusFilter],
    queryFn: async () => {
      console.log('🚀 FETCHING VENDOR BOOKINGS - Status filter:', statusFilter);
      const result = await vendorApi.booking.getProviderBookings({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      console.log('✅ VENDOR BOOKINGS RESULT:', result);
      console.log('📊 Bookings count:', result?.data?.length);
      return result;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Log for debugging
  console.log('🔍 VendorBookings State:', {
    isLoading,
    error,
    hasData: !!bookingsData,
    dataLength: bookingsData?.data?.length,
    bookings: bookingsData?.data
  });

  // Approve booking mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => vendorApi.booking.approveBooking(id),
    onSuccess: () => {
      toast.success('Booking approved successfully');
      queryClient.invalidateQueries({ queryKey: ['vendor-bookings'] });
      setShowModal(false);
    },
    onError: () => {
      toast.error('Failed to approve booking');
    },
  });

  // Reject booking mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      vendorApi.booking.rejectBooking(id, reason),
    onSuccess: () => {
      toast.success('Booking rejected');
      queryClient.invalidateQueries({ queryKey: ['vendor-bookings'] });
      setShowModal(false);
    },
    onError: () => {
      toast.error('Failed to reject booking');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      vendorApi.booking.updateBookingStatus(id, status),
    onSuccess: () => {
      toast.success('Booking status updated');
      queryClient.invalidateQueries({ queryKey: ['vendor-bookings'] });
      setShowModal(false);
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const handleViewDetails = (booking: any) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleApprove = (id: string) => {
    if (window.confirm('Are you sure you want to approve this booking?')) {
      approveMutation.mutate(id);
    }
  };

  const handleReject = (id: string) => {
    const reason = prompt('Reason for rejection (optional):');
    rejectMutation.mutate({ id, reason: reason || undefined });
  };

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

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

  const calculateDuration = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500 mt-1">Manage and track all your bookings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {bookingsData?.data?.filter((b: any) => b.status === 'pending').length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Confirmed</p>
            <p className="text-2xl font-bold text-green-600">
              {bookingsData?.data?.filter((b: any) => b.status === 'confirmed').length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-blue-600">
              {bookingsData?.data?.filter((b: any) => b.status === 'completed').length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Cancelled</p>
            <p className="text-2xl font-bold text-red-600">
              {bookingsData?.data?.filter((b: any) => b.status === 'cancelled').length || 0}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading bookings...</p>
          </div>
        ) : bookingsData?.data?.length > 0 ? (
          <div className="space-y-4">
            {bookingsData.data.map((booking: any) => (
              <div key={booking._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Service Image */}
                  <div className="w-full md:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {booking.serviceImages && booking.serviceImages.length > 0 ? (
                      <img
                        src={booking.serviceImages[0]}
                        alt={booking.serviceName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Booking Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{booking.serviceName}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin size={14} />
                          {booking.serviceLocation}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Customer</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                          <User size={14} />
                          {booking.userId?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Check-in</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                          <Calendar size={14} />
                          {format(new Date(booking.checkInDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Check-out</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                          <Calendar size={14} />
                          {format(new Date(booking.checkOutDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                          <DollarSign size={14} />
                          ₦{booking.totalAmount?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>

                    {booking.specialRequests && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500">Special Requests</p>
                        <p className="text-sm text-gray-700">{booking.specialRequests}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Eye size={16} />
                        View Details
                      </button>

                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(booking._id)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            <Check size={16} />
                            Approve
                          </button>
                          <button
                            disabled
                            title="Rejecting bookings is currently disabled"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed opacity-50"
                          >
                            <X size={16} />
                            Reject
                          </button>
                        </>
                      )}

                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(booking._id, 'completed')}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Check size={16} />
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Clock size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500">
              {statusFilter === 'all'
                ? 'You don\'t have any bookings yet.'
                : `No ${statusFilter} bookings at the moment.`}
            </p>
          </div>
        )}

        {/* Booking Details Modal */}
        {showModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
                    <p className="text-sm text-gray-500 mt-1">#{selectedBooking._id}</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Service Info */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Service</h3>
                  <p className="text-lg">{selectedBooking.serviceName}</p>
                  <p className="text-sm text-gray-500">{selectedBooking.serviceLocation}</p>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Customer Information</h3>
                  <div className="space-y-1">
                    <p><span className="text-gray-600">Name:</span> {selectedBooking.userId?.name}</p>
                    <p><span className="text-gray-600">Email:</span> {selectedBooking.userId?.email}</p>
                    <p><span className="text-gray-600">Phone:</span> {selectedBooking.userId?.phoneNumber || 'N/A'}</p>
                  </div>
                </div>

                {/* Booking Info */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Booking Information</h3>
                  <div className="space-y-1">
                    <p><span className="text-gray-600">Check-in:</span> {format(new Date(selectedBooking.checkInDate), 'MMM dd, yyyy')}</p>
                    <p><span className="text-gray-600">Check-out:</span> {format(new Date(selectedBooking.checkOutDate), 'MMM dd, yyyy')}</p>
                    <p><span className="text-gray-600">Duration:</span> {calculateDuration(selectedBooking.checkInDate, selectedBooking.checkOutDate)} nights</p>
                    <p><span className="text-gray-600">Guests:</span> {selectedBooking.guests}</p>
                    <p><span className="text-gray-600">Amount:</span> ₦{selectedBooking.totalAmount?.toLocaleString()}</p>
                    <p><span className="text-gray-600">Status:</span> <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(selectedBooking.status)}`}>{selectedBooking.status}</span></p>
                  </div>
                </div>

                {selectedBooking.specialRequests && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Special Requests</h3>
                    <p className="text-gray-700">{selectedBooking.specialRequests}</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedBooking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(selectedBooking._id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(selectedBooking._id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  );
};

export default VendorBookings;
