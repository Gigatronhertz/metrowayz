import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Package, ShoppingBag, ArrowRight } from 'lucide-react';

const RoleSelectionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleRoleSelection = (role: 'customer' | 'provider') => {
    if (role === 'customer') {
      navigate('/home');
    } else {
      navigate('/vendor/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-lg text-gray-600">Choose how you'd like to continue</p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Card */}
          <button
            onClick={() => handleRoleSelection('customer')}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 text-left group"
          >
            <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
              <ShoppingBag size={32} className="text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse Services</h2>
            <p className="text-gray-600 mb-4">
              Discover and book amazing services from verified providers across Nigeria.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center text-sm text-gray-600">
                <ArrowRight size={16} className="text-primary-600 mr-2" />
                Search and filter services
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <ArrowRight size={16} className="text-primary-600 mr-2" />
                Book instantly
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <ArrowRight size={16} className="text-primary-600 mr-2" />
                Track your bookings
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <ArrowRight size={16} className="text-primary-600 mr-2" />
                Leave reviews
              </li>
            </ul>
            <div className="flex items-center text-primary-600 font-semibold group-hover:gap-3 transition-all">
              Continue as Customer
              <ArrowRight size={20} className="ml-2 group-hover:translate-x-2 transition-transform" />
            </div>
          </button>

          {/* Provider Card */}
          <button
            onClick={() => handleRoleSelection('provider')}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 text-left group"
          >
            <div className="bg-secondary-100 rounded-full w-16 h-16 flex items-center justify-center mb-4 group-hover:bg-secondary-200 transition-colors">
              <Package size={32} className="text-secondary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Vendor Portal</h2>
            <p className="text-gray-600 mb-4">
              Manage your services, bookings, and grow your business on MetroWayz.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center text-sm text-gray-600">
                <ArrowRight size={16} className="text-secondary-600 mr-2" />
                Create and manage services
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <ArrowRight size={16} className="text-secondary-600 mr-2" />
                Accept bookings
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <ArrowRight size={16} className="text-secondary-600 mr-2" />
                Track earnings
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <ArrowRight size={16} className="text-secondary-600 mr-2" />
                Analytics dashboard
              </li>
            </ul>
            <div className="flex items-center text-secondary-600 font-semibold group-hover:gap-3 transition-all">
              Continue as Vendor
              <ArrowRight size={20} className="ml-2 group-hover:translate-x-2 transition-transform" />
            </div>
          </button>
        </div>

        {/* Info Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            You can switch between customer and vendor modes anytime from your profile
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
