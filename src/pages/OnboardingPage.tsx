import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import toast from 'react-hot-toast'

interface LoginForm {
  email: string
  password: string
}

interface SignUpForm extends LoginForm {
  name: string
  confirmPassword: string
}

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user, loginWithEmail } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [isVendorMode, setIsVendorMode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, watch } = useForm<SignUpForm>()

  React.useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = localStorage.getItem('redirectAfterAuth')

      if (redirectPath && redirectPath !== '/') {
        localStorage.removeItem('redirectAfterAuth')
        navigate(redirectPath, { replace: true })
      } else {
        let defaultRedirect = "/home"
        if (user?.role === 'seller') {
          defaultRedirect = "/vendor/dashboard"
        } else if (user?.role === 'admin') {
          defaultRedirect = "/super-admin/dashboard"
        }
        navigate(defaultRedirect, { replace: true })
      }
    }
  }, [isAuthenticated, user, navigate])

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true)
    setError(null)
    try {
      await loginWithEmail(data.email, data.password, data.name, !isLogin)
      
      if (isVendorMode) {
        navigate('/vendor/dashboard')
      } else {
        navigate('/home')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = () => {
    if (isVendorMode) {
      localStorage.setItem('redirectAfterAuth', '/vendor/dashboard')
      localStorage.setItem('loginIntent', 'vendor')
    }
    toast.success('Successfully signed in with Google!')
  }

  const handleGoogleError = (errorMessage: string) => {
    setError(errorMessage)
    toast.error(errorMessage)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4">
            <img src="/logo.svg" alt="MetroWayz" className="w-12 h-12 " />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to MetroWayz
          </h1>
          <p className="text-gray-600">
            Your lifestyle services in one place
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Vendor Mode Toggle */}
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {isVendorMode ? 'Vendor Login Mode' : 'Customer Login Mode'}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {isVendorMode ? 'Access vendor dashboard' : 'Book services and manage bookings'}
                </p>
              </div>
              <button
                onClick={() => setIsVendorMode(!isVendorMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  isVendorMode ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    isVendorMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-center font-semibold rounded-xl transition-colors ${
                isLogin
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-center font-semibold rounded-xl transition-colors ${
                !isLogin
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {!isLogin && (
              <Input
                label="Full Name"
                icon={<User className="w-5 h-5" />}
                {...register('name', { required: 'Name is required' })}
                error={errors.name?.message}
              />
            )}

            <Input
              label="Email"
              type="email"
              icon={<Mail className="w-5 h-5" />}
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Invalid email address'
                }
              })}
              error={errors.email?.message}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                icon={<Lock className="w-5 h-5" />}
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                error={errors.password?.message}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {!isLogin && (
              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                icon={<Lock className="w-5 h-5" />}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === watch('password') || 'Passwords do not match'
                })}
                error={errors.confirmPassword?.message}
              />
            )}

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <GoogleSignInButton
              className="mt-4"
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingPage
