import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  User, 
  CreditCard, 
  Star, 
  Users, 
  HelpCircle, 
  Shield, 
  FileText, 
  LogOut,
  Edit,
  Gift
} from 'lucide-react'
import { currentUser } from '../data/mockData'
import Header from '../components/layout/Header'
import BottomNavigation from '../components/layout/BottomNavigation'
import Card from '../components/ui/Card'

const ProfilePage: React.FC = () => {
  const navigate = useNavigate()

  const menuItems = [
    { icon: Edit, label: 'Edit Profile', action: () => {} },
    { icon: CreditCard, label: 'Payment Methods', action: () => {} },
    { icon: Gift, label: 'Loyalty & Rewards', action: () => {} },
    { icon: Users, label: 'Invite Friends', action: () => {} },
    { icon: HelpCircle, label: 'Help & Support', action: () => {} },
    { icon: Shield, label: 'Privacy Policy', action: () => {} },
    { icon: FileText, label: 'Terms of Service', action: () => {} },
  ]

  const handleSignOut = () => {
    // In a real app, you'd clear auth tokens, etc.
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Profile" />

      <div className="container-padding py-6 space-y-6">
        {/* Profile Header */}
        <Card className="p-6 text-center">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-primary-500" />
            )}
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-1">{currentUser.name}</h2>
          <p className="text-gray-600 mb-3">{currentUser.email}</p>
          
          <div className="flex items-center justify-center">
            <Star className="w-4 h-4 text-accent-500 mr-1" />
            <span className="text-sm font-semibold">{currentUser.rating} User Rating</span>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary-500 mb-1">
              {currentUser.loyaltyPoints.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Loyalty Points</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary-500 mb-1">
              {currentUser.totalBookings}
            </div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-accent-500 mb-1">
              {currentUser.membershipTier}
            </div>
            <div className="text-sm text-gray-600">Member Status</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary-500 mb-1">
              {currentUser.referrals}
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
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-4 p-4 hover:bg-red-50 transition-colors text-red-600"
          >
            <LogOut className="w-5 h-5" />
            <span className="flex-1 text-left font-medium">Sign Out</span>
          </button>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  )
}

export default ProfilePage