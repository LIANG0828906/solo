import { useState, useEffect } from 'react'
import { useLetterStore } from '@/stores/letterStore'
import { Moon, Mail, Send } from 'lucide-react'
import PhotoUploader from '@/components/PhotoUploader'

const MOOD_CONFIG = {
  happy: { label: '快乐', color: '#FFD93D' },
  calm: { label: '平静', color: '#78C2AD' },
  sad: { label: '忧伤', color: '#A29BFE' },
  miss: { label: '思念', color: '#FF6B6B' },
} as const

type MoodKey = keyof typeof MOOD_CONFIG

export default function LetterEditor() {
  const { selectedMood, setSelectedMood, weatherEmoji, setWeatherEmoji, createLetter } = useLetterStore()
  const [toEmail, setToEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [sendDate, setSendDate] = useState('')
  const [photo, setPhoto] = useState<string | undefined>()
  const [successMsg, setSuccessMsg] = useState(false)

  useEffect(() => {
    fetch('/api/weather')
      .then(r => r.json())
      .then(data => setWeatherEmoji(data.emoji || '🌙'))
      .catch(() => {})
  }, [setWeatherEmoji])

  const moonPhase = ((Date.now() / 1000 - 947178840) / 86400) % 29.53
  const moonProgress = moonPhase / 29.53
  const moonIllumination = moonProgress <= 0.5 ? moonProgress * 2 : (1 - moonProgress) * 2

  const getMoonGradient = () => {
    if (moonProgress <= 0.5) {
      const litPercent = moonIllumination * 100
      return `linear-gradient(to right, #1A1A2E ${100 - litPercent}%, #F0E68C ${100 - litPercent}%)`
    }
    const litPercent = moonIllumination * 100
    return `linear-gradient(to right, #F0E68C ${litPercent}%, #1A1A2E ${litPercent}%)`
  }

  const handleSubmit = async () => {
    if (!toEmail || !subject || !content || !sendDate || !selectedMood) return
    await createLetter({
      toEmail,
      subject,
      content,
      sendDate,
      mood: selectedMood,
      photo,
    })
    setToEmail('')
    setSubject('')
    setContent('')
    setSendDate('')
    setPhoto(undefined)
    setSelectedMood(null)
    setSuccessMsg(true)
    setTimeout(() => setSuccessMsg(false), 3000)
  }

  const canSubmit = !!(toEmail && subject && content && sendDate && selectedMood)

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="text-right text-sm text-[#A29BFE] mb-4">
        今日天气: {weatherEmoji}
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Moon size={16} className="text-[#F0E68C]" />
          <span className="text-xs text-[#A29BFE]">月相周期</span>
        </div>
        <div
          className="w-10 h-10 rounded-full"
          style={{
            background: getMoonGradient(),
            animation: 'moonGlow 3s ease infinite, moonPulse 4s ease infinite',
          }}
        />
        <div className="w-48 h-1 rounded-full mt-3 overflow-hidden" style={{ background: '#2D2D44' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${moonProgress * 100}%`,
              background: 'linear-gradient(to right, #2D2D44, #F0E68C)',
            }}
          />
        </div>
        <span className="text-xs text-[#A29BFE] mt-1">
          第 {Math.floor(moonPhase)} / 29 天
        </span>
      </div>

      <div className="space-y-4 w-[70%] mx-auto max-[768px]:w-[90%]">
        <div>
          <label className="text-sm text-[#A29BFE] mb-1 flex items-center gap-1">
            <Mail size={14} /> 收件人邮箱
          </label>
          <input
            type="email"
            value={toEmail}
            onChange={e => setToEmail(e.target.value)}
            className="w-full bg-[#2D2D44] border border-[#3A3A5E] rounded-lg px-3 py-2 text-[#E0E0E0] outline-none transition-all duration-300 ease-smooth focus:border-[#6C5CE7] focus:shadow-[0_0_12px_rgba(108,92,231,0.3)]"
            placeholder="future-you@email.com"
          />
        </div>

        <div>
          <label className="text-sm text-[#A29BFE] mb-1 block">主题</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full bg-[#2D2D44] border border-[#3A3A5E] rounded-lg px-3 py-2 text-[#E0E0E0] outline-none transition-all duration-300 ease-smooth focus:border-[#6C5CE7] focus:shadow-[0_0_12px_rgba(108,92,231,0.3)]"
            placeholder="给未来的一封信"
          />
        </div>

        <div>
          <label className="text-sm text-[#A29BFE] mb-1 block">预期寄出日期</label>
          <div
            className="inline-flex items-center rounded-full px-4 py-2 cursor-pointer"
            style={{ background: 'linear-gradient(to right, #FF6B6B, #FFD93D)' }}
          >
            <input
              type="date"
              value={sendDate}
              onChange={e => setSendDate(e.target.value)}
              className="bg-transparent text-[#1A1A2E] font-bold outline-none cursor-pointer"
            />
          </div>
          {sendDate && (
            <span
              className="ml-2 text-[#F0E68C] inline-block"
              style={{
                transform: 'scale(1.1)',
                transition: 'transform 0.3s ease',
              }}
            >
              {new Date(sendDate).toLocaleDateString('zh-CN')}
            </span>
          )}
        </div>
      </div>

      <div className="w-[70%] mx-auto mt-6 max-[768px]:w-[90%]">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-[#E0E0E0] outline-none min-h-[200px] transition-all duration-300 ease-smooth focus:border-[#6C5CE7] focus:shadow-[0_0_12px_rgba(108,92,231,0.5)]"
          style={{ backdropFilter: 'blur(12px)' }}
          placeholder="写下你想对未来的自己说的话..."
        />
      </div>

      <div className="flex justify-center gap-8 mt-6">
        {(Object.keys(MOOD_CONFIG) as Array<MoodKey>).map(mood => (
          <div key={mood} className="flex flex-col items-center gap-1">
            <button
              onClick={() => setSelectedMood(mood)}
              className="w-12 h-12 rounded-full transition-all duration-300 ease-smooth"
              style={{
                background: MOOD_CONFIG[mood].color,
                transform: selectedMood === mood ? 'scale(1.2)' : 'scale(1)',
                animation: selectedMood === mood ? 'moodBounce 0.3s ease' : 'none',
                boxShadow: selectedMood === mood ? `0 0 16px ${MOOD_CONFIG[mood].color}80` : 'none',
              }}
            />
            <span className="text-xs text-[#E0E0E0]">{MOOD_CONFIG[mood].label}</span>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <PhotoUploader mood={selectedMood} onPhotoReady={setPhoto} />
      </div>

      <div className="w-[70%] mx-auto mt-6 max-[768px]:w-[90%]">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-3 rounded-xl text-white font-bold transition-all duration-300 ease-smooth hover:scale-[1.02] hover:brightness-110 disabled:opacity-40 disabled:hover:scale-100"
          style={{
            background: canSubmit
              ? 'linear-gradient(to right, #6C5CE7, #A29BFE)'
              : '#3A3A5E',
          }}
        >
          <Send size={16} className="inline mr-2" />
          封存时光胶囊
        </button>
      </div>

      {successMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#2D2D44] border border-[#6C5CE7] rounded-xl px-6 py-3 text-[#A29BFE] shadow-lg z-50">
          🎉 时光胶囊已封存！
        </div>
      )}
    </div>
  )
}
