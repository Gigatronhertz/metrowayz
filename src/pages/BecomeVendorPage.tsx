import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import vendorApi from '../services/vendor/vendorApi';
import toast from 'react-hot-toast';
import { Store, Users, DollarSign, Calendar, ArrowRight } from 'lucide-react';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';

const BecomeVendorPage = () => {
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();

  // Update profile mutation
  const mutation = useMutation({
    mutationFn: () => vendorApi.profile.updateProfile({
      businessName: '',
    }),
    onSuccess: async () => {
      toast.success('Welcome to the vendor platform!');
      await refreshUser();
      navigate('/vendor/dashboard');
    },
    onError: () => {
      toast.error('Failed to register as vendor');
    },
  });

  const handleBecomeVendor = () => {
    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Become a Vendor
          </h1>
          <p className="text-gray-600">
            Join MetroWayz and start earning with your services
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Benefits */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="bg-primary-100 rounded-full p-2 mt-1">
                <DollarSign size={20} className="text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Earn Money</h3>
                <p className="text-sm text-gray-600">Set your prices and keep 95% of earnings</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-secondary-100 rounded-full p-2 mt-1">
                <Users size={20} className="text-secondary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Reach Customers</h3>
                <p className="text-sm text-gray-600">Connect with thousands of active customers</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary-100 rounded-full p-2 mt-1">
                <Calendar size={20} className="text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Flexible Schedule</h3>
                <p className="text-sm text-gray-600">Work when you want, you're in control</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            {user ? (
              <button
                onClick={handleBecomeVendor}
                disabled={mutation.isPending}
                className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-8 py-3 rounded-lg font-bold hover:from-primary-600 hover:to-secondary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {mutation.isPending ? 'Processing...' : (
                  <>
                    Get Started
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            ) : (
              <>
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Sign in to continue</span>
                  </div>
                </div>

                <GoogleSignInButton
                  onSuccess={() => {
                    toast.success('Successfully signed in! You can now become a vendor.');
                  }}
                  onError={(error) => {
                    toast.error(error);
                  }}
                />
              </>
            )}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Back to previous page
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          By becoming a vendor, you agree to our{' '}
          <a href="#" className="text-primary-600 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-secondary-600 hover:underline">Vendor Agreement</a>
        </div>
      </div>
    </div>
  );
};

export default BecomeVendorPage;
