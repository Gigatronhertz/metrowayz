const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://metrowayz.onrender.com'

export interface User {
  _id: string
  email: string
  name: string
  profilePicture?: string
  role: 'user' | 'seller' | 'admin'
  onboarded?: boolean
}

export interface AuthResponse {
  success: boolean
  user?: User
  message?: string
  token?: string
}

export const tokenManager = {
  setToken: (token: string) => {
    // Validate token format before storing
    if (!token || typeof token !== 'string' || token.length < 10) {
      throw new Error('Invalid token format');
    }
    localStorage.setItem('authToken', token);
    // Set expiration check
    localStorage.setItem('tokenTimestamp', Date.now().toString());
  },
  
  getToken: () => {
    const token = localStorage.getItem('authToken');
    const timestamp = localStorage.getItem('tokenTimestamp');
    
    // Check if token is expired (24 hours)
    if (timestamp) {
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (tokenAge > maxAge) {
        tokenManager.removeToken();
        return null;
      }
    }
    
    return token;
  },
  
  removeToken: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenTimestamp');
  },
  
  isAuthenticated: () => {
    const token = tokenManager.getToken();
    return !!token;
  }
}

export const authService = {
  // Get user profile from backend
  getProfile: async (): Promise<AuthResponse> => {
    const token = tokenManager.getToken()
    if (!token) {
      throw new Error('No authentication token found')
    }

    const url = `${API_BASE_URL}/user-details`
    const requestOptions = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }

    console.log('🔄 Making request to:', url)
    console.log('📤 Request options:', requestOptions)

    const response = await fetch(url, requestOptions)

    console.log('📥 Response status:', response.status, response.statusText)
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      if (response.status === 401) {
        tokenManager.removeToken()
        throw new Error('Authentication expired')
      }
      const errorText = await response.text()
      console.error('❌ Error response body:', errorText)
      throw new Error(`Failed to fetch user profile: ${response.status} ${response.statusText}`)
    }

    const responseData = await response.json()
    console.log('✅ Response data:', responseData)

    // Handle both old and new response formats
    let user = responseData.user

    // Fallback: if no user field, construct it from businessData
    if (!user && responseData.data?.businessData) {
      const businessData = responseData.data.businessData
      user = {
        _id: responseData._id || 'temp-id',
        email: businessData.email || '',
        name: businessData.businessName || 'User',
        profilePicture: '',
        role: businessData.businessName ? 'seller' : 'user',
        onboarded: !!businessData.businessName
      }
      console.log('⚠️ Constructed user from businessData:', user)
    }

    // Transform response to match expected AuthResponse format
    return {
      success: true,
      user: user,
      message: 'User profile fetched successfully'
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    const token = tokenManager.getToken()
    if (token) {
      try {
        const url = `${API_BASE_URL}/auth/logout`
        const requestOptions = {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }

        console.log('🔄 Making logout request to:', url)
        console.log('📤 Request options:', requestOptions)

        const response = await fetch(url, requestOptions)

        console.log('📥 Logout response status:', response.status, response.statusText)
        console.log('📥 Logout response headers:', Object.fromEntries(response.headers.entries()))

        if (response.ok) {
          const responseData = await response.text()
          console.log('✅ Logout response:', responseData)
        } else {
          const errorText = await response.text()
          console.error('❌ Logout error response:', errorText)
        }
      } catch (error) {
        console.error('❌ Logout request failed:', error)
      }
    }
    tokenManager.removeToken()
  },

  // Initiate Google OAuth flow
  initiateGoogleAuth: (): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Open popup to Google OAuth
        const popup = window.open(
          `${API_BASE_URL}/auth/google`,
          "googleAuth",
          "width=500,height=600,scrollbars=yes,resizable=yes"
        )

        if (!popup) {
          reject(new Error('Popup blocked. Please allow popups and try again.'))
          return
        }

        // Listen for token from popup
        const handleMessage = (event: MessageEvent) => {
          console.log('Received message from:', event.origin)
          console.log('Message data:', event.data)

          // Strict origin validation
          const backendOrigin = new URL(API_BASE_URL).origin
          if (event.origin !== backendOrigin) {
            console.warn('Rejecting message from unauthorized origin:', event.origin)
            return
          }

          // Validate message structure
          if (!event.data || typeof event.data !== 'object') {
            console.warn('Invalid message format received')
            return
          }

          if (event.data.token && typeof event.data.token === 'string') {
            const token = event.data.token
            // Basic token validation
            if (token.length > 10 && token.includes('.')) {
              console.log('Received valid token, closing popup')
              try {
                popup.close()
              } catch (error) {
                console.warn('Could not close popup:', error)
              }
              window.removeEventListener('message', handleMessage)
              resolve(token)
            } else {
              console.warn('Received invalid token format')
              reject(new Error('Invalid token received'))
            }
          } else if (event.data.error && typeof event.data.error === 'string') {
            console.log('Received error from popup:', event.data.error)
            try {
              popup.close()
            } catch (error) {
              console.warn('Could not close popup:', error)
            }
            window.removeEventListener('message', handleMessage)
            reject(new Error(event.data.error))
          }
        }

        window.addEventListener('message', handleMessage)

        // Handle popup being closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed)
            window.removeEventListener('message', handleMessage)
            reject(new Error('Authentication cancelled'))
          }
        }, 1000)

      } catch (error) {
        reject(error instanceof Error ? error : new Error('Authentication failed'))
      }
    })
  }
}
