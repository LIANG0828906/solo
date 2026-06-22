interface EmptyStateProps {
  message?: string
}

export default function EmptyState({ message = '暂无相关作品' }: EmptyStateProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center py-20">
      <div className="animate-float animate-scalePulse">
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M56 8L28 36"
            stroke="#6b7280"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M56 8L40 56L28 36"
            stroke="#6b7280"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M56 8L8 24L28 36"
            stroke="#6b7280"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M36 44L40 56"
            stroke="#6b7280"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="mt-6 font-body text-sm text-gray-400">{message}</p>
    </div>
  )
}
