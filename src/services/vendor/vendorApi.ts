// Vendor API Service Layer
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://metrowayz.onrender.com';

// Helper to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper to make authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}, retries = 2) => {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    console.log('🌐 API Request:', `${API_BASE_URL}${url}`);
    console.log('🔑 Has token:', !!token);

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
      signal: AbortSignal.timeout(30000),
    });

    console.log('📥 API Response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      console.error('❌ API Error:', error);
      throw new Error(error.message || 'Request failed');
    }

    const data = await response.json();
    console.log('✅ API Success:', url, 'Data count:', data.data?.length || 'N/A');
    return data;
  } catch (error: any) {
    if (retries > 0 && (error.name === 'AbortError' || error.message.includes('fetch'))) {
      console.log(`Retrying request to ${url}... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchWithAuth(url, options, retries - 1);
    }
    throw error;
  }
};

// ============= VENDOR DASHBOARD APIs =============

export const vendorDashboardAPI = {
  // Get dashboard stats
  getStats: async () => {
    return fetchWithAuth('/dashboard-stats');
  },

  // Get recent bookings
  getRecentBookings: async () => {
    return fetchWithAuth('/recent-bookings');
  },

  // Get analytics data
  getAnalytics: async () => {
    return fetchWithAuth('/dashboard-analytics');
  },

  // Debug endpoint to see what data exists
  getDebugData: async () => {
    return fetchWithAuth('/debug-my-data');
  },
};

// ============= VENDOR SERVICE APIs =============

export const vendorServiceAPI = {
  // Get vendor's services
  getMyServices: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    // Use /services endpoint which auto-filters by authenticated user
    return fetchWithAuth(`/services?${queryParams.toString()}`);
  },

  // Get single service for editing (vendor endpoint with full data)
  getServiceForEdit: async (id: string) => {
    return fetchWithAuth(`/services/${id}`);
  },

  // Create new service
  createService: async (data: {
    title: string;
    category: string;
    description: string;
    location: string;
    price: number;
    priceUnit: string;
    images: Array<{ url: string; publicId: string; resourceType?: string }>;
    amenities?: string[];
    latitude?: number;
    longitude?: number;
    isAvailable?: boolean;
    status?: string;
  }) => {
    return fetchWithAuth('/create-service', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update service
  updateService: async (id: string, data: any) => {
    return fetchWithAuth(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Update service status
  updateServiceStatus: async (id: string, status: string) => {
    return fetchWithAuth(`/services/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Delete service
  deleteService: async (id: string) => {
    return fetchWithAuth(`/services/${id}`, {
      method: 'DELETE',
    });
  },

  // Get Cloudinary signature for uploads
  getCloudinarySignature: async () => {
    return fetchWithAuth('/cloudinary-signature');
  },
};

// ============= VENDOR BOOKING APIs =============

export const vendorBookingAPI = {
  // Get provider's bookings
  getProviderBookings: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    return fetchWithAuth(`/api/provider/bookings?${queryParams.toString()}`);
  },

  // Get pending bookings
  getPendingBookings: async () => {
    return fetchWithAuth('/api/provider/bookings/pending');
  },

  // Approve booking
  approveBooking: async (id: string) => {
    return fetchWithAuth(`/api/provider/bookings/${id}/approve`, {
      method: 'PUT',
    });
  },

  // Reject booking
  rejectBooking: async (id: string, reason?: string) => {
    return fetchWithAuth(`/api/provider/bookings/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  // Get booking details
  getBookingById: async (id: string) => {
    return fetchWithAuth(`/api/bookings/${id}`);
  },

  // Update booking status
  updateBookingStatus: async (id: string, status: string) => {
    return fetchWithAuth(`/api/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Get provider calendar
  getProviderCalendar: async () => {
    return fetchWithAuth('/api/provider/calendar');
  },
};

// ============= VENDOR CANCELLATION APIs =============

export const vendorCancellationAPI = {
  // Get cancellation requests for provider
  getCancellationRequests: async () => {
    return fetchWithAuth('/api/provider/cancellation-requests');
  },

  // Get cancellation policies
  getCancellationPolicies: async () => {
    return fetchWithAuth('/api/provider/cancellation-policies');
  },

  // Create cancellation policy
  createCancellationPolicy: async (data: any) => {
    return fetchWithAuth('/api/provider/cancellation-policies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update cancellation policy
  updateCancellationPolicy: async (id: string, data: any) => {
    return fetchWithAuth(`/api/provider/cancellation-policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete cancellation policy
  deleteCancellationPolicy: async (id: string) => {
    return fetchWithAuth(`/api/provider/cancellation-policies/${id}`, {
      method: 'DELETE',
    });
  },

  // Set service cancellation policy
  setServiceCancellationPolicy: async (serviceId: string, policyId: string) => {
    return fetchWithAuth(`/api/provider/services/${serviceId}/cancellation-policy`, {
      method: 'PUT',
      body: JSON.stringify({ policyId }),
    });
  },
};

// ============= VENDOR RESCHEDULE APIs =============

export const vendorRescheduleAPI = {
  // Get reschedule requests
  getRescheduleRequests: async () => {
    return fetchWithAuth('/api/provider/reschedule-requests');
  },

  // Approve reschedule request
  approveReschedule: async (bookingId: string) => {
    return fetchWithAuth(`/api/provider/reschedule-requests/${bookingId}/approve`, {
      method: 'PUT',
    });
  },

  // Reject reschedule request
  rejectReschedule: async (bookingId: string, reason?: string) => {
    return fetchWithAuth(`/api/provider/reschedule-requests/${bookingId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },
};

// ============= VENDOR REVIEW APIs =============

export const vendorReviewAPI = {
  // Get reviews for provider's services
  getMyServiceReviews: async (serviceId: string, params?: {
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    return fetchWithAuth(`/api/services/${serviceId}/reviews?${queryParams.toString()}`);
  },

  // Respond to review
  respondToReview: async (reviewId: string, response: string) => {
    return fetchWithAuth(`/api/reviews/${reviewId}/response`, {
      method: 'POST',
      body: JSON.stringify({ response }),
    });
  },
};

// ============= VENDOR FINANCIAL APIs =============

export const vendorFinancialAPI = {
  // Get financial overview
  getFinancialOverview: async () => {
    return fetchWithAuth('/financial/overview');
  },

  // Get transactions
  getTransactions: async () => {
    return fetchWithAuth('/financial/transactions');
  },

  // Get payouts
  getPayouts: async () => {
    return fetchWithAuth('/financial/payouts');
  },

  // Get expenses
  getExpenses: async () => {
    return fetchWithAuth('/financial/expenses');
  },

  // Add expense
  addExpense: async (data: {
    description: string;
    amount: number;
    category: string;
    date: string;
  }) => {
    return fetchWithAuth('/financial/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============= VENDOR PROFILE APIs =============

export const vendorProfileAPI = {
  // Get user details
  getUserDetails: async () => {
    return fetchWithAuth('/user-details');
  },

  // Update profile
  updateProfile: async (data: {
    name?: string;
    phoneNumber?: string;
    businessName?: string;
    businessDescription?: string;
    businessType?: string;
    taxId?: string;
    website?: string;
    categories?: string[];
    certifications?: string[];
    about?: string;
    businessHours?: any;
    locations?: any[];
    zipCode?: string;
    socialLinks?: any;
  }) => {
    return fetchWithAuth('/update-profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get customers
  getCustomers: async () => {
    return fetchWithAuth('/customers');
  },
};

export default {
  dashboard: vendorDashboardAPI,
  service: vendorServiceAPI,
  booking: vendorBookingAPI,
  cancellation: vendorCancellationAPI,
  reschedule: vendorRescheduleAPI,
  review: vendorReviewAPI,
  financial: vendorFinancialAPI,
  profile: vendorProfileAPI,
};
