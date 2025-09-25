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
    return responseData
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
          // Verify origin for security
          if (event.origin !== new URL(API_BASE_URL).origin) {
            return
          }

          if (event.data && event.data.token) {
            const token = event.data.token
            try {
              popup.close()
            } catch (error) {
              console.warn('Could not close popup due to CORS policy:', error)
            }
            window.removeEventListener('message', handleMessage)
            resolve(token)
          } else if (event.data && event.data.error) {
            try {
              popup.close()
            } catch (error) {
              console.warn('Could not close popup due to CORS policy:', error)
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