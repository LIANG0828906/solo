import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, AlignLeft, User, Clock, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAvatarColor, getPriorityColor } from '@/utils/helpers'
import type { Task, User as UserType } from '@/types'

type Priority = 'high' | 'medium' | 'low'

interface AddTaskFormProps {
  projectId: string
  members: UserType[]
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'order' | 'lastCheckinAt'>) => void
  onCancel: () => void
}

interface FormErrors {
  title?: string
  description?: string
  assigneeId?: string
  priority?: string
  estimatedHours?: string
}

const priorityConfig: Record<Priority, { label: string; dotColor: string; bg: string }> = {
  high: { label: '高', dotColor: 'bg-red-500', bg: 'bg-red-50 text-red-700 border-red-200' },
  medium: { label: '中', dotColor: 'bg-orange-500', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
  low: { label: '低', dotColor: 'bg-green-500', bg: 'bg-green-50 text-green-700 border-green-200' },
}

export default function AddTaskForm({ projectId, members, onSubmit, onCancel }: AddTaskFormProps) {
  const [title, set