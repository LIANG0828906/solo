import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { mockExhibits } from '@/data/exhibits'
import type { Exhibit } from '@/types'

export function useExhibits() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { exhibits, setExhibits } = useAppStore()

  useEffect(() => {
    const fetchExhibits = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/exhibits')

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success && data.data) {
          setExhibits(data.data as Exhibit[])
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        console.warn('Failed to fetch exhibits from API, using mock data:', err)
        setExhibits(mockExhibits)
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchExhibits()
  }, [setExhibits])

  return {
    exhibits,
    loading,
    error,
    isUsingMockData: error !== null,
  }
}
