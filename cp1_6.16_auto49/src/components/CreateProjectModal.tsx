import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, FileText, Hash, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateInviteCode, formatDate } from '@/utils/helpers'
import type { Project } from '@/types'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (project: Omit<Project, 'id' | 'createdAt' | 'memberIds' | 'inviteCode'>) => void
}

interface FormErrors {
  name?: string
  deadline?: string
  description?: string
}

export default function CreateProjectModal({ isOpen, onClose, onSubmit }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) {
      setName('')
      setDeadline('')
      setDescription('')
      setErrors({})
      setInviteCode(null)
      setIsSubmitting(false)
    }
  }, [isOpen])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!name.trim()) {
      newErrors.name = '请输入项目名称'
    } else if (name.trim().length > 50) {
      newErrors.name = '项目名称不能超过50个字符'
    }

    if (!deadline) {
      newErrors.deadline = '请选择截止日期'
    } else if (new Date(deadline) < new Date()) {
      newErrors.deadline = '截止日期不能早于今天'
    }

    if (!description.trim()) {
      newErrors.description = '请输入项目简介'
    } else if (description.trim().length > 200) {
      newErrors.description = '项目简介不能超过200个字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)

    const code = generateInviteCode()
    setInviteCode(code)

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      deadline: formatDate(deadline),
      creatorId: '',
      inviteCode: code,
    })
  }

  const handleClose = () => {
    if (!isSubmitting || inviteCode) {
      onClose()
    }
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  {inviteCode ? '创建成功' : '创建新项目'}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {inviteCode ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-6 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </motion.div>
                    <p className="text-gray-600 mb-4">项目创建成功！</p>
                    <p className="text-sm text-gray-500 mb-2">邀请码</p>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-xl mb-6"
                    >
                      <Hash className="w-5 h-5 text-blue-500" />
                      <span className="text-2xl font-bold text-gray-900 tracking-widest">
                        {inviteCode}
                      </span>
                    </motion.div>
                    <p className="text-xs text-gray-400 mb-6">
                      请将邀请码分享给团队成员，他们可以通过邀请码加入项目
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleClose}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                    >
                      完成
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="p-5 space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        项目名称 <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="请输入项目名称"
                          className={cn(
                            'w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all',
                            errors.name
                              ? 'border-red-300 focus:ring-red-200'
                              : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'
                          )}
                        />
                      </div>
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        截止日期 <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          min={getMinDate()}
                          className={cn(
                            'w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all',
                            errors.deadline
                              ? 'border-red-300 focus:ring-red-200'
                              : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'
                          )}
                        />
                      </div>
                      {errors.deadline && (
                        <p className="mt-1 text-sm text-red-500">{errors.deadline}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        项目简介 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="请输入项目简介，不超过200字"
                        rows={4}
                        className={cn(
                          'w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all resize-none',
                          errors.description
                            ? 'border-red-300 focus:ring-red-200'
                            : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'
                        )}
                      />
                      <div className="flex justify-between mt-1">
                        {errors.description ? (
                          <p className="text-sm text-red-500">{errors.description}</p>
                        ) : (
                          <span />
                        )}
                        <span className="text-xs text-gray-400">{description.length}/200</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleClose}
                        className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        取消
                      </motion.button>
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? '创建中...' : '创建项目'}
                      </motion.button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
