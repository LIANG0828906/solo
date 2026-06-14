import type { ReactNode } from 'react'

interface JobBoardProps {
  children: ReactNode
  className?: string
}

export default function JobBoard({ children, className = '' }: JobBoardProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 ${className}`}>
      {children}
    </div>
  )
}
