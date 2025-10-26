import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Menu } from 'lucide-react'
import Button from '../ui/Button'

interface HeaderProps {
  title?: string
  showBack?: boolean
  showNotifications?: boolean
  showMenu?: boolean
  showLogo?: boolean
  onMenuClick?: () => void
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  showNotifications = false,
  showMenu = false,
  showLogo = false,
  onMenuClick
}) => {
  const navigate = useNavigate()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          {showMenu && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="p-2"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          {showLogo && (
            <img
              src="/logo.svg"
              alt="MetroWayz"
              className="w-8 h-8 cursor-pointer"
              onClick={() => navigate('/')}
            />
          )}
          {title && (
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {showNotifications && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {/* Navigate to notifications */}}
              className="p-2 relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full"></span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header