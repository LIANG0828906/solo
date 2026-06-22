import { useState, useCallback } from 'react'
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@shared/types'

const baseURL = '/api'

const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || '请求失败'
    console.error('API Error:', message)
    return Promise.reject(new Error(message))
  },
)

interface UseApiResult<TData, TArgs extends unknown[] = []> {
  data: TData | null
  loading: boolean
  error: string | null
  execute: (...args: TArgs) => Promise<TData | null>
  reset: () => void
}

export function useApi<TData, TArgs extends unknown[] = []>(
  fn: (axios: AxiosInstance, ...args: TArgs) => Promise<TData>,
): UseApiResult<TData, TArgs> {
  const [data, setData] = useState<TData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(
    async (...args: TArgs): Promise<TData | null> => {
      setLoading(true)
      setError(null)
      try {
        const result = await fn(axiosInstance, ...args)
        setData(result)
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '未知错误'
        setError(errorMessage)
        return null
      } finally {
        setLoading(false)
      }
    },
    [fn],
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { data, loading, error, execute, reset }
}

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await axiosInstance.request<ApiResponse<T>>(config)
  if (!response.data.success) {
    throw new Error(response.data.error || '请求失败')
  }
  return response.data.data as T
}

export default axiosInstance
