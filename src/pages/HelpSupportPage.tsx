import React, { useState } from 'react'
import { HelpCircle, MessageSquare, Mail, Phone, ChevronDown, ChevronUp } from 'lucide-react'
import Header from '../components/layout/Header'
import BottomNavigation from '../components/layout/BottomNavigation'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

interface FAQItem {
  id: string
  question: string
  answer: string
}

const HelpSupportPage: React.FC = () => {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  })

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

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Thank you for your message! Our support team will get back to you soon.')
    setContactForm({ subject: '', message: '' })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Help & Support" showBack />

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

        {/* Contact Form */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Send us a Message</h2>
          
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={contactForm.subject}
                onChange={handleContactChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="What is your concern about?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                name="message"
                value={contactForm.message}
                onChange={handleContactChange}
                required
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Describe your issue or question..."
              />
            </div>

            <Button type="submit" className="w-full">
              Send Message
            </Button>
          </form>
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
