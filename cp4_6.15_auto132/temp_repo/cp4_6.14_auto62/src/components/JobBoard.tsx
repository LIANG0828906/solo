import { Building2, MapPin, DollarSign, Clock } from 'lucide-react'
import type { Job } from '@shared/types'
import { cn } from '@/lib/utils'

const formatSalary = (value: number) => `${value / 1000}k`

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface JobCardProps {
  job: Job
  onClick?: () => void
  className?: string
}

export function JobCard({ job, onClick, className }: JobCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex h-[180px] w-full cursor-pointer flex-col justify-between rounded-lg bg-white p-5',
        'shadow-[0_2px_8px_rgba(0,0,0,0.08)]',
        'transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)]',
        className
      )}
    >
      <div>
        <h3 className="mb-2 font-semibold text-lg text-[var(--color-text)]">{job.title}</h3>
        <span className="inline-flex items-center rounded-full bg-[var(--color-secondary)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--color-secondary)]">
          <Building2 size={12} className="mr-1" />
          {job.department}
        </span>
      </div>
      <div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin size={14} />
            {job.location}
          </span>
          <span className="flex items-center gap-1 font-medium text-[var(--color-primary)]">
            <DollarSign size={14} />
            {formatSalary(job.salaryMin)}-{formatSalary(job.salaryMax)}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
          <Clock size={12} />
          {formatDate(job.createdAt)}
        </div>
      </div>
    </div>
  )
}

interface JobBoardProps {
  jobs: Job[]
  loading?: boolean
  onCardClick?: (job: Job) => void
  className?: string
}

export default function JobBoard({ jobs, loading = false, onCardClick, className }: JobBoardProps) {
  if (loading && jobs.length === 0) {
    return (
      <div className={cn('grid grid-cols-1 gap-6 md:grid-cols-3', className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[180px] animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('grid grid-cols-1 gap-6 md:grid-cols-3', className)}>
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} onClick={() => onCardClick?.(job)} />
      ))}
    </div>
  )
}
