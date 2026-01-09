// Input validation and sanitization utilities
export const validateInput = {
  // Sanitize HTML content to prevent XSS
  sanitizeHtml: (input: string): string => {
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  },

  // Validate email format
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate phone number (basic)
  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  },

  // Validate price input
  isValidPrice: (price: string): boolean => {
    const priceNum = parseFloat(price);
    return !isNaN(priceNum) && priceNum >= 0 && priceNum <= 1000000;
  },

  // Validate text length
  isValidLength: (text: string, min: number, max: number): boolean => {
    return text.length >= min && text.length <= max;
  },

  // Sanitize search queries
  sanitizeSearch: (query: string): string => {
    return query
      .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 100); // Limit length
  },

  // Validate file uploads
  isValidImageFile: (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    return allowedTypes.includes(file.type) && file.size <= maxSize;
  },

  // Validate coordinates
  isValidCoordinate: (lat: number, lng: number): boolean => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }
};

// Rate limiting helper for client-side
export const rateLimiter = {
  requests: new Map<string, number[]>(),
  
  canMakeRequest: (key: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
    const now = Date.now();
    const requests = rateLimiter.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    rateLimiter.requests.set(key, validRequests);
    return true;
  }
};
