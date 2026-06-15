import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '@/store'
import { BookOpen, User, Shield } from 'lucide-react'

const api = axios.create({ timeout: 5000 })

export default function Login() {
  const [mode, setMode] = useState<'student' | 'teacher'>('student')
  const [name, setName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleStudentLogin = async () => {
    if (!name.trim() || !studentId.trim()) {
      setError('请填写姓名和学号')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/student/login', { name: name.trim(), studentId: studentId.trim() })
      login(res.data.data, 'student')
      navigate('/home')
    } catch {
      setError('登录失败，请检查信息')
    } finally {
      setLoading(false)
    }
  }

  const handleTeacherLogin = async () => {
    if (!teacherId.trim() || !password.trim()) {
      setError('请填写工号和密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/teacher/login', { teacherId: teacherId.trim(), password: password.trim() })
      login(res.data.data, 'teacher')
      navigate('/teacher')
    } catch {
      setError('登录失败，请检查信息')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    if (mode === 'student') handleStudentLogin()
    else handleTeacherLogin()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-lg p-8 relative"
        style={{
          background: 'linear-gradient(135deg, #FFF8DC 0%, #F5F0E1 50%, #FFF8DC 100%)',
          border: '3px solid #D4AF37',
          boxShadow: '0 8px 32px rgba(74,44,26,0.2), inset 0 0 60px rgba(212,175,55,0.05)',
        }}
      >
        <div
          className="absolute -top-1 left-0 right-0 h-3 rounded-t-lg"
          style={{ backgroundColor: '#D4AF37' }}
        />
        <div
          className="absolute -bottom-1 left-0 right-0 h-3 rounded-b-lg"
          style={{ backgroundColor: '#D4AF37' }}
        />

        <div className="text-center mb-8 mt-2">
          <BookOpen className="mx-auto mb-3 text-ancient-red" size={40} />
          <h1 className="font-title text-3xl text-ancient-brown tracking-widest">
            书院体能考核
          </h1>
          <div className="mt-2 h-px bg-gold opacity-50" />
        </div>

        <div className="flex mb-6 rounded-lg overflow-hidden border border-gold">
          <button
            className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm transition-colors ${
              mode === 'student' ? 'bg-ancient-brown text-white' : 'bg-ancient-input text-ancient-brown'
            }`}
            onClick={() => { setMode('student'); setError('') }}
          >
            <User size={16} />
            学子登录
          </button>
          <button
            className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm transition-colors ${
              mode === 'teacher' ? 'bg-ancient-brown text-white' : 'bg-ancient-input text-ancient-brown'
            }`}
            onClick={() => { setMode('teacher'); setError('') }}
          >
            <Shield size={16} />
            夫子登录
          </button>
        </div>

        <div className="space-y-4">
          {mode === 'student' ? (
            <>
              <div>
                <label className="block text-sm mb-1 text-ancient-brown">姓名</label>
                <input
                  className="input-ancient w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-ancient-brown">学号</label>
                <input
                  className="input-ancient w-full"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="请输入学号"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm mb-1 text-ancient-brown">工号</label>
                <input
                  className="input-ancient w-full"
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  placeholder="请输入工号"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-ancient-brown">密码</label>
                <input
                  className="input-ancient w-full"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-ancient-red text-sm text-center">{error}</p>
          )}

          <button
            className="btn-ancient w-full py-3 text-lg font-title tracking-wider"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </div>
      </div>
    </div>
  )
}
