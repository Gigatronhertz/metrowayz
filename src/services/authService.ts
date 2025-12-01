const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://metrowayz.onrender.com'

export interface User {
  _id: string
  email: string
  name: string
  profilePicture?: string
  role: 'user' | 'seller' | 'admin'
  onboarded?: boolean
  loyaltyPoints?: number
  membershipTier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
  totalBookings?: number
  referrals?: number
  createdAt?: Date | string
}

export interface AuthResponse {
  success: boolean
  user?: User
  message?: string
  token?: string
}

export const tokenManager = {
  setToken: (token: string) => localStorage.setItem('authToken', token),
  getToken: () => localStorage.getItem('authToken'),
  removeToken: () => localStorage.removeItem('authToken'),
  isAuthenticated: () => !!localStorage.getItem('authToken')
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

          // Accept messages from the popup (which comes from the backend domain)
          // The popup is opened from API_BASE_URL, so messages will come from there
          const backendOrigin = new URL(API_BASE_URL).origin
          if (event.origin !== backendOrigin && event.origin !== window.location.origin) {
            console.warn('Ignoring message from unexpected origin:', event.origin)
            return
          }

          if (event.data && event.data.token) {
            const token = event.data.token
            console.log('Received token, closing popup')
            try {
              popup.close()
            } catch (error) {
              console.warn('Could not close popup:', error)
            }
            window.removeEventListener('message', handleMessage)
            resolve(token)
          } else if (event.data && event.data.error) {
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
  },

  loginWithEmail: async (email: string, password: string): Promise<AuthResponse> => {
    const url = `${API_BASE_URL}/auth/login`
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    }

    const response = await fetch(url, requestOptions)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Login failed')
    }

    const data = await response.json()
    
    if (data.token) {
      tokenManager.setToken(data.token)
    }

    return {
      success: true,
      user: data.user,
      token: data.token,
      message: 'Login successful'
    }
  },

  signupWithEmail: async (email: string, password: string, name: string): Promise<AuthResponse> => {
    const url = `${API_BASE_URL}/auth/signup`
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name })
    }

    const response = await fetch(url, requestOptions)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Signup failed')
    }

    const data = await response.json()
    
    if (data.token) {
      tokenManager.setToken(data.token)
    }

    return {
      success: true,
      user: data.user,
      token: data.token,
      message: 'Signup successful'
    }
  }
}