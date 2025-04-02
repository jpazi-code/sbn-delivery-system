import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

// Create auth context
const AuthContext = createContext()

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext)

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(0)

  // Check if token exists in localStorage
  const isAuthenticated = !!localStorage.getItem('token')

  // Configure axios with interceptors for auth
  useEffect(() => {
    // Add request interceptor to include auth token
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Add response interceptor to handle auth errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // If server returns 401 Unauthorized, clear token and user
        if (error.response && error.response.status === 401) {
          console.log('401 error detected - clearing auth state')
          localStorage.removeItem('token')
          setUser(null)
        }
        return Promise.reject(error)
      }
    )

    // Clean up interceptors on unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor)
      axios.interceptors.response.eject(responseInterceptor)
    }
  }, [])

  // Login function
  const login = async (username, password) => {
    try {
      // Clear any previous auth state first
      localStorage.removeItem('token')
      setUser(null)
      
      const response = await axios.post('/api/auth/login', { username, password })
      const { token, user } = response.data
      
      if (!token) {
        throw new Error('No token received from server')
      }
      
      // Store token in localStorage
      localStorage.setItem('token', token)
      
      // Set axios default headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // Set user data
      setUser(user)
      setLastRefresh(Date.now())
      
      // Verify token works by making a test request
      try {
        await axios.get('/api/auth/check')
        console.log('Token verification successful')
      } catch (verifyError) {
        console.error('Token verification failed:', verifyError)
        // Continue anyway since we just got the token
      }
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      // Clear any partial auth state
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
      
      return { 
        success: false, 
        message: error.response?.data?.error || 'An error occurred during login' 
      }
    }
  }

  // Logout function
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token')
    
    // Clear axios default headers
    delete axios.defaults.headers.common['Authorization']
    
    // Clear user data
    setUser(null)
    setLastRefresh(0)
  }

  // Refresh user data function
  const refreshUserData = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true)
    }
    
    try {
      // Check if token exists
      const token = localStorage.getItem('token')
      if (!token) {
        if (showLoading) setLoading(false)
        return false
      }
      
      // Ensure token is set in headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // Get user data
      const response = await axios.get('/api/auth/me')
      setUser(response.data)
      setLastRefresh(Date.now())
      return true
    } catch (error) {
      console.error('Error refreshing user data:', error)
      
      // Clear token and user on 401 errors
      if (error.response?.status === 401) {
        console.log('Clearing auth state due to 401 error during refresh')
        localStorage.removeItem('token')
        delete axios.defaults.headers.common['Authorization']
        setUser(null)
      }
      return false
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [])

  // Load user data if token exists
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Check if token exists
        const token = localStorage.getItem('token')
        if (!token) {
          setLoading(false)
          return
        }
        
        // Ensure token is set in headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        // Get user data
        console.log('Fetching user data from /api/auth/me')
        const response = await axios.get('/api/auth/me')
        console.log('User data received:', response.data)
        setUser(response.data)
        setLastRefresh(Date.now())
      } catch (error) {
        console.error('Error loading user data:', error)
        setError('Failed to load user data. Please try again.')
        
        // Clear token and user on 401 errors
        if (error.response?.status === 401) {
          console.log('Clearing auth state due to 401 error during initial load')
          localStorage.removeItem('token')
          delete axios.defaults.headers.common['Authorization']
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    }
    
    loadUserData()
  }, [])

  // Check auth status
  const checkAuthStatus = async () => {
    return await refreshUserData(true)
  }

  // Create the value object
  const value = {
    user,
    setUser,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    checkAuthStatus,
    refreshUserData,
    lastRefresh
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 