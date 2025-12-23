import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import superAdminApi from '../../services/super-admin/superAdminApi';
import { useAuth } from '../../hooks/useAuth';

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [setupComplete, setSetupComplete] = useState(false);

  // Ensure super admin is set up in database on mount
  useEffect(() => {
    const ensureSetup = async () => {
      try {
        console.log('🔧 Ensuring Super Admin setup...');
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://metrowayz.onrender.com'}/auth/super-admin/ensure-setup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        console.log('✅ Super Admin setup result:', data);

        if (data.success) {
          setSetupComplete(true);
          if (data.action === 'created') {
            toast.success('Super Admin account initialized');
          } else if (data.action === 'updated') {
            toast.success('Super Admin role updated');
          }
        }
      } catch (error) {
        console.error('❌ Failed to ensure super admin setup:', error);
        toast.error('Failed to initialize Super Admin');
      }
    };

    ensureSetup();
  }, []);

  const mutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      superAdminApi.auth.login(email, password),
    onSuccess: async (data) => {
      console.log('✅ Super Admin Login Response:', data);
      console.log('✅ Token:', data.token);
      console.log('✅ User:', data.user);

      toast.success('Login successful!');
      await login(data.token, data.user);

      console.log('✅ Navigating to dashboard...');
      navigate('/super-admin/dashboard');
    },
    onError: (error: any) => {
      console.error('❌ Super Admin Login Error:', error);
      toast.error(error.message || 'Invalid credentials');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    // Trim whitespace from inputs
    const cleanedData = {
      email: formData.email.trim(),
      password: formData.password.trim()
    };

    console.log('🔐 Super Admin Login Attempt:', {
      email: cleanedData.email,
      passwordLength: cleanedData.password.length,
      expectedEmail: 'superadmin@metrowayz.com',
      expectedPassword: 'SuperAdmin@2024!'
    });

    mutation.mutate(cleanedData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary-500 rounded-full mb-4 shadow-sm">
            <img src="/logo.svg" alt="MetroWayz" className="w-12 h-12 brightness-0 invert" />
          </div>
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">MetroWayz</h1>
          <p className="text-secondary-600 text-lg font-semibold">Super Admin Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Administrator Login
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="superadmin@metrowayz.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Setup Status */}
            {!setupComplete && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-xs text-blue-800 font-medium">
                  Setting up Super Admin account...
                </p>
              </div>
            )}

            {setupComplete && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-800 font-medium text-center">
                  ✅ Super Admin account ready
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={mutation.isPending || !setupComplete}
              className="w-full bg-secondary-500 text-white py-3 rounded-lg font-semibold hover:bg-secondary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {mutation.isPending ? 'Logging in...' : !setupComplete ? 'Please wait...' : 'Login as Super Admin'}
            </button>
          </form>

          {/* Info Note */}
          <div className="mt-6 p-4 bg-secondary-50 border border-secondary-200 rounded-lg">
            <p className="text-xs text-secondary-800 text-center font-medium">
              🔒 This is a secure area. Only authorized super administrators can access this portal.
            </p>
          </div>

          {/* Default Credentials (for development) */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center font-mono mb-2">
              Default: superadmin@metrowayz.com / SuperAdmin@2024!
            </p>
            <button
              type="button"
              onClick={() => setFormData({
                email: 'superadmin@metrowayz.com',
                password: 'SuperAdmin@2024!'
              })}
              className="w-full text-xs px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-medium transition-colors"
            >
              Auto-Fill Credentials
            </button>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
