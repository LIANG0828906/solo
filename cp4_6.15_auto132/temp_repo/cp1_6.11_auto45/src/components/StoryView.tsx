import { useState } from 'react'
import { Member, Paragraph, RoomState } from '../types'
import { Clock, User, Calendar, ArrowLeft, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface StoryViewProps {
  room: RoomState
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function getInitials(name: string): string {
  return name.slice(0, 2)
}

export default function StoryView({ room }: StoryViewProps) {
  const navigate = useNavigate()
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const paragraphsWithMember: (Paragraph & { member?: Member })[] = room.paragraphs.map(
    (p) => ({
      ...p,
      member: room.members.find((m) => m.id === p.memberId),
    }),
  )

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/')}
        className="mb-6 flex items-center gap-2 text-ink/70 hover:text-ink transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span>返回首页</span>
      </button>

      <div className="text-center mb-10 animate-fadeIn">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent4/50 text-ink/80 text-sm mb-4">
          <Sparkles size={14} />
          <span>创作完成</span>
        </div>
        <h1 className="handwrite-title text-4xl md:text-5xl text-ink mb-3">{room.name}</h1>
        <p className="text-ink/60 flex items-center justify-center gap-2">
          <Calendar size={14} />
          <span>{formatDate(room.createdAt)}</span>
          <span>·</span>
          <User size={14} />
          <span>{room.members.length} 位创作者</span>
          <span>·</span>
          <span>{paragraphsWithMember.length} 个段落</span>
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <div className="paper-texture rounded-3xl p-8 md:p-10 border border-ink/10">
            <div className="space-y-8">
              {paragraphsWithMember.map((p, idx) => (
                <div
                  key={p.id}
                  className={`paragraph-highlight ${
                    hoveredIdx === idx ? 'hovered' : ''
                  } rounded-xl p-4 -mx-4`}
                  style={{
                    backgroundColor:
                      hoveredIdx === idx ? `${p.member?.color || '#fff'}80` : 'transparent',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white shadow-sm"
                      style={{
                        backgroundColor: p.member?.color || '#ccc',
                        color: '#2C2C2C',
                      }}
                    >
                      {getInitials(p.member?.nickname || '?')}
                    </div>
                    <span className="text-ink/70 text-sm">
                      {p.member?.nickname || '匿名'}
                    </span>
                    <span className="text-ink/40 text-sm">·</span>
                    <span className="text-ink/50 text-xs">第 {p.round} 轮</span>
                  </div>
                  <p
                    className="text-ink leading-loose whitespace-pre-wrap"
                    style={{
                      fontFamily: '"Ma Shan Zheng", cursive',
                      fontSize: '19px',
                      textIndent: '2em',
                    }}
                  >
                    {p.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 p-5 rounded-2xl bg-white/60 border border-ink/10">
            <h3 className="handwrite-title text-xl text-ink mb-4 flex items-center gap-2">
              <User size={18} />
              <span>创作者名单</span>
            </h3>
            <div className="flex flex-wrap gap-3">
              {room.members.map((m) => {
                const count = room.paragraphs.filter((p) => p.memberId === m.id).length
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-ink/10"
                    style={{ backgroundColor: `${m.color}60` }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white"
                      style={{ backgroundColor: m.color, color: '#2C2C2C' }}
                    >
                      {getInitials(m.nickname)}
                    </div>
                    <div>
                      <div className="text-ink font-medium text-sm">{m.nickname}</div>
                      <div className="text-ink/50 text-xs">{count} 段</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="w-full md:w-72 shrink-0">
          <div className="sticky top-6">
            <h3 className="handwrite-title text-xl text-ink mb-5 flex items-center gap-2">
              <Clock size={18} />
              <span>创作时间轴</span>
            </h3>
            <div className="relative pl-6">
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-ink/15" />
              <div className="space-y-5">
                {paragraphsWithMember.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`timeline-item relative ${
                      hoveredIdx === idx ? 'scale-105' : ''
                    }`}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <div
                      className={`absolute -left-4 top-1.5 w-4 h-4 rounded-full border-3 border-white shadow transition-all ${
                        hoveredIdx === idx ? 'scale-125' : ''
                      }`}
                      style={{
                        backgroundColor: p.member?.color || '#ccc',
                        borderWidth: '3px',
                      }}
                    />
                    <div
                      className={`p-3 rounded-xl border transition-all ${
                        hoveredIdx === idx
                          ? 'bg-white shadow-md border-ink/20 scale-105'
                          : 'bg-white/50 border-ink/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-ink/80 font-medium text-sm">
                          {p.member?.nickname || '匿名'}
                        </span>
                      </div>
                      <div className="text-ink/50 text-xs mb-2 flex items-center gap-1">
                        <Clock size={10} />
                        <span>{formatTime(p.submittedAt)}</span>
                        <span>·</span>
                        <span>第 {p.round} 轮</span>
                      </div>
                      <p className="text-ink/70 text-xs line-clamp-2 leading-relaxed">
                        {p.content.slice(0, 40)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
