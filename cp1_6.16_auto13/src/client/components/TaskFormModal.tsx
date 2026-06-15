import { useState, useEffect } from 'react'
import Modal from './Modal'
import { taskDB } from '../services/dbService'
import type { Task, Priority, Category } from '../types'
import { PRIORITY_LABELS, CATEGORY_LABELS, REMIND_OPTIONS } from '../types'

interface TaskFormModalProps {
  isOpen: boolean
  onClose: () => void
  task?: Task | null
  onSaved?: () => void
}

export default function TaskFormModal({ isOpen, onClose, task, onSaved }: TaskFormModalProps) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [category, setCategory] = useState<Category>('work')
  const [remindMinutes, setRemindMinutes] = useState(0)

  const isEditing = !!task

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDueDate(task.dueDate.slice(0, 16))
      setPriority(task.priority)
      setCategory(task.category)
      setRemindMinutes(task.remindMinutes || 0)
    } else {
      setTitle('')
      const now = new Date()
      now.setHours(now.getHours() + 1)
      now.setMinutes(0)
      setDueDate(now.toISOString().slice(0, 16))
      setPriority('medium')
      setCategory('work')
      setRemindMinutes(0)
    }
  }, [task, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const taskData = {
      title: title.trim(),
      dueDate: new Date(dueDate).toISOString(),
      priority,
      category,
      remindMinutes: remindMinutes || undefined,
      completed: task?.completed || false
    }

    if (isEditing && task) {
      await taskDB.update(task.id, taskData)
    } else {
      await taskDB.add(taskData)
    }

    onSaved?.()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? '编辑任务' : '新建任务'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            任务标题
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入任务标题..."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg 
              focus:ring-2 focus:ring-blue-500 focus:border-transparent 
              transition-all duration-300 outline-none"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            截止时间
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg 
              focus:ring-2 focus:ring-blue-500 focus:border-transparent 
              transition-all duration-300 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              优先级
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                transition-all duration-300 outline-none bg-white"
            >
              {(['high', 'medium', 'low'] as Priority[]).map(p => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}优先级
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              分类
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                transition-all duration-300 outline-none bg-white"
            >
              {(['work', 'study', 'life'] as Category[]).map(c => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            提醒设置
          </label>
          <select
            value={remindMinutes}
            onChange={(e) => setRemindMinutes(Number(e.target.value))}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg 
              focus:ring-2 focus:ring-blue-500 focus:border-transparent 
              transition-all duration-300 outline-none bg-white"
          >
            {REMIND_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 
              rounded-lg hover:bg-gray-50 transition-all duration-300 font-medium"
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg 
              hover:bg-blue-700 transition-all duration-300 font-medium
              hover:shadow-lg active:scale-95"
          >
            {isEditing ? '保存修改' : '创建任务'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
