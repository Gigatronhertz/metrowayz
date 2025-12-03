import React from 'react'
import { Shield } from 'lucide-react'
import Header from '../components/layout/Header'
import BottomNavigation from '../components/layout/BottomNavigation'
import Card from '../components/ui/Card'

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Privacy Policy" showBack />

      <div className="container-padding py-6 space-y-6">
        {/* Header */}
        <Card className="p-6 bg-primary-50 border border-primary-200">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-primary-900">Privacy Policy</h2>
          </div>
          <p className="text-primary-700">Last updated: December 2024</p>
        </Card>

        {/* Content */}
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Introduction</h3>
            <p className="text-gray-600 leading-relaxed">
              MetroWayz ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website, including all associated features and functionality.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Information We Collect</h3>
            <div className="space-y-3 text-gray-600">
              <p><strong>Personal Information:</strong> Name, email address, phone number, postal address, payment information, and profile information you provide during registration.</p>
              <p><strong>Booking Information:</strong> Details about your bookings, including dates, times, locations, and service preferences.</p>
              <p><strong>Device Information:</strong> Device type, operating system, unique device identifiers, and mobile network information.</p>
              <p><strong>Usage Information:</strong> Pages visited, features used, searches performed, and interactions with our platform.</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">3. How We Use Your Information</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Providing, maintaining, and improving our services</li>
              <li>• Processing your bookings and payments</li>
              <li>• Sending service-related announcements and updates</li>
              <li>• Responding to your inquiries and providing customer support</li>
              <li>• Personalizing your experience on our platform</li>
              <li>• Conducting research and analytics to improve our services</li>
              <li>• Complying with legal obligations</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Data Security</h3>
            <p className="text-gray-600 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Information Sharing</h3>
            <div className="space-y-3 text-gray-600">
              <p>We may share your information with:</p>
              <ul className="ml-4 space-y-2">
                <li>• Service providers who assist in our operations</li>
                <li>• Payment processors for transaction processing</li>
                <li>• Other users when necessary for service delivery</li>
                <li>• Legal authorities when required by law</li>
              </ul>
              <p>We do not sell, trade, or rent your personal information to third parties for their marketing purposes.</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Your Rights</h3>
            <p className="text-gray-600 mb-3">You have the right to:</p>
            <ul className="space-y-2 text-gray-600">
              <li>• Access your personal information</li>
              <li>• Correct inaccurate information</li>
              <li>• Request deletion of your information</li>
              <li>• Opt-out of marketing communications</li>
              <li>• Lodge complaints with relevant authorities</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Cookies and Tracking</h3>
            <p className="text-gray-600 leading-relaxed">
              We use cookies and similar tracking technologies to enhance your experience, remember your preferences, and analyze platform usage. You can control cookie settings through your browser preferences.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">8. Third-Party Links</h3>
            <p className="text-gray-600 leading-relaxed">
              Our platform may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">9. Children's Privacy</h3>
            <p className="text-gray-600 leading-relaxed">
              Our services are not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will delete the information promptly.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">10. Changes to This Policy</h3>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy periodically to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of significant changes by updating the date at the top of this policy.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">11. Contact Us</h3>
            <div className="space-y-2 text-gray-600">
              <p>If you have questions about this Privacy Policy, please contact us at:</p>
              <p className="mt-3">
                <strong>MetroWayz Support</strong><br />
                Email: privacy@metrowayz.com<br />
                Phone: +234 (0) 123 456 7890
              </p>
            </div>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}

export default PrivacyPolicyPage
