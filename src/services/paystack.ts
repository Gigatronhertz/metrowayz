import { paystackConfig } from '../config/paystack';

export interface PaystackPaymentData {
  email: string;
  amount: number; // Amount in kobo (smallest currency unit)
  reference?: string;
  metadata?: {
    bookingId?: string;
    serviceId?: string;
    serviceName?: string;
    userId?: string;
    userName?: string;
    custom_fields?: Array<{
      display_name: string;
      variable_name: string;
      value: string;
    }>;
  };
}

export interface PaystackConfig {
  email: string;
  amount: number;
  publicKey: string;
  reference?: string;
  currency?: string;
  channels?: string[];
  metadata?: any;
  onSuccess?: (reference: any) => void;
  onClose?: () => void;
}

// Convert amount from Naira to Kobo (Paystack expects amounts in kobo)
export const convertToKobo = (amountInNaira: number): number => {
  return Math.round(amountInNaira * 100);
};

// Convert amount from Kobo to Naira
export const convertFromKobo = (amountInKobo: number): number => {
  return amountInKobo / 100;
};

// Generate unique payment reference
export const generatePaymentReference = (prefix: string = 'MTW'): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `${prefix}_${timestamp}_${random}`;
};

// Build Paystack configuration for payment
export const buildPaystackConfig = (
  paymentData: PaystackPaymentData,
  onSuccess?: (reference: any) => void,
  onClose?: () => void
): PaystackConfig => {
  // Generate reference if not provided
  const reference = paymentData.reference || generatePaymentReference();

  // Merge metadata with default config
  const metadata = {
    ...paystackConfig.metadata,
    ...paymentData.metadata,
  };

  return {
    email: paymentData.email,
    amount: paymentData.amount, // Already in kobo
    publicKey: paystackConfig.publicKey,
    reference,
    currency: paystackConfig.currency,
    channels: paystackConfig.channels,
    metadata,
    onSuccess,
    onClose,
  };
};

// Verify payment on backend
export const verifyPayment = async (reference: string): Promise<any> => {
  // This should be called on your backend
  // For now, we'll just return the reference
  // You'll need to implement this on your backend API
  console.log('Payment reference to verify:', reference);
  return { reference, verified: true };
};

// Create payment record in your backend
export const createPaymentRecord = async (paymentData: {
  reference: string;
  bookingId: string;
  amount: number;
  status: string;
}): Promise<any> => {
  // This should call your backend API to store payment details
  console.log('Creating payment record:', paymentData);
  return paymentData;
};

export default {
  convertToKobo,
  convertFromKobo,
  generatePaymentReference,
  buildPaystackConfig,
  verifyPayment,
  createPaymentRecord,
};
