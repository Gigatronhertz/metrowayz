// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://metrowayz.onrender.com';

// Helper to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper to make authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
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

  // Create a new booking
  createBooking: async (data: {
    serviceId: string;
    checkInDate: string;
    checkOutDate: string;
    guests: number;
    specialRequests?: string;
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
  cancelBooking: async (id: string, reason?: string) => {
    return fetchWithAuth(`/api/bookings/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
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

export default {
  service: serviceAPI,
  booking: bookingAPI,
  review: reviewAPI,
  notification: notificationAPI,
  favorite: favoriteAPI,
};
