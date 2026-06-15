import { useState, useEffect, useCallback } from 'react'
import api from '@/api'
import type { Job } from '@shared/types'

interface UseJobsOptions {
  fetchFn?: () => Promise<Job[]>
  autoFetch?: boolean
}

export function useJobs(options: UseJobsOptions = {}) {
  const { fetchFn, autoFetch = true } = options
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const data = fetchFn ? await fetchFn() : await api.getJobs()
      setJobs(data)
    } finally {
      setLoading(false)
    }
  }, [fetchFn])

  const createJob = useCallback(async (job: Omit<Job, 'id' | 'createdAt'>) => {
    setLoading(true)
    try {
      const newJob = await api.createJob(job)
      setJobs((prev) => [...prev, newJob])
      return newJob
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchJobs()
    }
  }, [autoFetch, fetchJobs])

  return {
    jobs,
    loading,
    fetchJobs,
    createJob,
    setJobs,
  }
}

export default useJobs
