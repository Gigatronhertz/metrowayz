// Temporary debug component - you can delete this after testing
import React from 'react';
import { isPaystackConfigured, getPaystackPublicKey } from '../config/paystack';

const PaymentDebug: React.FC = () => {
  const publicKey = getPaystackPublicKey();
  const isConfigured = isPaystackConfigured();

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Paystack Configuration Debug</h2>
      <div style={{ marginTop: '20px' }}>
        <p><strong>Public Key:</strong> {publicKey || 'NOT SET'}</p>
        <p><strong>Is Configured:</strong> {isConfigured ? '✅ YES' : '❌ NO'}</p>
        <p><strong>Key Length:</strong> {publicKey.length}</p>
        <p><strong>Starts with pk_test_:</strong> {publicKey.startsWith('pk_test_') ? 'YES' : 'NO'}</p>
        <p><strong>Environment Variable:</strong> {import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'NOT FOUND'}</p>
      </div>
    </div>
  );
};

export default PaymentDebug;
