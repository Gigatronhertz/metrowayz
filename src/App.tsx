import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import OnboardingPage from './pages/OnboardingPage'
import RoleSelectionPage from './pages/RoleSelectionPage'
import VendorLoginPage from './pages/VendorLoginPage'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import ServiceDetailsPage from './pages/ServiceDetailsPage'
import BookingPage from './pages/BookingPage'
import PaymentPage from './pages/PaymentPage'
import BookingsPage from './pages/BookingsPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'

// Vendor Pages
import VendorDashboard from './pages/vendor/VendorDashboard'
import VendorServices from './pages/vendor/VendorServices'
import VendorServiceForm from './pages/vendor/VendorServiceForm'
import VendorBookings from './pages/vendor/VendorBookings'
import VendorCalendar from './pages/vendor/VendorCalendar'
import VendorFinancial from './pages/vendor/VendorFinancial'
import VendorProfile from './pages/vendor/VendorProfile'
import VendorSettings from './pages/vendor/VendorSettings'
import VendorReviews from './pages/vendor/VendorReviews'

// Super Admin Pages
import SuperAdminLogin from './pages/super-admin/SuperAdminLogin'
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard'
import VendorsManagement from './pages/super-admin/VendorsManagement'
import BookingsManagement from './pages/super-admin/BookingsManagement'
import ServicesView from './pages/super-admin/ServicesView'
import CancellationRequests from './pages/super-admin/CancellationRequests'
import EventsManagement from './pages/super-admin/EventsManagement'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requireAuth={false}>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/select-role"
            element={
              <ProtectedRoute>
                <RoleSelectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor"
            element={
              <ProtectedRoute requireAuth={false}>
                <VendorLoginPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/search" 
            element={
              <ProtectedRoute>
                <SearchPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/service/:id" 
            element={
              <ProtectedRoute>
                <ServiceDetailsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/booking/:serviceId" 
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payment" 
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bookings" 
            element={
              <ProtectedRoute>
                <BookingsPage />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Vendor Routes */}
          <Route
            path="/vendor/dashboard"
            element={
              <ProtectedRoute>
                <VendorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/services"
            element={
              <ProtectedRoute>
                <VendorServices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/services/new"
            element={
              <ProtectedRoute>
                <VendorServiceForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/services/edit/:id"
            element={
              <ProtectedRoute>
                <VendorServiceForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/bookings"
            element={
              <ProtectedRoute>
                <VendorBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/calendar"
            element={
              <ProtectedRoute>
                <VendorCalendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/financial"
            element={
              <ProtectedRoute>
                <VendorFinancial />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/reviews"
            element={
              <ProtectedRoute>
                <VendorReviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/profile"
            element={
              <ProtectedRoute>
                <VendorProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/settings"
            element={
              <ProtectedRoute>
                <VendorSettings />
              </ProtectedRoute>
            }
          />

          {/* Super Admin Routes */}
          <Route
            path="/super-admin/login"
            element={
              <ProtectedRoute requireAuth={false}>
                <SuperAdminLogin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/dashboard"
            element={
              <ProtectedRoute>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/vendors"
            element={
              <ProtectedRoute>
                <VendorsManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/bookings"
            element={
              <ProtectedRoute>
                <BookingsManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/services"
            element={
              <ProtectedRoute>
                <ServicesView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/cancellations"
            element={
              <ProtectedRoute>
                <CancellationRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/events"
            element={
              <ProtectedRoute>
                <EventsManagement />
              </ProtectedRoute>
            }
          />

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </AuthProvider>
  )
}

export default App