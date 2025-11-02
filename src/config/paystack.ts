// Paystack configuration
export const paystackConfig = {
  publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',

  // Paystack currency (NGN for Nigeria)
  currency: 'NGN',

  // Payment channels to support
  channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],

  // Metadata for tracking payments
  metadata: {
    custom_fields: [
      {
        display_name: 'Platform',
        variable_name: 'platform',
        value: 'MetroWayz',
      },
    ],
  },
};

// Validate that Paystack public key is configured
export const isPaystackConfigured = (): boolean => {
  return paystackConfig.publicKey !== '' &&
         paystackConfig.publicKey !== 'pk_test_your_paystack_public_key_here';
};

// Get Paystack public key
export const getPaystackPublicKey = (): string => {
  if (!isPaystackConfigured()) {
    console.warn('Paystack public key is not configured. Please set VITE_PAYSTACK_PUBLIC_KEY in your .env file');
  }
  return paystackConfig.publicKey;
};
