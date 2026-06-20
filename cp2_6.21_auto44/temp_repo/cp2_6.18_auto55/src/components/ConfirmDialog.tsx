import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmColor?: 'blue' | 'red'
  showInput?: boolean
  inputPlaceholder?: string
  inputValue?: string
  onInputChange?: (value: string) => void
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  confirmColor = 'blue',
  showInput = false,
  inputPlaceholder = '',
  inputValue = '',
  onInputChange,
  onConfirm,
  onCancel,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter' && showInput) onConfirm()
    }
    window.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    if (showInput && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }

    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onCancel, onConfirm, showInput])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-200"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-[90%] max-w-sm p-6 transform transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors duration-200"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-gray-600 text-sm mb-4">{message}</p>

        {showInput && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange?.(e.target.value)}
            placeholder={inputPlaceholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onConfirm()
              }
            }}
          />
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors duration-200 ${
              confirmColor === 'red'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
