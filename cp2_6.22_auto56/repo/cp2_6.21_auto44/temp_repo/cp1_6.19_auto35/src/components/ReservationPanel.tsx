import { useState, useCallback } from 'react'
import { X, AlertTriangle, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLibraryStore, type ReservationStatus } from '@/data/store'

const COLUMNS: { key: ReservationStatus; label: string; color: string; bgColor: string; borderColor: string }[] = [
  { key: 'reserved', label: '预约中', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { key: 'picked_up', label: '已取书', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  { key: 'returned', label: '已归还', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
]

export default function ReservationPanel() {
  const userReservations = useLibraryStore((s) => s.getUserReservations())
  const books = useLibraryStore((s) => s.books)
  const cancelReservation = useLibraryStore((s) => s.cancelReservation)
  const updateReservationStatus = useLibraryStore((s) => s.updateReservationStatus)

  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    reservationId: string
    fromStatus: ReservationStatus
    toStatus: ReservationStatus
  } | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<ReservationStatus | null>(null)

  const getBookTitle = (bookId: string) => {
    return books.find((b) => b.id === bookId)?.title || '未知图书'
  }

  const getBookCategory = (bookId: string) => {
    return books.find((b) => b.id === bookId)?.category || ''
  }

  const getReservationsByStatus = useCallback(
    (status: ReservationStatus) => {
      return userReservations.filter((r) => r.status === status)
    },
    [userReservations]
  )

  const handleDragStart = (e: React.DragEvent, reservationId: string) => {
    setDraggedId(reservationId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', reservationId)
    const target = e.target as HTMLElement
    setTimeout(() => target.classList.add('dragging'), 0)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedId(null)
    setDragOverColumn(null)
    const target = e.target as HTMLElement
    target.classList.remove('dragging')
  }

  const handleDragOver = (e: React.DragEvent, status: ReservationStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, toStatus: ReservationStatus) => {
    e.preventDefault()
    setDragOverColumn(null)
    const reservationId = e.dataTransfer.getData('text/plain')
    if (!reservationId) return

    const reservation = userReservations.find((r) => r.id === reservationId)
    if (!reservation || reservation.status === toStatus) return

    setConfirmDialog({
      reservationId,
      fromStatus: reservation.status,
      toStatus,
    })
  }

  const handleConfirmStatusChange = () => {
    if (!confirmDialog) return
    const { reservationId, toStatus } = confirmDialog
    updateReservationStatus(reservationId, toStatus)
    const targetLabel = COLUMNS.find((c) => c.key === toStatus)?.label || ''
    toast.success(`已移至"${targetLabel}"`, { duration: 3000 })
    setConfirmDialog(null)
  }

  const handleCancelReservation = (reservationId: string) => {
    cancelReservation(reservationId)
    toast.success('预约已取消', { duration: 3000 })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const getNextStatus = (current: ReservationStatus): ReservationStatus | null => {
    if (current === 'reserved') return 'picked_up'
    if (current === 'picked_up') return 'returned'
    return null
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 pb-12">
      <h1 className="font-serif text-2xl font-bold text-surface-800 mb-6">我的预约</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const items = getReservationsByStatus(col.key)
          return (
            <div
              key={col.key}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.key)}
              className={`rounded-card border-2 transition-all duration-200 ${
                dragOverColumn === col.key
                  ? 'drag-over'
                  : `${col.borderColor} ${col.bgColor}`
              }`}
            >
              <div className={`px-4 py-3 border-b ${col.borderColor} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.color.replace('text-', 'bg-')}`} />
                  <h3 className={`text-sm font-semibold ${col.color}`}>{col.label}</h3>
                </div>
                <span className={`text-xs font-medium ${col.color} bg-white/60 px-2 py-0.5 rounded-full`}>
                  {items.length}
                </span>
              </div>

              <div className="p-3 min-h-[200px] space-y-2">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-surface-300">
                    <BookOpen className="w-8 h-8 mb-2" />
                    <p className="text-xs">拖拽卡片到此处</p>
                  </div>
                ) : (
                  items.map((reservation) => (
                    <div
                      key={reservation.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, reservation.id)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white rounded-lg p-3 shadow-sm border border-surface-100 cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
                        draggedId === reservation.id ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-sm font-medium text-surface-800 line-clamp-1">
                          {getBookTitle(reservation.bookId)}
                        </h4>
                        {reservation.status === 'reserved' && (
                          <button
                            onClick={() => handleCancelReservation(reservation.id)}
                            className="p-1 text-surface-300 hover:text-red-400 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-surface-400">{getBookCategory(reservation.bookId)}</span>
                        <span className="text-xs text-surface-400">{formatDate(reservation.createdAt)}</span>
                      </div>
                      {getNextStatus(reservation.status) && (
                        <button
                          onClick={() => {
                            const next = getNextStatus(reservation.status)
                            if (next) {
                              setConfirmDialog({
                                reservationId: reservation.id,
                                fromStatus: reservation.status,
                                toStatus: next,
                              })
                            }
                          }}
                          className="mt-2 w-full text-xs text-center py-1.5 rounded-md bg-surface-50 text-surface-500 hover:bg-surface-100 transition-colors"
                        >
                          移至{COLUMNS.find((c) => c.key === getNextStatus(reservation.status))?.label}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-card shadow-xl p-6 max-w-sm mx-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-base font-semibold text-surface-800">确认操作</h3>
            </div>
            <p className="text-sm text-surface-600 mb-6">
              确定将预约从「{COLUMNS.find((c) => c.key === confirmDialog.fromStatus)?.label}」
              移至「{COLUMNS.find((c) => c.key === confirmDialog.toStatus)?.label}」吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 px-4 py-2 bg-surface-100 hover:bg-surface-200 text-surface-600 rounded-lg text-sm font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmStatusChange}
                className="btn-ripple flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
