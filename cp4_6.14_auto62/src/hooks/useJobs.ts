import { useEffect } from 'react'
import { useAppStore } from '@/store'

export function useJobs() {
  const jobs = useAppStore((s) => s.jobs)
  const loading = useAppStore((s) => s.loading)
  const fetchJobs = useAppStore((s) => s.fetchJobs)
  const createJob = useAppStore((s) => s.createJob)

  useEffect(() => {
    if (jobs.length === 0) {
      fetchJobs()
    }
  }, [])

  return {
    jobs,
    loading,
    fetchJobs,
    createJob,
  }
}
