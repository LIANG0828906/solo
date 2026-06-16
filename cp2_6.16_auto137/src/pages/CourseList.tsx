import { useState } from 'react'
import { Plus, Palette } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { CourseView } from '@/modules/course/CourseView'
import { CourseManager } from '@/modules/course/CourseManager'
import { Modal } from '@/components/Modal'

const coverColors = [
  '#667eea',
  '#f093fb',
  '#4facfe',
  '#43e97b',
  '#fa709a',
  '#fee140',
  '#30cfd0',
  '#a8edea',
  '#ff9a9e',
  '#a18cd1',
]

export const CourseList = () => {
  const courses = useStore(state => state.courses)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coverColor: coverColors[0],
    scheduleTime: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.scheduleTime.trim()) return
    
    await CourseManager.create(formData)
    setFormData({ name: '', description: '', coverColor: coverColors[0], scheduleTime: '' })
    setIsModalOpen(false)
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
            我的课程
          </h1>
          <p className="text-gray-500">共 {courses.length} 门课程</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
        >
          <Plus size={20} />
          <span>创建课程</span>
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--card-border)' }}>
            <Palette size={40} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">还没有课程</h3>
          <p className="text-gray-500 mb-4">点击上方按钮创建你的第一门课程</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {courses.map((course, index) => (
            <CourseView key={course.id} course={course} index={index} />
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="创建新课程">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">课程名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：钢琴基础"
              className="w-full px-4 py-2.5 rounded-xl border-2 text-sm focus:outline-none transition-all duration-200"
              style={{ borderColor: 'var(--card-border)' }}
              onFocus={(e) => (e.target.style.borderColor = '#667eea')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--card-border)')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">课程描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="简要描述课程内容..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border-2 text-sm resize-none focus:outline-none transition-all duration-200"
              style={{ borderColor: 'var(--card-border)' }}
              onFocus={(e) => (e.target.style.borderColor = '#667eea')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--card-border)')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">封面颜色</label>
            <div className="flex flex-wrap gap-2">
              {coverColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, coverColor: color })}
                  className={`w-10 h-10 rounded-xl transition-all duration-200 hover:scale-110 ${
                    formData.coverColor === color ? 'ring-2 ring-offset-2 ring-purple-500 scale-110' : ''
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">上课时间</label>
            <input
              type="text"
              value={formData.scheduleTime}
              onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
              placeholder="例如：每周六 14:00-15:30"
              className="w-full px-4 py-2.5 rounded-xl border-2 text-sm focus:outline-none transition-all duration-200"
              style={{ borderColor: 'var(--card-border)' }}
              onFocus={(e) => (e.target.style.borderColor = '#667eea')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--card-border)')}
            />
          </div>

          <button
            type="submit"
            disabled={!formData.name.trim() || !formData.scheduleTime.trim()}
            className="w-full py-3 rounded-xl text-white font-medium transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
          >
            创建课程
          </button>
        </form>
      </Modal>
    </div>
  )
}
