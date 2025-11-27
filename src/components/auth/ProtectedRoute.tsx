import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo
}) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    // Store the intended destination
    localStorage.setItem('redirectAfterAuth', location.pathname + location.search)

    // Redirect to login page
    return <Navigate to="/" state={{ from: location }} replace />
  }

  if (!requireAuth && isAuthenticated && location.pathname === '/') {
    // Only redirect authenticated users away from the login page
    // Check if there's a stored redirect path
    const redirectPath = localStorage.getItem('redirectAfterAuth')

    if (redirectPath && redirectPath !== '/') {
      localStorage.removeItem('redirectAfterAuth')
      return <Navigate to={redirectPath} replace />
    }

// Default redirect for authenticated users on login page
    // Check user role to determine correct redirect
    let defaultRedirect = "/home"
    if (user?.role === 'seller') {
      defaultRedirect = "/vendor/dashboard"
    } else if (user?.role === 'admin') {
      defaultRedirect = "/super-admin/dashboard"
    }
    
    return <Navigate to={redirectTo || defaultRedirect} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute