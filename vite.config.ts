import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    headers: {
      // Security Headers for Development Server
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(self), microphone=(), camera=(), payment=(self), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.paystack.co https://www.google.com https://accounts.google.com https://www.gstatic.com https://embed.tawk.to https://*.tawk.to; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.tawk.to; font-src 'self' https://fonts.gstatic.com https://*.tawk.to data:; img-src 'self' data: https: blob: https://*.tawk.to; connect-src 'self' https://api.paystack.co http://localhost:3000 https://metrowayz.onrender.com https://accounts.google.com https://www.google.com ws://localhost:3000 https://*.tawk.to wss://*.tawk.to; frame-src 'self' https://js.paystack.co https://checkout.paystack.com https://accounts.google.com https://*.tawk.to; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self';"
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})