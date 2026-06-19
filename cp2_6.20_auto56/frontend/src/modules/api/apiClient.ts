import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios'

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userId = localStorage.getItem('userId')
    if (userId) {
      config.headers.set('X-User-Id', userId)
    }
    return config
  },
  (error: AxiosError) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        console.error('Unauthorized, please login again')
      } else if (status === 403) {
        console.error('Forbidden')
      } else if (status === 404) {
        console.error('Resource not found')
      } else if (status >= 500) {
        console.error('Server error')
      }
    } else if (error.request) {
      console.error('Network error, no response received')
    } else {
      console.error('Error setting up request:', error.message)
    }
    return Promise.reject(error)
  }
)

export default apiClient
