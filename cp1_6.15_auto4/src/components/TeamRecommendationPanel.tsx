import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Users, Sparkles, Star, Award, UserCheck, TrendingUp } from 'lucide-react'

interface CountUpScoreProps {
  value: number
  duration?: number
}

function CountUpScore({ value, duration = 1000 }: CountUpScoreProps) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number>()

  useEffect(() => {
    const startTime = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(value * eased)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  return <>{display.toFixed(1)}</>
}

interface AnimatedWidthBarProps {
  value: number
  children: React.ReactNode
}

function AnimatedWidthBar({ value, children }: AnimatedWidthBarProps) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setWidth(value), 100)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div
      className="h-full rounded-full transition-all duration-[1200ms] ease-out overflow-hidden"
      style={{ width: `${width}%` }}
    >
      {children}
    </div>
  )
}

function StarRating({ proficiency }: { proficiency: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          fill={i < proficiency ? 'var(--amber)' : 'none'}
          style={{ color: i < proficiency ? 'var(--amber)' : 'rgba(107, 122, 153, 0.4)' }}
        />
      ))}
    </div>
  )
}

export default function TeamRecommendationPanel() {
  const {
    recommendations,
    isLoading,
    selectedMember,
    setSelectedMember,
    setHighlightMemberId,
    collaborations,
  } = useAppStore()

  const formatScore = (score: number) => score.toFixed(1)

  const getCollabStats = (memberId: string) => {
    const memberCollabs = collaborations.filter(
      (c) => c.memberIdA === memberId || c.memberIdB === memberId
    )
    const totalProjects = memberCollabs.reduce((sum, c) => sum + c.projectCount, 0)
    const uniqueMembers = new Set<string>()
    memberCollabs.forEach((c) => {
      if (c.memberIdA === memberId) uniqueMembers.add(c.memberIdB)
      else uniqueMembers.add(c.memberIdA)
    })
    let label = '协作较少'
    if (totalProjects >= 10) label = '协作非常活跃'
    else if (totalProjects >= 5) label = '协作较多'
    else if (totalProjects >= 2) label = '协作正常'
    return { totalProjects, uniqueMembers: uniqueMembers.size, label }
  }

  if (isLoading) {
    return (
      <div className="glass-card h-full flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="p-2.5 rounded-xl"
            style={{ background: 'linear-gradient(135deg, rgba(74, 237, 196, 0.2) 0%, rgba(45, 212, 168, 0.1) 100%)' }}
          >
            <Sparkles size={22} style={{ color: 'var(--mint)' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold">团队推荐结果</h2>
            <p className="text-sm text-[color:var(--text-muted)]">正在加载数据...</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse-slow text-center">
            <Users size={48} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
            <p className="text-[color:var(--text-muted)]">加载中，请稍候...</p>
          </div>
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="glass-card h-full flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="p-2.5 rounded-xl"
            style={{ background: 'linear-gradient(135deg, rgba(74, 237, 196, 0.2) 0%, rgba(45, 212, 168, 0.1) 100%)' }}
          >
            <Sparkles size={22} style={{ color: 'var(--mint)' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold">团队推荐结果</h2>
            <p className="text-sm text-[color:var(--text-muted)]">等待项目配置</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-xs">
            <Users size={56} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-lg font-semibold mb-2 text-[color:var(--text-secondary)]">尚未生成推荐</h3>
            <p className="text-sm text-[color:var(--text-muted)] leading-relaxed">
              在左侧面板填写项目名称并添加至少 2 个必需技能，然后点击"生成推荐"按钮查看结果。
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl"
            style={{ background: 'linear-gradient(135deg, rgba(74, 237, 196, 0.2) 0%, rgba(45, 212, 168, 0.1) 100%)' }}
          >
            <Sparkles size={22} style={{ color: 'var(--mint)' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold">团队推荐结果</h2>
            <p className="text-sm text-[color:var(--text-muted)]">
              共找到 {recommendations.length} 位匹配成员
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 -mr-1">
        {recommendations.map((rec, index) => {
          const isSelected = selectedMember?.id === rec.member.id
          const rank = index + 1
          const collabStats = getCollabStats(rec.member.id)

          return (
            <div
              key={rec.member.id}
              className="rounded-xl cursor-pointer transition-all animate-fadeInUp"
              style={{
                animationDelay: `${index * 80}ms`,
              }}
              onClick={() => {
                setSelectedMember(isSelected ? null : rec.member)
                setHighlightMemberId(isSelected ? null : rec.member.id)
              }}
            >
              <div
                className={`p-4 rounded-xl transition-all ${
                  isSelected ? '' : 'hover:scale-[1.01]'
                }`}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(74, 237, 196, 0.12) 0%, rgba(45, 212, 168, 0.06) 100%)'
                    : 'rgba(10, 22, 40, 0.3)',
                  border: isSelected
                    ? '1px solid rgba(74, 237, 196, 0.4)'
                    : '1px solid rgba(74, 237, 196, 0.08)',
                  boxShadow: isSelected ? '0 0 0 2px var(--mint-glow)' : 'none',
                }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg"
                        style={{
                          background: 'linear-gradient(135deg, var(--mint-dark) 0%, var(--mint) 100%)',
                          color: '#0a1628',
                        }}
                      >
                        {rec.member.name.charAt(0).toUpperCase()}
                      </div>
                      {rank <= 3 && (
                        <div
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                          style={{
                            background: rank === 1
                              ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                              : rank === 2
                              ? 'linear-gradient(135deg, #94a3b8, #64748b)'
                              : 'linear-gradient(135deg, #d97706, #b45309)',
                            color: '#0a1628',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                          }}
                        >
                          {rank}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{rec.member.name}</h3>
                      <p className="text-xs text-[color:var(--text-muted)]">
                        {rec.member.skills.length} 项技能
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-2xl font-extrabold font-[Outfit]"
                      style={{ color: 'var(--mint)' }}
                    >
                      <CountUpScore value={rec.score} />
                    </div>
                    <p className="text-xs text-[color:var(--text-muted)]">匹配度</p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium" style={{ color: 'var(--mint)' }}>
                      综合匹配度
                    </span>
                    <span className="text-xs font-medium text-[color:var(--text-secondary)]">
                      {formatScore(rec.score)}%
                    </span>
                  </div>
                  <div className="h-[10px] rounded-full overflow-hidden bg-black/30">
                    <AnimatedWidthBar value={rec.score}>
                      <div className="progress-ripple h-full" />
                    </AnimatedWidthBar>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[color:var(--text-muted)] w-16">技能匹配</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden bg-black/30">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${rec.skillOverlapScore}%`,
                          background: 'linear-gradient(90deg, var(--mint-dark), var(--mint))',
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium w-12 text-right text-[color:var(--text-secondary)]">
                      {formatScore(rec.skillOverlapScore)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[color:var(--text-muted)] w-16">协作经验</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden bg-black/30">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${rec.collaborationScore}%`,
                          background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium w-12 text-right text-[color:var(--text-secondary)]">
                      {formatScore(rec.collaborationScore)}
                    </span>
                  </div>
                </div>

                {rec.matchedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {rec.matchedSkills.map((skill, i) => (
                      <span
                        key={`${skill}-${i}`}
                        className="px-2 py-0.5 rounded-md text-xs font-medium"
                        style={{
                          background: 'rgba(74, 237, 196, 0.12)',
                          color: 'var(--mint)',
                          border: '1px solid rgba(74, 237, 196, 0.2)',
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="overflow-hidden transition-all duration-500 ease-out"
                style={{
                  maxHeight: isSelected ? '1000px' : '0px',
                  opacity: isSelected ? 1 : 0,
                }}
              >
                <div
                  className="mx-4 mb-4 p-4 rounded-xl border-t-0"
                  style={{
                    background: 'rgba(10, 22, 40, 0.5)',
                    border: '1px solid rgba(74, 237, 196, 0.12)',
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Award size={16} style={{ color: 'var(--mint)' }} />
                    <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      个人信息
                    </h4>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-[color:var(--text-muted)] mb-2 font-medium">技能熟练度</p>
                    <div className="grid grid-cols-1 gap-2">
                      {rec.member.skills.map((s, i) => (
                        <div
                          key={`${s.name}-${i}`}
                          className="flex items-center justify-between py-1.5 px-2.5 rounded-lg"
                          style={{ background: 'rgba(74, 237, 196, 0.05)' }}
                        >
                          <span className="text-sm font-medium text-[color:var(--text-secondary)]">
                            {s.name}
                          </span>
                          <StarRating proficiency={s.proficiency} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-[color:var(--text-muted)] mb-2 font-medium">协作统计</p>
                    <div className="space-y-2">
                      <div
                        className="flex items-center justify-between py-2 px-3 rounded-lg"
                        style={{ background: 'rgba(139, 92, 246, 0.08)' }}
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUp size={14} style={{ color: '#a78bfa' }} />
                          <span className="text-sm text-[color:var(--text-secondary)]">
                            过往协作项目数
                          </span>
                        </div>
                        <span
                          className="text-sm font-bold"
                          style={{ color: '#a78bfa' }}
                        >
                          {collabStats.totalProjects}
                        </span>
                      </div>

                      <div
                        className="flex items-center justify-between py-2 px-3 rounded-lg"
                        style={{ background: 'rgba(74, 237, 196, 0.06)' }}
                      >
                        <div className="flex items-center gap-2">
                          <UserCheck size={14} style={{ color: 'var(--mint)' }} />
                          <span className="text-sm text-[color:var(--text-secondary)]">
                            协作成员数
                          </span>
                        </div>
                        <span
                          className="text-sm font-bold"
                          style={{ color: 'var(--mint)' }}
                        >
                          {collabStats.uniqueMembers}
                        </span>
                      </div>

                      <div
                        className="flex items-center justify-between py-2 px-3 rounded-lg"
                        style={{
                          background: collabStats.totalProjects >= 5
                            ? 'rgba(251, 191, 36, 0.1)'
                            : 'rgba(107, 122, 153, 0.08)',
                        }}
                      >
                        <span className="text-sm text-[color:var(--text-secondary)]">
                          协作频次标签
                        </span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: collabStats.totalProjects >= 5
                              ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1))'
                              : 'rgba(107, 122, 153, 0.15)',
                            color: collabStats.totalProjects >= 5 ? 'var(--amber)' : 'var(--text-muted)',
                            border: collabStats.totalProjects >= 5
                              ? '1px solid rgba(251, 191, 36, 0.3)'
                              : '1px solid rgba(107, 122, 153, 0.2)',
                          }}
                        >
                          {collabStats.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
