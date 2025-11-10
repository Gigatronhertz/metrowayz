import VendorLayout from '../../components/vendor/VendorLayout';
import { Star } from 'lucide-react';

const VendorReviews = () => {
  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reviews & Ratings</h1>
          <p className="text-gray-500 mt-1">Manage customer feedback</p>
        </div>

        {/* Reviews Placeholder */}
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Star size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-500">
            Reviews from customers will appear here once they complete their bookings.
          </p>
        </div>
      </div>
    </VendorLayout>
  );
};

export default VendorReviews;
