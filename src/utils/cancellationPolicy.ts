// Cancellation Policy Utilities

export interface CancellationPolicy {
  name: string;
  description: string;
  hoursRequired: number;
  refundPercentage: number;
}

export interface RefundCalculation {
  refundAmount: number;
  refundPercentage: number;
  policyName: string;
  hoursUntilCheckIn: number;
  description: string;
  isEligibleForRefund: boolean;
}

// Define cancellation policies
export const CANCELLATION_POLICIES: Record<string, CancellationPolicy> = {
  '24_hours': {
    name: '24-hour cancellation policy',
    description: 'Full refund if cancelled at least 24 hours before check-in',
    hoursRequired: 24,
    refundPercentage: 100
  },
  '48_hours': {
    name: '48-hour cancellation policy',
    description: 'Full refund if cancelled at least 48 hours before check-in',
    hoursRequired: 48,
    refundPercentage: 100
  },
  '72_hours': {
    name: '72-hour cancellation policy',
    description: 'Full refund if cancelled at least 72 hours before check-in',
    hoursRequired: 72,
    refundPercentage: 100
  },
  'flexible': {
    name: 'Flexible cancellation policy',
    description: 'Full refund if cancelled 24+ hours before, 50% refund if cancelled 12-24 hours before',
    hoursRequired: 24,
    refundPercentage: 100
  },
  'strict': {
    name: 'Strict cancellation policy',
    description: '50% refund if cancelled 72+ hours before, no refund otherwise',
    hoursRequired: 72,
    refundPercentage: 50
  }
};

// Calculate refund based on cancellation policy
export const calculateRefund = (
  totalAmount: number,
  checkInDate: Date,
  cancellationPolicy: string = '24_hours'
): RefundCalculation => {
  const now = new Date();
  const checkIn = new Date(checkInDate);
  const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  const policy = CANCELLATION_POLICIES[cancellationPolicy] || CANCELLATION_POLICIES['24_hours'];
  let refundPercentage = 0;
  let description = '';
  
  switch (cancellationPolicy) {
    case '24_hours':
    case '48_hours':
    case '72_hours':
      if (hoursUntilCheckIn >= policy.hoursRequired) {
        refundPercentage = 100;
        description = `Full refund - Cancellation made more than ${policy.hoursRequired} hours before check-in.`;
      } else {
        description = `No refund - Cancellation made less than ${policy.hoursRequired} hours before check-in.`;
      }
      break;
      
    case 'flexible':
      if (hoursUntilCheckIn >= 24) {
        refundPercentage = 100;
        description = 'Full refund - Cancellation made more than 24 hours before check-in.';
      } else if (hoursUntilCheckIn >= 12) {
        refundPercentage = 50;
        description = 'Partial refund - Cancellation made 12-24 hours before check-in.';
      } else {
        description = 'No refund - Cancellation made less than 12 hours before check-in.';
      }
      break;
      
    case 'strict':
      if (hoursUntilCheckIn >= 72) {
        refundPercentage = 50;
        description = 'Partial refund - Cancellation made more than 72 hours before check-in.';
      } else {
        description = 'No refund - Cancellation made less than 72 hours before check-in.';
      }
      break;
      
    default:
      if (hoursUntilCheckIn >= 24) {
        refundPercentage = 100;
        description = 'Full refund - Cancellation made more than 24 hours before check-in.';
      } else {
        description = 'No refund - Cancellation made less than 24 hours before check-in.';
      }
  }
  
  const refundAmount = (totalAmount * refundPercentage) / 100;
  
  return {
    refundAmount,
    refundPercentage,
    policyName: policy.name,
    hoursUntilCheckIn: Math.max(0, hoursUntilCheckIn),
    description,
    isEligibleForRefund: refundPercentage > 0
  };
};

// Format hours until check-in
export const formatHoursUntilCheckIn = (hours: number): string => {
  if (hours <= 0) return 'Past check-in time';
  
  const days = Math.floor(hours / 24);
  const remainingHours = Math.floor(hours % 24);
  
  if (days > 0) {
    if (remainingHours > 0) {
      return `${days} day${days > 1 ? 's' : ''} and ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
    }
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  
  return `${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
};

// Check if cancellation is allowed
export const isCancellationAllowed = (checkInDate: Date, cancellationPolicy: string = '24_hours'): boolean => {
  const now = new Date();
  const checkIn = new Date(checkInDate);
  const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  // Allow cancellation up to 1 hour before check-in for all policies
  return hoursUntilCheckIn > 1;
};

// Get cancellation deadline
export const getCancellationDeadline = (checkInDate: Date, cancellationPolicy: string = '24_hours'): Date => {
  const checkIn = new Date(checkInDate);
  const policy = CANCELLATION_POLICIES[cancellationPolicy] || CANCELLATION_POLICIES['24_hours'];
  
  const deadline = new Date(checkIn);
  deadline.setHours(deadline.getHours() - policy.hoursRequired);
  
  return deadline;
};