import React, { useState } from 'react'
import { HelpCircle, MessageSquare, Mail, Phone, ChevronDown, ChevronUp } from 'lucide-react'
import MainHeader from '../components/layout/MainHeader'
import BottomNavigation from '../components/layout/BottomNavigation'
import Card from '../components/ui/Card'


interface FAQItem {
  id: string
  question: string
  answer: string
}

const HelpSupportPage: React.FC = () => {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  const faqs: FAQItem[] = [
    {
      id: '1',
      question: 'How do I book a service?',
      answer: 'Browse available services, select your preferred date and time, add any special requests, and proceed to payment. You\'ll receive a confirmation email once your booking is confirmed.'
    },
    {
      id: '2',
      question: 'Can I cancel or reschedule my booking?',
      answer: 'You can cancel or reschedule bookings up to 24 hours before your service date. Cancellations made within 24 hours may be subject to fees.'
    },
    {
      id: '3',
      question: 'What payment methods do you accept?',
      answer: 'We accept various payment methods including credit/debit cards, bank transfers, and mobile money through our Paystack integration.'
    },
    {
      id: '4',
      question: 'How do I track my booking?',
      answer: 'Go to "My Bookings" in your profile to view all your active and past bookings with their current status.'
    },
    {
      id: '5',
      question: 'What is your refund policy?',
      answer: 'Refunds are processed based on cancellation timing. Cancellations made 24+ hours before service receive full refunds. Contact support for special circumstances.'
    },
    {
      id: '6',
      question: 'How do I leave a review?',
      answer: 'After your service is completed, you\'ll have the option to leave a review and rating. This helps other users find great services.'
    },
  ]

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MainHeader />

      <div className="container-padding py-6 space-y-6">
        {/* Contact Support Card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="w-6 h-6 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900">Contact Support</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">support@metrowayz.com</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-900">+234 (0) 123 456 7890</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Live Chat</p>
                <p className="font-medium text-gray-900">Available 9 AM - 6 PM</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Live Chat Card */}
        <Card className="p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Need Immediate Help?</h2>
          <p className="text-gray-600 mb-6">
            Chat with our support team instantly. Click the button below to open the live chat window.
          </p>
          <button
            onClick={() => {
              window.open(
                'https://tawk.to/chat/69798810324aa2197d408eeb/1jg1e88eo',
                'TawkToChat',
                'width=400,height=600,scrollbars=yes,resizable=yes'
              );
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Open Live Chat</span>
          </button>
        </Card>

        {/* FAQ Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <Card key={faq.id} className="overflow-hidden">
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-left font-medium text-gray-900">{faq.question}</span>
                  {expandedFAQ === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  )}
                </button>

                {expandedFAQ === faq.id && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}

export default HelpSupportPage
