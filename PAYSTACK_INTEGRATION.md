# Paystack Payment Integration Guide

This guide explains how to configure and use the Paystack payment integration in your MetroWayz application.

## Table of Contents
1. [Overview](#overview)
2. [Getting Your Paystack API Keys](#getting-your-paystack-api-keys)
3. [Configuration](#configuration)
4. [Testing the Integration](#testing-the-integration)
5. [Backend Requirements](#backend-requirements)
6. [Going Live](#going-live)
7. [Troubleshooting](#troubleshooting)

## Overview

The Paystack integration has been set up in your application with the following features:

- **Multiple Payment Methods**: Card, Bank Transfer, USSD, QR, Mobile Money
- **Free Booking Option**: Users can still book without payment
- **Secure Payment Flow**: Payment happens before booking confirmation
- **Reference Tracking**: Every payment has a unique reference
- **Metadata**: Booking and user information is attached to each payment

## Getting Your Paystack API Keys

### Step 1: Create/Login to Your Paystack Account
1. Go to [https://dashboard.paystack.com/signup](https://dashboard.paystack.com/signup)
2. Sign up or log in to your account

### Step 2: Get Your Public Key
1. Navigate to **Settings** > **API Keys & Webhooks**
2. You'll see two types of keys:
   - **Test Keys** (pk_test_xxx): For development and testing
   - **Live Keys** (pk_live_xxx): For production use

### Step 3: Copy Your Public Key
- For development: Copy the **Test Public Key** (starts with `pk_test_`)
- For production: Copy the **Live Public Key** (starts with `pk_live_`)

**Important**: Never share your Secret Key publicly or commit it to version control!

## Configuration

### Step 1: Update Your Environment Variables

Open your `.env` file and replace the placeholder with your actual Paystack public key:

```env
# For Development (Testing)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_actual_test_key_here

# For Production (Live)
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_actual_live_key_here
```

### Step 2: Restart Your Development Server

After updating the `.env` file, restart your development server:

```bash
npm run dev
```

### Step 3: Verify Configuration

The integration will automatically detect if Paystack is properly configured. If configured correctly:
- Users will see a "Pay with Paystack" option on the payment page
- If not configured, only the "Free Booking" option will appear

## Testing the Integration

### Using Test Mode

Paystack provides test cards for testing your integration:

**Test Card Details:**
- **Card Number**: 4084 0840 8408 4081
- **Expiry Date**: Any future date (e.g., 12/25)
- **CVV**: 408
- **PIN**: 0000
- **OTP**: 123456

**Test Bank Account:**
- **Bank**: Any bank
- **Account Number**: 0123456789

### Testing Flow

1. Navigate to the booking page in your application
2. Select a service and dates
3. Proceed to payment
4. Select "Pay with Paystack"
5. Use the test card details above
6. Complete the payment flow
7. Verify the booking is created after successful payment

### Viewing Test Transactions

1. Go to [https://dashboard.paystack.com/transactions](https://dashboard.paystack.com/transactions)
2. You'll see all test transactions listed
3. Click on any transaction to see details including metadata

## Backend Requirements

To complete the Paystack integration, your backend needs to implement the following endpoints:

### 1. Payment Verification Endpoint

```
POST /api/payments/verify/:reference
```

This endpoint should:
- Verify the payment with Paystack's API using your Secret Key
- Confirm the payment amount matches the booking amount
- Update the booking status to "confirmed" if payment is successful
- Store the payment record in your database

**Example Implementation (Node.js):**

```javascript
const https = require('https');

const verifyPayment = async (reference) => {
  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: `/transaction/verify/${reference}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(JSON.parse(data));
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.end();
  });
};
```

### 2. Webhook Endpoint (Recommended)

```
POST /api/payments/paystack/webhook
```

Paystack can send webhook notifications for payment events. This is the most reliable way to confirm payments.

**Setup Steps:**
1. Go to **Settings** > **API Keys & Webhooks** in your Paystack dashboard
2. Add your webhook URL: `https://yourdomain.com/api/payments/paystack/webhook`
3. Verify webhook signature for security

**Example Webhook Handler:**

```javascript
const crypto = require('crypto');

app.post('/api/payments/paystack/webhook', (req, res) => {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash === req.headers['x-paystack-signature']) {
    const event = req.body;

    if (event.event === 'charge.success') {
      // Payment was successful
      const reference = event.data.reference;
      const amount = event.data.amount;

      // Update booking status in your database
      // ...
    }
  }

  res.sendStatus(200);
});
```

### 3. Payment History Endpoint (Optional)

```
GET /api/payments/history
```

Returns the user's payment history for display in the app.

## Files Created/Modified

The integration added/modified the following files:

### New Files:
- `src/config/paystack.ts` - Paystack configuration
- `src/services/paystack.ts` - Payment utility functions
- `PAYSTACK_INTEGRATION.md` - This documentation

### Modified Files:
- `src/pages/PaymentPage.tsx` - Updated with Paystack payment option
- `src/services/api.ts` - Added payment API endpoints
- `.env` - Added Paystack public key
- `.env.example` - Added Paystack configuration example
- `package.json` - Added react-paystack dependency

## Going Live

### Checklist Before Going Live:

1. **Test Thoroughly**
   - [ ] Test successful payments
   - [ ] Test failed payments
   - [ ] Test payment cancellation
   - [ ] Verify booking creation after payment
   - [ ] Check payment metadata is correct

2. **Update Configuration**
   - [ ] Replace test public key with live public key in `.env`
   - [ ] Ensure backend uses live secret key in production
   - [ ] Update webhook URL to production URL

3. **Verify Business Information**
   - [ ] Complete KYC verification in Paystack dashboard
   - [ ] Add business details
   - [ ] Set up settlement account

4. **Security**
   - [ ] Never commit secret keys to version control
   - [ ] Use environment variables for all keys
   - [ ] Implement webhook signature verification
   - [ ] Validate payment amounts on backend

5. **Monitoring**
   - [ ] Set up transaction monitoring in Paystack dashboard
   - [ ] Configure email notifications for successful payments
   - [ ] Set up error logging for failed payments

## Troubleshooting

### Payment Option Not Showing

**Issue**: "Pay with Paystack" option doesn't appear on the payment page.

**Solutions**:
1. Verify `VITE_PAYSTACK_PUBLIC_KEY` is set in `.env` file
2. Ensure the key doesn't contain the placeholder text
3. Restart your development server after updating `.env`
4. Check browser console for any errors

### Payment Popup Not Opening

**Issue**: Clicking pay button doesn't open Paystack popup.

**Solutions**:
1. Check if user is logged in (email is required)
2. Verify the public key is valid
3. Check browser console for errors
4. Ensure popup blockers are disabled

### Payment Successful But Booking Not Created

**Issue**: Payment completes but booking isn't created.

**Solutions**:
1. Check browser console for booking creation errors
2. Verify backend API endpoints are working
3. Check if availability check is passing
4. Review backend logs for errors

### Test Card Not Working

**Issue**: Test card is declined.

**Solutions**:
1. Ensure you're using the correct test card: 4084 0840 8408 4081
2. Verify you're using a test public key (pk_test_xxx)
3. Try a different test card from [Paystack test cards](https://paystack.com/docs/payments/test-payments/)

## Support

### Paystack Support
- Documentation: [https://paystack.com/docs](https://paystack.com/docs)
- Support Email: support@paystack.com
- Twitter: [@PaystackHQ](https://twitter.com/PaystackHQ)

### Integration Support
For issues specific to this integration, check:
1. Browser console for frontend errors
2. Backend logs for API errors
3. Paystack dashboard for transaction details

## Additional Resources

- [Paystack API Reference](https://paystack.com/docs/api/)
- [React Paystack Documentation](https://github.com/iamraphson/react-paystack)
- [Paystack Test Cards](https://paystack.com/docs/payments/test-payments/)
- [Paystack Webhooks](https://paystack.com/docs/payments/webhooks/)

## Summary

You now have a fully integrated Paystack payment system! To get started:

1. Get your Paystack public key from the dashboard
2. Add it to your `.env` file
3. Restart your development server
4. Test with the provided test card
5. Implement backend verification endpoints
6. Go live when ready!

If you have any questions or run into issues, refer to the troubleshooting section or reach out to Paystack support.
