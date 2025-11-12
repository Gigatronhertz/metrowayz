import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import { Store, Users, DollarSign, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const VendorLoginPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Store that this is a vendor login attempt and where to redirect
    localStorage.setItem('loginIntent', 'vendor');
    localStorage.setItem('redirectAfterAuth', '/vendor/dashboard');

    // If already logged in, redirect to vendor dashboard
    if (user) {
      navigate('/vendor/dashboard');
    }
  }, [user, navigate]);

  const handleGoogleSignIn = () => {
    // Ensure redirect path is set before OAuth
    localStorage.setItem('redirectAfterAuth', '/vendor/dashboard');
    localStorage.setItem('loginIntent', 'vendor');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Vendor Portal
          </h1>
          <p className="text-gray-600">
            Sign in to manage your services and bookings
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
                <h3 className="font-semibold text-gray-900">Manage Earnings</h3>
                <p className="text-sm text-gray-600">Track your revenue and payouts</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-secondary-100 rounded-full p-2 mt-1">
                <Users size={20} className="text-secondary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Handle Bookings</h3>
                <p className="text-sm text-gray-600">Approve and manage customer bookings</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary-100 rounded-full p-2 mt-1">
                <Calendar size={20} className="text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Calendar View</h3>
                <p className="text-sm text-gray-600">See your schedule at a glance</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Sign in with Google</span>
              </div>
            </div>

            <div onClick={handleGoogleSignIn}>
              <GoogleSignInButton
                onSuccess={() => {
                  toast.success('Successfully signed in!');
                  navigate('/vendor/dashboard');
                }}
                onError={(error) => {
                  toast.error(error);
                }}
              />
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Back to home
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          New to MetroWayz? Sign in with Google to get started as a vendor
        </div>
      </div>
    </div>
  );
};

export default VendorLoginPage;
