import React from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { User, CreditCard, Star, Users, HelpCircle, Shield, FileText, LogOut, FileEdit as Edit, Gift } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Header from '../components/layout/Header'
import BottomNavigation from '../components/layout/BottomNavigation'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout, isLoading } = useAuth()

  if (!user && !isLoading) {
    return <Navigate to="/" replace />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  const menuItems = [
    { icon: Edit, label: 'Edit Profile', action: () => {} },
    { icon: CreditCard, label: 'Payment Methods', action: () => {} },
    { icon: Gift, label: 'Loyalty & Rewards', action: () => {} },
    { icon: Users, label: 'Invite Friends', action: () => {} },
    { icon: HelpCircle, label: 'Help & Support', action: () => {} },
    { icon: Shield, label: 'Privacy Policy', action: () => {} },
    { icon: FileText, label: 'Terms of Service', action: () => {} },
  ]

  const handleSignOut = async () => {
    try {
      await logout()
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Logout failed:', error)
      // Force navigation even if logout fails
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Profile" />

      <div className="container-padding py-6 space-y-6">
        {/* Profile Header */}
        <Card className="p-6 text-center">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-primary-500" />
            )}
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-1">{user?.name}</h2>
          <p className="text-gray-600 mb-3">{user?.email}</p>
          
          <div className="flex items-center justify-center">
            <Star className="w-4 h-4 text-accent-500 mr-1" />
            <span className="text-sm font-semibold">4.8 User Rating</span>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary-500 mb-1">
              1,250
            </div>
            <div className="text-sm text-gray-600">Loyalty Points</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary-500 mb-1">
              12
            </div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-accent-500 mb-1">
              Gold
            </div>
            <div className="text-sm text-gray-600">Member Status</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary-500 mb-1">
              3
            </div>
            <div className="text-sm text-gray-600">Referrals</div>
          </Card>
        </div>

        {/* Menu Items */}
        <Card className="overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <Icon className="w-5 h-5 text-gray-600" />
                <span className="flex-1 text-left font-medium text-gray-900">
                  {item.label}
                </span>
                <span className="text-gray-400">›</span>
              </button>
            )
          })}
        </Card>

        {/* Sign Out */}
        <Card>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full flex items-center justify-start space-x-4 p-4 hover:bg-red-50 transition-colors text-red-600"
          >
            <LogOut className="w-5 h-5" />
            <span className="flex-1 text-left font-medium">Sign Out</span>
          </Button>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  )
}

export default ProfilePage