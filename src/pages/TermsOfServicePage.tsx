import React from 'react'
import { FileText } from 'lucide-react'
import MainHeader from '../components/layout/MainHeader'
import BottomNavigation from '../components/layout/BottomNavigation'
import Card from '../components/ui/Card'

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MainHeader />

      <div className="container-padding py-6 space-y-6">
        {/* Header */}
        <Card className="p-6 bg-primary-50 border border-primary-200">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-primary-900">Terms of Service</h2>
          </div>
          <p className="text-primary-700">Last updated: December 2024</p>
        </Card>

        {/* Content */}
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h3>
            <p className="text-gray-600 leading-relaxed">
              By accessing and using MetroWayz, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Use License</h3>
            <p className="text-gray-600 mb-3">Permission is granted to temporarily download one copy of the materials (information or software) on MetroWayz for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
            <ul className="space-y-2 text-gray-600 ml-4">
              <li>• Modify or copy the materials</li>
              <li>• Use the materials for any commercial purpose or for any public display</li>
              <li>• Attempt to decompile or reverse engineer any software contained on MetroWayz</li>
              <li>• Remove any copyright or other proprietary notations from the materials</li>
              <li>• Transfer the materials to another person or "mirror" the materials on any other server</li>
              <li>• Violate any applicable laws or regulations</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Disclaimer</h3>
            <p className="text-gray-600 leading-relaxed">
              The materials on MetroWayz are provided on an 'as is' basis. MetroWayz makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Limitations</h3>
            <p className="text-gray-600 leading-relaxed">
              In no event shall MetroWayz or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on MetroWayz, even if MetroWayz or an authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Accuracy of Materials</h3>
            <p className="text-gray-600 leading-relaxed">
              The materials appearing on MetroWayz could include technical, typographical, or photographic errors. MetroWayz does not warrant that any of the materials on MetroWayz are accurate, complete, or current. MetroWayz may make changes to the materials contained on MetroWayz at any time without notice.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Materials and Content</h3>
            <p className="text-gray-600 leading-relaxed">
              The materials on MetroWayz are protected by copyright law and international copyright treaties. MetroWayz grants you a limited license to reproduce and distribute material (documents, images, or links) on MetroWayz provided that: (a) you do not modify the materials; (b) you maintain all copyright and other proprietary notices; and (c) you do not use the materials for illegal purposes or in violation of these terms.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Limitations of Liability</h3>
            <p className="text-gray-600 leading-relaxed">
              In no case shall MetroWayz, its suppliers, or other related parties be liable for any damages, losses or causes of action including but not limited to, direct, indirect, incidental, special or consequential damages, loss of profits, or any other damages arising out of your use of or inability to use MetroWayz or the materials on MetroWayz.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">8. User Conduct</h3>
            <p className="text-gray-600 mb-3">You agree not to:</p>
            <ul className="space-y-2 text-gray-600 ml-4">
              <li>• Harass, threaten, embarrass, or cause distress or discomfort to any individual</li>
              <li>• Impersonate others or provide false information</li>
              <li>• Violate any applicable laws or regulations</li>
              <li>• Engage in any form of abuse, harassment, or discrimination</li>
              <li>• Attempt to gain unauthorized access to our systems</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">9. Booking and Payments</h3>
            <div className="space-y-3 text-gray-600">
              <p>By making a booking on MetroWayz, you agree to:</p>
              <ul className="ml-4 space-y-2">
                <li>• Provide accurate information</li>
                <li>• Pay the full amount for services booked</li>
                <li>• Comply with the cancellation and refund policies</li>
                <li>• Be responsible for any damages caused to service providers' property</li>
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">10. Cancellation and Refunds</h3>
            <p className="text-gray-600 leading-relaxed">
              Cancellations made 24 hours or more before the service date are eligible for full refunds. Cancellations made within 24 hours of the service may incur cancellation fees. Refunds are processed within 7-10 business days.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">11. Revisions</h3>
            <p className="text-gray-600 leading-relaxed">
              MetroWayz may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">12. Governing Law</h3>
            <p className="text-gray-600 leading-relaxed">
              These terms and conditions are governed by and construed in accordance with the laws of Nigeria, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">13. Contact Information</h3>
            <div className="space-y-2 text-gray-600">
              <p>If you have any questions about these Terms of Service, please contact us at:</p>
              <p className="mt-3">
                <strong>MetroWayz Legal</strong><br />
                Email: legal@metrowayz.com<br />
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

export default TermsOfServicePage
