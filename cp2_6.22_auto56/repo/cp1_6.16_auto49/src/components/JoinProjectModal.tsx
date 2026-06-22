import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Hash, Search, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Project } from '@/types'

interface JoinProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (projectId: string) => void
  projects: Project[]
}

interface FormErrors {
  inviteCode?: string
}

export default function JoinProjectModal({ isOpen, onClose, onSubmit, projects }: JoinProjectModalProps) {
  const [inviteCode, setInviteCode] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [foundProject, setFoundProject] = useState<Project | null>(null)

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
      setInviteCode('')
      setErrors({})
      setIsSubmitting(false)
      setIsSuccess(false)
      setFoundProject(null)
    }
  }, [isOpen])

  const validateInviteCode = (code: string): boolean => {
    const regex = /^\d{6}$/
    return regex.test(code)
  }

  const findProjectByCode = (code: string): Project | undefined => {
    return projects.find(p => p.inviteCode === code)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setInviteCode(value)
    setErrors({})

    if (value.length === 6) {
      if (validateInviteCode(value)) {
        const project = findProjectByCode(value)
        if (project) {
          setFoundProject(project)
        } else {
          setFoundProject(null)
          setErrors({ inviteCode: '未找到对应的项目，请检查邀请码' })
        }
      } else {
        setFoundProject(null)
        setErrors({ inviteCode: '邀请码格式不正确' })
      }
    } else {
      setFoundProject(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateInviteCode(inviteCode)) {
      setErrors({ inviteCode: '请输入6位数字邀请码' })
      return
    }

    const project = findProjectByCode(inviteCode)
    if (!project) {
      setErrors({ inviteCode: '未找到对应的项目，请检查邀请码' })
      return
    }

    setIsSubmitting(true)

    setTimeout(() => {
      onSubmit(project.id)
      setIsSuccess(true)
      setIsSubmitting(false)
    }, 500)
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
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
                  {isSuccess ? '加入成功' : '加入项目'}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {isSuccess ? (
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
                    <p className="text-gray-600 mb-2">成功加入项目！</p>
                    {foundProject && (
                      <p className="text-lg font-semibold text-gray-900 mb-6">
                        {foundProject.name}
                      </p>
                    )}
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
                        邀请码 <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={inviteCode}
                          onChange={handleInputChange}
                          placeholder="请输入6位数字邀请码"
                          maxLength={6}
                          className={cn(
                            'w-full pl-12 pr-4 py-4 text-2xl font-bold tracking-[0.5em] text-center border rounded-xl focus:outline-none focus:ring-2 transition-all',
                            errors.inviteCode
                              ? 'border-red-300 focus:ring-red-200'
                              : foundProject
                                ? 'border-green-300 focus:ring-green-200 bg-green-50'
                                : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'
                          )}
                        />
                        {inviteCode.length === 6 && !errors.inviteCode && foundProject && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          </div>
                        )}
                        {errors.inviteCode && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          </div>
                        )}
                      </div>
                      {errors.inviteCode && (
                        <p className="mt-1 text-sm text-red-500">{errors.inviteCode}</p>
                      )}
                    </div>

                    {foundProject && !errors.inviteCode && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-gray-50 rounded-xl p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Search className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{foundProject.name}</p>
                            <p className="text-sm text-gray-500 line-clamp-1">{foundProject.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

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
                        disabled={!foundProject || isSubmitting}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? '加入中...' : '加入项目'}
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
