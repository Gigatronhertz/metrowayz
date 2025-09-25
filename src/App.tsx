import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import OnboardingPage from './pages/OnboardingPage'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import ServiceDetailsPage from './pages/ServiceDetailsPage'
import BookingPage from './pages/BookingPage'
import PaymentPage from './pages/PaymentPage'
import BookingsPage from './pages/BookingsPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<OnboardingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/service/:id" element={<ServiceDetailsPage />} />
        <Route path="/booking/:serviceId" element={<BookingPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
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
  )
}

export default App