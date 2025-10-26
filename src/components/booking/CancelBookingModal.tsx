import React, { useState, useEffect } from 'react'
import { X, AlertCircle, DollarSign } from 'lucide-react'
import { bookingAPI } from '../../services/api'
import Button from '../ui/Button'

interface CancelBookingModalProps {
  isOpen: boolean
  onClose: () => void
  bookingId: string
  bookingDetails: {
    serviceName: string
    checkInDate: Date
    totalAmount: number
  }
  onSuccess: () => void
}

const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  bookingDetails,
  onSuccess
}) => {
  const [reason, setReason] = useState('')
  const [reasonCategory, setReasonCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  const reasonCategories = [
    { value: 'change_of_plans', label: 'Change of plans' },
    { value: 'found_alternative', label: 'Found a better alternative' },
    { value: 'emergency', label: 'Emergency or personal reasons' },
    { value: 'service_issue', label: 'Issue with the service' },
    { value: 'other', label: 'Other' }
  ]

  useEffect(() => {
    if (isOpen) {
      loadCancellationPreview()
    }
  }, [isOpen, bookingId])

  const loadCancellationPreview = async () => {
    try {
      setLoadingPreview(true)
      const response = await bookingAPI.getCancellationPreview(bookingId)
      setPreview(response.data)
    } catch (error) {
      console.error('Error loading cancellation preview:', error)
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleCancel = async () => {
    if (!reasonCategory) {
      alert('Please select a cancellation reason')
      return
    }

    try {
      setLoading(true)
      await bookingAPI.cancelBooking(bookingId, reason, reasonCategory)
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error cancelling booking:', error)
      alert(error.message || 'Failed to cancel booking')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Cancel Booking</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning */}
          <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">Before you cancel</h3>
              <p className="text-sm text-amber-800">
                Make sure you understand the cancellation policy and refund terms below.
              </p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-900">Booking Details</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium text-gray-900">{bookingDetails.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check-in:</span>
                <span className="font-medium text-gray-900">
                  {new Date(bookingDetails.checkInDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Paid:</span>
                <span className="font-medium text-gray-900">
                  ₦{bookingDetails.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Refund Preview */}
          {loadingPreview ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">Calculating refund...</p>
            </div>
          ) : preview ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Refund Information</h3>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-800">Cancellation Policy:</span>
                  <span className="font-medium text-blue-900">{preview.policy?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Refund Percentage:</span>
                  <span className="font-medium text-blue-900">{preview.refund?.refundPercentage}%</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span className="text-blue-900">Total Refund:</span>
                  <span className="text-blue-900">
                    ₦{preview.refund?.totalRefund?.toLocaleString()}
                  </span>
                </div>
              </div>

              {preview.refund?.description && (
                <p className="text-xs text-blue-700 mt-2">{preview.refund.description}</p>
              )}
            </div>
          ) : null}

          {/* Reason Category */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Reason for cancellation <span className="text-red-500">*</span>
            </label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
            >
              <option value="">Select a reason</option>
              {reasonCategories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Additional details (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide any additional information about your cancellation..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Keep Booking
          </Button>
          <Button
            variant="primary"
            onClick={handleCancel}
            isLoading={loading}
            disabled={loading || !reasonCategory}
            className="bg-red-500 hover:bg-red-600"
          >
            Confirm Cancellation
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CancelBookingModal
