// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://metrowayz.onrender.com';

// Helper to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper to make authenticated requests with retry logic
const fetchWithAuth = async (url: string, options: RequestInit = {}, retries = 2) => {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
      // Increase timeout for cold starts
      signal: AbortSignal.timeout(30000), // 30 seconds
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  } catch (error: any) {
    // Retry on network errors (cold starts, timeouts)
    if (retries > 0 && (error.name === 'AbortError' || error.message.includes('fetch'))) {
      console.log(`Retrying request to ${url}... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      return fetchWithAuth(url, options, retries - 1);
    }
    throw error;
  }
};

// ============= SERVICE APIs =============

export const serviceAPI = {
  // Get all public services (for customers)
  getPublicServices: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    return fetchWithAuth(`/api/public/services?${queryParams.toString()}`);
  },

  // Get single service details
  getServiceById: async (id: string) => {
    return fetchWithAuth(`/api/public/services/${id}`);
  },

  // Get service categories
  getCategories: async () => {
    return fetchWithAuth('/api/public/categories');
  },
};

// ============= BOOKING APIs =============

export const bookingAPI = {
  // Get booked dates for a service (for calendar)
  getBookedDates: async (serviceId: string) => {
    return fetchWithAuth(`/api/services/${serviceId}/booked-dates`);
  },

  // Check availability for a date range
  checkAvailability: async (serviceId: string, checkInDate: string, checkOutDate: string) => {
    return fetchWithAuth(`/api/services/${serviceId}/check-availability`, {
      method: 'POST',
      body: JSON.stringify({ checkInDate, checkOutDate }),
    });
  },

  // Get calendar data for a specific month
  getCalendarData: async (serviceId: string, year: number, month: number) => {
    return fetchWithAuth(`/api/services/${serviceId}/calendar/${year}/${month}`);
  },

  // Get available time slots for chef services on a specific date
  getChefAvailability: async (serviceId: string, date: string) => {
    return fetchWithAuth(`/api/services/${serviceId}/availability/chef?date=${date}`);
  },

  // Create a new booking
  createBooking: async (data: {
    serviceId: string;
    checkInDate?: string;
    checkOutDate?: string;
    guests?: number;
    specialRequests?: string;
    isChefService?: boolean;
    selectedMenuOptions?: Record<string, string | string[] | undefined>;
    selectedAddons?: string[];
    guestCount?: number;
    serviceDate?: string;
    serviceTime?: string;
    selectedServiceType?: string;
    selectedMealPackage?: { label: string; price: number } | null;
    selectedAdditionalNotes?: string;
  }) => {
    return fetchWithAuth('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get user's bookings
  getUserBookings: async (params?: {
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
    return fetchWithAuth(`/api/user/bookings?${queryParams.toString()}`);
  },

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

  // Get single booking details
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

  // Cancel booking
  cancelBooking: async (id: string, reason?: string, reasonCategory?: string) => {
    return fetchWithAuth(`/api/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason, reasonCategory }),
    });
  },

  // Get cancellation preview
  getCancellationPreview: async (id: string) => {
    return fetchWithAuth(`/api/bookings/${id}/cancellation-preview`);
  },

  // Check cancellation eligibility
  checkCancellationEligibility: async (id: string) => {
    return fetchWithAuth(`/api/bookings/${id}/cancellation-eligibility`);
  },

  // Request to reschedule booking
  rescheduleBooking: async (id: string, data: {
    newCheckInDate: string;
    newCheckOutDate: string;
    message?: string;
  }) => {
    return fetchWithAuth(`/api/bookings/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get reschedule quote
  getRescheduleQuote: async (id: string, newCheckInDate: string, newCheckOutDate: string) => {
    return fetchWithAuth(`/api/bookings/${id}/reschedule-quote?newCheckInDate=${newCheckInDate}&newCheckOutDate=${newCheckOutDate}`);
  },
};

// ============= REVIEW APIs =============

export const reviewAPI = {
  // Submit a review
  submitReview: async (serviceId: string, data: {
    rating: number;
    comment: string;
    bookingId?: string;
  }) => {
    return fetchWithAuth(`/api/services/${serviceId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get reviews for a service
  getServiceReviews: async (serviceId: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
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

  // Update review
  updateReview: async (reviewId: string, data: {
    rating?: number;
    comment?: string;
  }) => {
    return fetchWithAuth(`/api/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete review
  deleteReview: async (reviewId: string) => {
    return fetchWithAuth(`/api/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  },

  // Mark review as helpful
  markReviewHelpful: async (reviewId: string) => {
    return fetchWithAuth(`/api/reviews/${reviewId}/helpful`, {
      method: 'POST',
    });
  },
};

// ============= NOTIFICATION APIs =============

export const notificationAPI = {
  // Get user's notifications
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    return fetchWithAuth(`/api/notifications?${queryParams.toString()}`);
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    return fetchWithAuth(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    return fetchWithAuth('/api/notifications/read-all', {
      method: 'PUT',
    });
  },

  // Delete notification
  deleteNotification: async (notificationId: string) => {
    return fetchWithAuth(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },
};

// ============= FAVORITE APIs =============

export const favoriteAPI = {
  // Get user's favorites
  getFavorites: async (params?: {
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
    return fetchWithAuth(`/api/favorites?${queryParams.toString()}`);
  },

  // Add to favorites
  addFavorite: async (serviceId: string) => {
    return fetchWithAuth(`/api/favorites/${serviceId}`, {
      method: 'POST',
    });
  },

  // Remove from favorites
  removeFavorite: async (serviceId: string) => {
    return fetchWithAuth(`/api/favorites/${serviceId}`, {
      method: 'DELETE',
    });
  },

  // Check if favorited
  checkFavorite: async (serviceId: string) => {
    return fetchWithAuth(`/api/favorites/check/${serviceId}`);
  },
};

// ============= PAYMENT APIs =============

export const paymentAPI = {
  // Initialize payment
  initializePayment: async (data: {
    bookingId: string;
    amount: number;
    paymentMethod: string;
    reference?: string;
  }) => {
    return fetchWithAuth('/api/payments/initialize', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Verify payment
  verifyPayment: async (reference: string) => {
    return fetchWithAuth(`/api/payments/verify/${reference}`);
  },

  // Get payment details
  getPaymentDetails: async (paymentId: string) => {
    return fetchWithAuth(`/api/payments/${paymentId}`);
  },

  // Get user's payment history
  getPaymentHistory: async (params?: {
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
    return fetchWithAuth(`/api/payments/history?${queryParams.toString()}`);
  },

  // Paystack webhook handler (for backend use)
  handlePaystackWebhook: async (data: any) => {
    return fetchWithAuth('/api/payments/paystack/webhook', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============= EVENTS APIs =============

export const eventsAPI = {
  // Get all public events
  getPublicEvents: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    featured?: boolean;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const response = await fetchWithAuth(`/api/events?${queryParams.toString()}`);
    return response.data || [];
  },

  // Get single event by ID
  getEventById: async (id: string) => {
    const response = await fetchWithAuth(`/api/events/${id}`);
    return response.data || null;
  },
};

// ============= USER APIs =============

export const userAPI = {
  // Update user profile
  updateProfile: async (data: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    bio?: string;
  }) => {
    return fetchWithAuth('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Get user profile
  getProfile: async () => {
    return fetchWithAuth('/api/user/profile');
  },
};

export default {
  service: serviceAPI,
  booking: bookingAPI,
  review: reviewAPI,
  notification: notificationAPI,
  favorite: favoriteAPI,
  payment: paymentAPI,
  events: eventsAPI,
  user: userAPI,
};
