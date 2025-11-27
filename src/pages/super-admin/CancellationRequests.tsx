import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SuperAdminLayout from '../../components/super-admin/SuperAdminLayout';
import superAdminApi from '../../services/super-admin/superAdminApi';
import { CheckCircle, XCircle, Clock, DollarSign, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const CancellationRequests = () => {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');

  // Fetch cancellation requests
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['super-admin-cancellations'],
    queryFn: () => superAdminApi.cancellation.getCancellationRequests(),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ bookingId, adminNotes }: { bookingId: string; adminNotes?: string }) =>
      superAdminApi.cancellation.approveCancellation(bookingId, adminNotes),
    onSuccess: () => {
      toast.success('Cancellation approved successfully');
      queryClient.invalidateQueries({ queryKey: ['super-admin-cancellations'] });
      setShowModal(false);
      setNotes('');
    },
    onError: () => {
      toast.error('Failed to approve cancellation');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ bookingId, adminNotes }: { bookingId: string; adminNotes?: string }) =>
      superAdminApi.cancellation.rejectCancellation(bookingId, adminNotes),
    onSuccess: () => {
      toast.success('Cancellation rejected');
      queryClient.invalidateQueries({ queryKey: ['super-admin-cancellations'] });
      setShowModal(false);
      setNotes('');
    },
    onError: () => {
      toast.error('Failed to reject cancellation');
    },
  });

  const handleOpenModal = (request: any, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setShowModal(true);
  };

  const handleConfirmAction = () => {
    if (!selectedRequest) return;

    if (actionType === 'approve') {
      approveMutation.mutate({
        bookingId: selectedRequest._id,
        adminNotes: notes || undefined,
      });
    } else {
      rejectMutation.mutate({
        bookingId: selectedRequest._id,
        adminNotes: notes || undefined,
      });
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cancellation Requests</h1>
          <p className="text-gray-500 mt-1">Review and approve/reject cancellation requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Pending Requests</p>
            <p className="text-2xl font-bold text-yellow-600">
              {(requestsData as any)?.requests?.filter((r: any) => r.cancellationStatus === 'pending').length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Approved Today</p>
            <p className="text-2xl font-bold text-green-600">{(requestsData as any)?.approvedToday || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Refund Amount</p>
            <p className="text-2xl font-bold text-purple-600">
              ₦{(requestsData as any)?.totalRefundAmount?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading requests...</p>
          </div>
        ) : (requestsData as any)?.requests?.length > 0 ? (
          <div className="space-y-4">
            {(requestsData as any).requests
              .filter((request: any) => {
                // Filter out private chef bookings since they don't support cancellation
                const serviceCategory = request.serviceCategory || 
                  (typeof request.serviceId === 'object' ? request.serviceId.category : null);
                return serviceCategory?.toLowerCase() !== 'private chef';
              })
              .map((request: any) => (
              <div
                key={request._id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Service Image */}
                  <div className="w-full lg:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {request.serviceImages && request.serviceImages.length > 0 ? (
                      <img
                        src={request.serviceImages[0]}
                        alt={request.serviceName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Request Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{request.serviceName}</h3>
                        <p className="text-sm text-gray-500">Booking ID: {request._id.slice(-8)}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 flex items-center gap-1">
                        <Clock size={14} />
                        Pending Review
                      </span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Customer</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                          <User size={14} />
                          {request.userId?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Booking Dates</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                          <Calendar size={14} />
                          {format(new Date(request.checkInDate), 'MMM dd')} - {format(new Date(request.checkOutDate), 'MMM dd')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Refund Amount</p>
                        <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                          <DollarSign size={14} />
                          ₦{request.refundAmount?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Request Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(request.cancellationRequestedAt || request.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>

                    {/* Cancellation Reason */}
                    {request.cancellationReason && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-600 font-semibold mb-1">Cancellation Reason:</p>
                        <p className="text-sm text-gray-700">{request.cancellationReason}</p>
                      </div>
                    )}

                    {/* Policy Info */}
                    {request.cancellationPolicy && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-600 font-semibold mb-1">Cancellation Policy:</p>
                        <p className="text-sm text-gray-700">{request.cancellationPolicy.name}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Refund: {request.refundPercentage || 0}% of ₦{request.totalAmount?.toLocaleString()}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleOpenModal(request, 'approve')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle size={18} />
                        Approve Cancellation
                      </button>
                      <button
                        onClick={() => handleOpenModal(request, 'reject')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <XCircle size={18} />
                        Reject Request
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-500">No pending cancellation requests</p>
          </div>
        )}

        {/* Confirmation Modal */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {actionType === 'approve' ? 'Approve Cancellation' : 'Reject Request'}
              </h2>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Booking:</p>
                <p className="font-semibold text-gray-900">{selectedRequest.serviceName}</p>
                <p className="text-sm text-gray-600 mt-2">Refund Amount:</p>
                <p className="font-semibold text-green-600">₦{selectedRequest.refundAmount?.toLocaleString() || 0}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {actionType === 'approve' ? 'Notes (Optional)' : 'Reason for Rejection'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder={actionType === 'approve' ? 'Add any notes...' : 'Explain why this request is being rejected...'}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setNotes('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                    actionType === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50`}
                >
                  {approveMutation.isPending || rejectMutation.isPending
                    ? 'Processing...'
                    : actionType === 'approve'
                    ? 'Approve'
                    : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default CancellationRequests;
