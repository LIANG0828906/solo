import { useState, useEffect } from 'react'
import { X, Droplets, Leaf, Scissors, RefreshCw } from 'lucide-react'
import type { CareLog, CareLogType } from '@/plantManager/core/plantModel'
import { cn, formatDate } from '@/shared/utils'
import { v4 as uuidv4 } from 'uuid'

interface CareLogFormProps {
  plantId: string
  type: CareLogType
  isOpen: boolean
  onClose: () => void
  onSubmit: (log: CareLog) => void
}

const typeConfig: Record<CareLogType, {
  label: string
  icon: typeof Droplets
  color: string
  bgColor: string
  borderColor: string
}> = {
  watering: {
    label: '浇水',
    icon: Droplets,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  fertilizing: {
    label: '施肥',
    icon: Leaf,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  pruning: {
    label: '修剪',
    icon: Scissors,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  rotating: {
    label: '转盆',
    icon: RefreshCw,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
}

export default function CareLogForm({
  plantId,
  type,
  isOpen,
  onClose,
  onSubmit,
}: CareLogFormProps) {
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')

  const config = typeConfig[type]
  const Icon = config.icon

  useEffect(() => {
    if (isOpen) {
      const now = new Date()
      const localDateTime = formatDate(now, "yyyy-MM-dd'T'HH:mm")
      setDate(localDateTime)
      setNote('')
    }
  }, [isOpen, type])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!date) return

    const log: CareLog = {
      id: uuidv4(),
      plantId,
      type,
      date: new Date(date).toISOString(),
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    }

    onSubmit(log)
    onClose()
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <div
        className="absolute inset-0 backdrop-blur-sm bg-black/30"
        onClick={onClose}
      />

      <div
        className={cn(
          'relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={cn('p-2.5 rounded-2xl', config.bgColor)}>
              <Icon className={cn('w-5 h-5', config.color)} />
            </div>
            <h2 className={cn('text-lg font-semibold', config.color)}>
              {config.label}记录
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">操作时间</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={cn(
                'w-full px-4 py-3 rounded-xl border-2 bg-gray-50 text-gray-800',
                'focus:outline-none focus:ring-0 transition-colors',
                config.borderColor,
                'focus:bg-white'
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">备注</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="添加备注..."
              rows={3}
              className={cn(
                'w-full px-4 py-3 rounded-xl border-2 bg-gray-50 text-gray-800 resize-none',
                'focus:outline-none focus:ring-0 transition-colors',
                'border-gray-200 focus:border-gray-300',
                'focus:bg-white'
              )}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!date}
              className={cn(
                'flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                config.color.replace('text-', 'bg-').replace('-600', '-500'),
                'hover:brightness-105 active:brightness-95'
              )}
            >
              确认{config.label}
            </button>
          </div>
        </form>

        <div className="h-6" />
      </div>
    </div>
  )
}
