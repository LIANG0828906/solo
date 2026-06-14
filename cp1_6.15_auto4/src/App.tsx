import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import SkillTagInput from '@/components/SkillTagInput'
import TeamRecommendationPanel from '@/components/TeamRecommendationPanel'
import CollaborationGraph from '@/components/CollaborationGraph'
import MemberFormModal from '@/components/MemberFormModal'
import { UserPlus, Sparkles, FolderKanban, Zap } from 'lucide-react'

export default function App() {
  const {
    fetchInitialData,
    projectName,
    setProjectName,
    requiredSkills,
    setRequiredSkills,
    bonusSkills,
    setBonusSkills,
    runRecommendation,
    setShowMemberModal,
    members,
  } = useAppStore()

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  const isDisabled = requiredSkills.length < 2

  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: 'rgba(15, 12, 41, 0.7)',
          borderColor: 'rgba(74, 237, 196, 0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl animate-pulse-slow"
              style={{
                background: 'linear-gradient(135deg, rgba(74, 237, 196, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                boxShadow: '0 0 30px -5px var(--mint-glow)',
              }}
            >
              <Sparkles size={24} style={{ color: 'var(--mint)' }} />
            </div>
            <div>
              <h1
                className="text-xl font-extrabold font-[Outfit] tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, var(--mint) 0%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                团队技能匹配与协作推荐系统
              </h1>
              <p className="text-xs text-[color:var(--text-muted)] mt-0.5">
                Team Skill Matching & Collaboration Recommendation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: 'rgba(10, 22, 40, 0.5)', border: '1px solid rgba(74, 237, 196, 0.1)' }}
            >
              <Zap size={15} style={{ color: 'var(--amber)' }} />
              <span className="text-sm text-[color:var(--text-secondary)]">
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {members.length}
                </span>{' '}
                位成员
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowMemberModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:scale-[1.03]"
              style={{
                background: 'linear-gradient(135deg, var(--mint-dark) 0%, var(--mint) 100%)',
                color: '#0a1628',
                boxShadow: '0 4px 24px -6px var(--mint-glow)',
              }}
            >
              <UserPlus size={17} />
              <span>添加成员</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-12 xl:col-span-3 space-y-6 animate-fadeInUp">
            <div className="glass-card">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="p-2.5 rounded-xl"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(251, 191, 36, 0.18) 0%, rgba(251, 191, 36, 0.06) 100%)',
                  }}
                >
                  <FolderKanban size={22} style={{ color: 'var(--amber)' }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">项目配置</h2>
                  <p className="text-xs text-[color:var(--text-muted)]">定义项目需求与技能</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[color:var(--text-secondary)]">
                    项目名称
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="例如：前端微服务重构项目"
                    className="w-full px-4 py-3 rounded-xl text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)] transition-all"
                    style={{
                      background: 'rgba(10, 22, 40, 0.5)',
                      border: '1px solid rgba(74, 237, 196, 0.12)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(74, 237, 196, 0.4)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(74, 237, 196, 0.12)'
                    }}
                  />
                </div>

                <SkillTagInput
                  title="必需技能"
                  skills={requiredSkills}
                  onChange={setRequiredSkills}
                  placeholder="输入必需技能，回车添加..."
                  priority="required"
                />

                <SkillTagInput
                  title="加分技能"
                  skills={bonusSkills}
                  onChange={setBonusSkills}
                  placeholder="输入加分技能，回车添加..."
                  priority="bonus"
                />

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={runRecommendation}
                    disabled={isDisabled}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-base font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 hover:shadow-xl hover:scale-[1.02]"
                    style={{
                      background: isDisabled
                        ? 'linear-gradient(135deg, rgba(74, 237, 196, 0.3) 0%, rgba(45, 212, 168, 0.3) 100%)'
                        : 'linear-gradient(135deg, var(--mint-dark) 0%, var(--mint) 50%, #6ff7d3 100%)',
                      color: '#0a1628',
                      boxShadow: isDisabled
                        ? 'none'
                        : '0 6px 30px -8px var(--mint-glow), inset 0 1px 0 rgba(255,255,255,0.2)',
                    }}
                  >
                    <Sparkles size={19} />
                    <span>生成团队推荐</span>
                  </button>
                  {isDisabled && (
                    <p className="text-xs text-center mt-2.5 text-[color:var(--text-muted)]">
                      请至少添加 2 个必需技能 ({requiredSkills.length}/2)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-12 xl:col-span-6 space-y-6 animate-fadeInUp" style={{ animationDelay: '80ms' }}>
            <div className="h-full min-h-[600px]">
              <TeamRecommendationPanel />
            </div>
          </div>

          <div className="md:col-span-12 xl:col-span-3 space-y-6 animate-fadeInUp" style={{ animationDelay: '160ms' }}>
            <div className="h-full min-h-[600px]">
              <CollaborationGraph />
            </div>
          </div>
        </div>
      </main>

      <MemberFormModal />
    </div>
  )
}
