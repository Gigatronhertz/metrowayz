import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import SearchBar from '../common/SearchBar'

interface MainHeaderProps {
  showSearch?: boolean
}

const MainHeader: React.FC<MainHeaderProps> = ({ showSearch = true }) => {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`bg-white border-b border-gray-100 transition-all duration-500 z-50 ${
      isScrolled ? 'sticky top-0 shadow-md' : 'relative'
    }`}>
      <div className={`container-max transition-all duration-500 ${isScrolled ? 'py-3' : 'py-5 lg:py-6'}`}>
        {/* Mobile: Search bar replaces header when scrolled */}
        {isScrolled && showSearch ? (
          <div className="lg:hidden animate-fade-in">
            <SearchBar
              placeholder="Search services..."
              onFilterClick={() => navigate('/search')}
            />
          </div>
        ) : (
          <div className="lg:hidden flex items-center justify-between">
            {/* Mobile Logo */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/home')}>
              <img src="/logo.svg" alt="MetroWayz" className="w-12 h-12 transition-all" />
            </div>

            {/* Mobile Navigation */}
            <nav className="flex items-center gap-3">
              <button
                onClick={() => navigate('/vendor')}
                className="text-xs font-medium text-dark-700 hover:text-primary-600 transition-colors"
              >
                Vendor
              </button>
              {isAuthenticated ? (
                <button
                  onClick={() => logout()}
                  className="text-xs font-medium px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all duration-300 shadow-md"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => navigate('/')}
                  className="text-xs font-semibold px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl transition-all duration-300 shadow-md"
                >
                  Login
                </button>
              )}
            </nav>
          </div>
        )}

        {/* Desktop: Standard header with inline search */}
        <div className="hidden lg:flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/home')}>
            <img src="/logo.svg" alt="MetroWayz" className={`transition-all duration-500 ${
              isScrolled ? 'w-10 h-10' : 'w-14 h-14'
            }`} />
            <div className={`transition-all duration-500 ${isScrolled ? 'opacity-0 w-0' : 'opacity-100'}`}>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                MetroWayz
              </h1>
              <p className="text-xs text-gray-600 font-medium">
                Premium Lifestyle Services
              </p>
            </div>
          </div>

          {/* Desktop Sticky Search Bar */}
          {isScrolled && showSearch && (
            <div className="flex-1 max-w-xl mx-8 animate-fade-in">
              <SearchBar
                placeholder="Search services..."
                onFilterClick={() => navigate('/search')}
              />
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="flex items-center gap-6">
            <button
              onClick={() => navigate('/home')}
              className="text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors flex items-center gap-2"
            >
              Home
            </button>
            <button
              onClick={() => navigate('/search')}
              className="text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors flex items-center gap-2"
            >
              Search
            </button>
            <button
              onClick={() => navigate('/bookings')}
              className="text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors flex items-center gap-2"
            >
              Bookings
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors flex items-center gap-2"
            >
              Profile
            </button>
            <button
              onClick={() => navigate('/vendor')}
              className="text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors"
            >
              Become a Vendor
            </button>
          </nav>

          {/* Desktop Right Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2.5 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-700" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full"></span>
            </button>
            {isAuthenticated ? (
              <button
                onClick={() => logout()}
                className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default MainHeader
