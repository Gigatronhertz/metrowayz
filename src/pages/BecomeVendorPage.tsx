import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import vendorApi from '../services/vendor/vendorApi';
import toast from 'react-hot-toast';
import { Store, CheckCircle, Users, DollarSign, Calendar } from 'lucide-react';

const BecomeVendorPage = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [agreed, setAgreed] = useState(false);

  // Update profile mutation
  const mutation = useMutation({
    mutationFn: () => vendorApi.profile.updateProfile({
      // Update userType to 'both' or 'provider'
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
    if (!agreed) {
      toast.error('Please agree to the terms and conditions');
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">MetroWayz</h1>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900"
          >
            Back
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Store size={40} className="text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Become a MetroWayz Vendor
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of service providers earning money by sharing their services on MetroWayz
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <DollarSign size={24} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Earn Money</h3>
            <p className="text-gray-600">
              Get paid for your services. Set your own prices and keep 95% of your earnings.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Users size={24} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reach Customers</h3>
            <p className="text-gray-600">
              Connect with thousands of customers actively searching for services like yours.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Calendar size={24} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Flexible Schedule</h3>
            <p className="text-gray-600">
              Work when you want. You're in control of your availability and bookings.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg p-8 shadow-md mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What You Get</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Professional dashboard to manage your services',
              'Calendar view to track bookings',
              'Financial reports and analytics',
              'Secure payment processing',
              'Customer reviews and ratings',
              'Marketing and promotional tools',
              '24/7 vendor support',
              'Mobile-friendly management tools',
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                <p className="text-gray-700">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg p-8 shadow-md mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Sign Up</h3>
              <p className="text-sm text-gray-600">Complete your vendor registration in minutes</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Create Services</h3>
              <p className="text-sm text-gray-600">List your services with photos and descriptions</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Accept Bookings</h3>
              <p className="text-sm text-gray-600">Receive and approve booking requests</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-600">4</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Get Paid</h3>
              <p className="text-sm text-gray-600">Earn money for your services</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
          <p className="text-xl mb-6 opacity-90">
            Join MetroWayz today and turn your services into income
          </p>

          <div className="max-w-md mx-auto bg-white rounded-lg p-6 text-left">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 rounded text-blue-600"
              />
              <span className="text-sm text-gray-700">
                I agree to the{' '}
                <a href="#" className="text-blue-600 hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:underline">
                  Vendor Agreement
                </a>
                . I understand that MetroWayz will charge a 5% platform fee on all bookings.
              </span>
            </label>

            <button
              onClick={handleBecomeVendor}
              disabled={!agreed || mutation.isPending}
              className="w-full mt-6 bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? 'Processing...' : 'Become a Vendor'}
            </button>
          </div>
        </div>

        {/* FAQ Preview */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Have questions?{' '}
            <a href="#" className="text-blue-600 hover:underline font-medium">
              View our Vendor FAQ
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BecomeVendorPage;
