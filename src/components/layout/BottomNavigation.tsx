import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Search, Calendar, User } from 'lucide-react'
import { cn } from '../../utils/cn'

const BottomNavigation: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Calendar, label: 'Bookings', path: '/bookings' },
    { icon: User, label: 'Profile', path: '/profile' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname.startsWith(path)
          
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors',
                isActive
                  ? 'text-primary-500'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default BottomNavigation