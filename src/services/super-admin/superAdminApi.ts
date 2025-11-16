// Super Admin API Service Layer
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
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  } catch (error: any) {
    if (retries > 0 && (error.name === 'AbortError' || error.message.includes('fetch'))) {
      console.log(`Retrying request to ${url}... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchWithAuth(url, options, retries - 1);
    }
    throw error;
  }
};

// ============= SUPER ADMIN AUTHENTICATION =============

export const superAdminAuthAPI = {
  // Super Admin login with email/password
  login: async (email: string, password: string) => {
    console.log('📤 Sending Super Admin Login Request to:', `${API_BASE_URL}/auth/super-admin/login`);
    console.log('📤 With credentials:', { email, passwordLength: password.length });

    const response = await fetch(`${API_BASE_URL}/auth/super-admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
      console.error('❌ Login Error Response:', errorData);
      console.error('❌ Full response:', response);
      throw new Error(errorData.message || 'Invalid credentials');
    }

    const data = await response.json();
    console.log('✅ Login Success Response:', data);
    return data;
  },
};

// ============= SUPER ADMIN DASHBOARD =============

export const superAdminDashboardAPI = {
  // Get platform statistics
  getStats: async () => {
    return fetchWithAuth('/api/super-admin/stats');
  },
};

// ============= VENDORS MANAGEMENT =============

export const superAdminVendorsAPI = {
  // Get all vendors
  getAllVendors: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    userType?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    return fetchWithAuth(`/api/super-admin/vendors?${queryParams.toString()}`);
  },

  // Fix vendor roles (migration endpoint)
  fixVendorRoles: async () => {
    return fetchWithAuth('/api/super-admin/fix-vendor-roles', {
      method: 'POST',
    });
  },
};

// ============= BOOKINGS MANAGEMENT =============

export const superAdminBookingsAPI = {
  // Get all bookings across platform
  getAllBookings: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    providerId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    return fetchWithAuth(`/api/super-admin/bookings?${queryParams.toString()}`);
  },
};

// ============= SERVICES MANAGEMENT =============

export const superAdminServicesAPI = {
  // Get all services across platform
  getAllServices: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
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
    return fetchWithAuth(`/api/super-admin/services?${queryParams.toString()}`);
  },
};

// ============= CANCELLATION REQUESTS =============

export const superAdminCancellationAPI = {
  // Get all cancellation requests
  getCancellationRequests: async (params?: {
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
    return fetchWithAuth(`/api/super-admin/cancellation-requests?${queryParams.toString()}`);
  },

  // Approve cancellation request
  approveCancellation: async (bookingId: string, adminNotes?: string) => {
    return fetchWithAuth(`/api/super-admin/cancellation-requests/${bookingId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ adminNotes }),
    });
  },

  // Reject cancellation request
  rejectCancellation: async (bookingId: string, adminNotes?: string) => {
    return fetchWithAuth(`/api/super-admin/cancellation-requests/${bookingId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ adminNotes }),
    });
  },
};

// ============= EVENTS MANAGEMENT =============

export const superAdminEventsAPI = {
  // Get all events
  getAllEvents: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
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
    const response = await fetchWithAuth(`/api/events?${queryParams.toString()}`);
    // Return just the data array, not the whole response object
    return response.data || [];
  },

  // Get single event
  getEventById: async (id: string) => {
    const response = await fetchWithAuth(`/api/events/${id}`);
    // Return just the data, not the whole response object
    return response.data || null;
  },

  // Create event (Super Admin only)
  createEvent: async (data: {
    title: string;
    description: string;
    eventDate: string;
    eventTime: string;
    location: string;
    ticketPrice: number;
    category: string;
    capacity: number;
    image?: { url: string; publicId: string };
    featured?: boolean;
  }) => {
    return fetchWithAuth('/api/super-admin/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update event (Super Admin only)
  updateEvent: async (id: string, data: any) => {
    return fetchWithAuth(`/api/super-admin/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete event (Super Admin only)
  deleteEvent: async (id: string) => {
    return fetchWithAuth(`/api/super-admin/events/${id}`, {
      method: 'DELETE',
    });
  },

  // Get event statistics
  getEventStats: async () => {
    return fetchWithAuth('/api/super-admin/events/stats/overview');
  },
};

export default {
  auth: superAdminAuthAPI,
  dashboard: superAdminDashboardAPI,
  vendors: superAdminVendorsAPI,
  bookings: superAdminBookingsAPI,
  services: superAdminServicesAPI,
  cancellation: superAdminCancellationAPI,
  events: superAdminEventsAPI,
};
