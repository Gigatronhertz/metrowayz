# MetroWayz - React Web App

A modern lifestyle services platform built with React, TypeScript, and Tailwind CSS. Book car rentals, accommodations, private chefs, food delivery, and entertainment services all in one place.

## 🚀 Features

- **Multi-Service Platform**: Car rentals, short-let accommodations, private chefs, food delivery, and entertainment
- **Modern UI/UX**: Clean, mobile-first design with smooth animations
- **Booking System**: Complete booking flow with date selection, guest management, and payment processing
- **User Management**: Profile management, booking history, and loyalty points
- **Search & Filters**: Advanced search with category filters and sorting options
- **Responsive Design**: Optimized for mobile, tablet, and desktop

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for state management
- **React Hook Form** for form handling
- **Framer Motion** for animations
- **Lucide React** for icons
- **Vite** for build tooling

## 📱 Pages

- **Onboarding** - Login/signup with Google integration
- **Home** - Service categories, featured services, and promotions
- **Search** - Service discovery with filters and sorting
- **Service Details** - Detailed service information with image gallery
- **Booking** - Complete booking flow with date/guest selection
- **Payment** - Secure payment processing with multiple methods
- **My Bookings** - Booking management and history
- **Profile** - User profile and account settings

## 🎨 Design System

- **Primary Color**: #FF5A5F (Coral Red)
- **Secondary Color**: #00A699 (Teal)
- **Accent Color**: #FFB400 (Amber)
- **Typography**: Inter font family
- **Components**: Reusable UI components with consistent styling

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview production build**:
   ```bash
   npm run preview
   ```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Input, Card, etc.)
│   ├── layout/         # Layout components (Header, Navigation)
│   └── common/         # Common components (ServiceCard, SearchBar)
├── pages/              # Page components
├── types/              # TypeScript type definitions
├── data/               # Mock data and constants
├── utils/              # Utility functions
└── styles/             # Global styles and Tailwind config
```

## 🔧 Key Features Implementation

### Service Booking Flow
1. Browse services by category
2. View detailed service information
3. Select dates and number of guests
4. Add special requests
5. Choose payment method
6. Complete booking with confirmation

### Payment Integration
- Multiple payment methods (Wallet, Card, Bank Transfer)
- Secure payment processing simulation
- Payment confirmation and receipt

### User Experience
- Mobile-first responsive design
- Smooth page transitions
- Loading states and error handling
- Optimistic UI updates

## 🎯 Future Enhancements

- Real payment gateway integration (Paystack/Flutterwave)
- Push notifications
- Real-time chat with service providers
- Advanced filtering and search
- Social authentication
- Progressive Web App (PWA) features
- Offline support

## 📄 License

This project is licensed under the MIT License.