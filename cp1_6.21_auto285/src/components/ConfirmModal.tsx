import { X, AlertCircle, BookOpen, User, Calendar } from 'lucide-react'
import { Book } from '@shared/types'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  book: Book | null
  userName?: string
}

export default function ConfirmModal({ isOpen, onClose, onConfirm, book, userName = '李明' }: ConfirmModalProps) {
  if (!isOpen || !book) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="modal-content w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">确认借阅</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex gap-4 mb-4">
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-20 h-28 object-cover rounded-lg shadow-sm"
              />
            ) : (
              <div className="w-20 h-28 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-violet-400" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 mb-1">{book.title}</h3>
              <div className="flex items-center gap-1 text-sm text-slate-500 mb-1">
                <User className="w-4 h-4" />
                <span>{book.author}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <BookOpen className="w-4 h-4" />
                <span>ISBN: {book.isbn}</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 mb-1">借阅须知</p>
                <ul className="text-xs text-amber-700 space-y-1">
                  <li>• 借阅期限：自确认之日起14天</li>
                  <li>• 请爱护书籍，避免损坏或丢失</li>
                  <li>• 按时归还，逾期将影响您的信誉分</li>
                  <li>• 归还后请对 {userName} 进行评价</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
            <Calendar className="w-4 h-4 text-violet-500" />
            <span>预计归还日期：{new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')}</span>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="btn-press flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="btn-press flex-1 py-2.5 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors"
          >
            确认借阅
          </button>
        </div>
      </div>
    </div>
  )
}
