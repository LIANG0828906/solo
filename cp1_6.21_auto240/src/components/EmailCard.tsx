import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Email, EmailCategory } from '@/types'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/types'

interface EmailCardProps {
  email: Email
}

const categoryColorMap: Record<EmailCategory, string> = {
  work: '#3B82F6',
  social: '#10B981',
  promo: '#F59E0B',
  spam: '#EF4444',
}

const categoryBgMap: Record<EmailCategory, string> = {
  work: 'rgba(59,130,246,0.1)',
  social: 'rgba(16,185,129,0.1)',
  promo: 'rgba(245,158,11,0.1)',
  spam: 'rgba(239,68,68,0.1)',
}

function formatTime(ts: string): string {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export default function EmailCard({ email }: EmailCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: email.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    scale: isDragging ? '0.75' : '1',
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
  }

  const color = categoryColorMap[email.category]
  const bgColor = categoryBgMap[email.category]

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group email-card w-[280px] min-h-[140px] bg-[#F8FAFC] rounded-xl p-4 cursor-grab active:cursor-grabbing shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)] hover:-translate-y-[3px] transition-all duration-300 ease select-none"
    >
      <div
        className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="pl-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-sm text-slate-800 truncate">
            {email.from}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ml-2"
            style={{ color, backgroundColor: bgColor }}
          >
            {CATEGORY_LABELS[email.category]}
          </span>
        </div>
        <p className="text-base text-slate-700 leading-snug mb-2 truncate">
          {email.subject}
        </p>
        <p className="text-xs text-[#64748B]">
          {formatTime(email.timestamp)}
        </p>
      </div>
    </div>
  )
}
