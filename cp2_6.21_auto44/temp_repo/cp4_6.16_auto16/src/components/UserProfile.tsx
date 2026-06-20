import { useState } from 'react'
import {
  useFoodStore,
  Gender,
  GoalType,
  UserProfile as UserProfileType,
  GOAL_LABELS,
} from '../store/foodStore'

interface UserProfileProps {
  isFirstTime: boolean
  onClose: () => void
}

const TOTAL_STEPS = 4

export default function UserProfile({ isFirstTime, onClose }: UserProfileProps) {
  const { profile, setProfile, calculateTarget } = useFoodStore()

  const [step, setStep] = useState(isFirstTime ? 1 : 0)
  const [gender, setGender] = useState<Gender>(profile?.gender ?? 'male')
  const [age, setAge] = useState<string>(profile ? String(profile.age) : '')
  const [height, setHeight] = useState<string>(profile ? String(profile.height) : '')
  const [weight, setWeight] = useState<string>(profile ? String(profile.weight) : '')
  const [goal, setGoal] = useState<GoalType>(profile?.goal ?? 'maintain')

  const tempProfile: UserProfileType | null =
    age && height && weight
      ? {
          gender,
          age: parseInt(age),
          height: parseInt(height),
          weight: parseInt(weight),
          goal,
        }
      : null

  const tempTarget = tempProfile ? calculateTarget(tempProfile) : null

  const canNext = () => {
    switch (step) {
      case 1:
        return true
      case 2:
        return age && parseInt(age) > 0 && parseInt(age) < 120
      case 3:
        return (
          height &&
          parseInt(height) > 0 &&
          parseInt(height) < 300 &&
          weight &&
          parseInt(weight) > 0 &&
          parseInt(weight) < 500
        )
      case 4:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS && canNext()) {
      setStep(step + 1)
    }
  }

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = () => {
    if (!tempProfile) return
    setProfile(tempProfile)
    onClose()
  }

  const handleEditSubmit = () => {
    if (!tempProfile) return
    setProfile(tempProfile)
    onClose()
  }

  const renderWizardStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="fade-in">
            <div className="wizard-section-title">欢迎使用饮食日记 🥗</div>
            <div className="wizard-section-subtitle">首先，请告诉我们您的性别</div>
            <div className="gender-options">
              <div
                className={`gender-option ${gender === 'male' ? 'selected' : ''}`}
                onClick={() => setGender('male')}
              >
                <div className="gender-emoji">👨</div>
                <div className="gender-label">男性</div>
              </div>
              <div
                className={`gender-option ${gender === 'female' ? 'selected' : ''}`}
                onClick={() => setGender('female')}
              >
                <div className="gender-emoji">👩</div>
                <div className="gender-label">女性</div>
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="fade-in">
            <div className="wizard-section-title">您的年龄是？</div>
            <div className="wizard-section-subtitle">帮助我们更精准地计算代谢率</div>
            <div className="form-rows">
              <div className="form-group">
                <label className="form-label">年龄</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    className="form-input"
                    placeholder="25"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    autoFocus
                  />
                  <span className="input-unit">岁</span>
                </div>
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="fade-in">
            <div className="wizard-section-title">身高和体重</div>
            <div className="wizard-section-subtitle">这些信息用于计算您的每日热量需求</div>
            <div className="form-rows">
              <div className="form-group">
                <label className="form-label">身高</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    className="form-input"
                    placeholder="170"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    autoFocus
                  />
                  <span className="input-unit">cm</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">体重</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    className="form-input"
                    placeholder="65"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                  <span className="input-unit">kg</span>
                </div>
              </div>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="fade-in">
            <div className="wizard-section-title">您的目标是什么？</div>
            <div className="wizard-section-subtitle">我们将为您定制专属营养方案</div>
            <div className="goal-options">
              <div
                className={`goal-option ${goal === 'lose' ? 'selected' : ''}`}
                onClick={() => setGoal('lose')}
              >
                <div className="goal-emoji">🔥</div>
                <div className="goal-info">
                  <div className="goal-name">减脂</div>
                  <div className="goal-desc">
                    适当控制热量摄入，高蛋白饮食助您减少脂肪
                  </div>
                </div>
              </div>
              <div
                className={`goal-option ${goal === 'gain' ? 'selected' : ''}`}
                onClick={() => setGoal('gain')}
              >
                <div className="goal-emoji">💪</div>
                <div className="goal-info">
                  <div className="goal-name">增肌</div>
                  <div className="goal-desc">
                    提供充足热量和蛋白质，帮助肌肉生长与恢复
                  </div>
                </div>
              </div>
              <div
                className={`goal-option ${goal === 'maintain' ? 'selected' : ''}`}
                onClick={() => setGoal('maintain')}
              >
                <div className="goal-emoji">⚖️</div>
                <div className="goal-info">
                  <div className="goal-name">保持</div>
                  <div className="goal-desc">
                    均衡营养配比，维持当前健康体重和状态
                  </div>
                </div>
              </div>
            </div>

            {tempTarget && (
              <div className="summary-card fade-in" style={{ marginTop: '24px' }}>
                <div className="summary-row">
                  <span className="summary-label">每日推荐摄入</span>
                  <span className="summary-value">{GOAL_LABELS[goal]}模式</span>
                </div>
                <div className="summary-calories">
                  <div className="summary-calories-label">每日目标热量</div>
                  <div className="summary-calories-value">
                    {tempTarget.calories}
                    <span style={{ fontSize: '16px' }}> 千卡</span>
                  </div>
                </div>
                <div className="summary-macros">
                  <div className="summary-macro">
                    <div className="summary-macro-label">蛋白质</div>
                    <div className="summary-macro-value">{tempTarget.protein}g</div>
                  </div>
                  <div className="summary-macro">
                    <div className="summary-macro-label">碳水</div>
                    <div className="summary-macro-value">{tempTarget.carbs}g</div>
                  </div>
                  <div className="summary-macro">
                    <div className="summary-macro-label">脂肪</div>
                    <div className="summary-macro-value">{tempTarget.fat}g</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  const renderEditMode = () => (
    <div className="edit-profile-content fade-in">
      <div className="wizard-section-title">个人档案</div>
      <div className="wizard-section-subtitle">修改信息后将自动更新您的营养目标</div>

      <div className="gender-options" style={{ gap: '12px' }}>
        <div
          className={`gender-option ${gender === 'male' ? 'selected' : ''}`}
          onClick={() => setGender('male')}
        >
          <div className="gender-emoji" style={{ fontSize: '36px' }}>👨</div>
          <div className="gender-label">男性</div>
        </div>
        <div
          className={`gender-option ${gender === 'female' ? 'selected' : ''}`}
          onClick={() => setGender('female')}
        >
          <div className="gender-emoji" style={{ fontSize: '36px' }}>👩</div>
          <div className="gender-label">女性</div>
        </div>
      </div>

      <div className="form-rows" style={{ maxWidth: '100%', margin: '20px 0', gap: '14px' }}>
        <div className="form-group">
          <label className="form-label">年龄</label>
          <div className="input-with-unit">
            <input
              type="number"
              className="form-input"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            <span className="input-unit">岁</span>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">身高</label>
          <div className="input-with-unit">
            <input
              type="number"
              className="form-input"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
            <span className="input-unit">cm</span>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">体重</label>
          <div className="input-with-unit">
            <input
              type="number"
              className="form-input"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <span className="input-unit">kg</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 600, color: '#2E2E2E' }}>
        当前目标
      </div>
      <div className="goal-options" style={{ maxWidth: '100%', gap: '10px' }}>
        <div
          className={`goal-option ${goal === 'lose' ? 'selected' : ''}`}
          onClick={() => setGoal('lose')}
          style={{ padding: '14px' }}
        >
          <div className="goal-emoji" style={{ width: '48px', height: '48px', fontSize: '28px' }}>🔥</div>
          <div className="goal-info">
            <div className="goal-name" style={{ fontSize: '14px' }}>减脂</div>
          </div>
        </div>
        <div
          className={`goal-option ${goal === 'gain' ? 'selected' : ''}`}
          onClick={() => setGoal('gain')}
          style={{ padding: '14px' }}
        >
          <div className="goal-emoji" style={{ width: '48px', height: '48px', fontSize: '28px' }}>💪</div>
          <div className="goal-info">
            <div className="goal-name" style={{ fontSize: '14px' }}>增肌</div>
          </div>
        </div>
        <div
          className={`goal-option ${goal === 'maintain' ? 'selected' : ''}`}
          onClick={() => setGoal('maintain')}
          style={{ padding: '14px' }}
        >
          <div className="goal-emoji" style={{ width: '48px', height: '48px', fontSize: '28px' }}>⚖️</div>
          <div className="goal-info">
            <div className="goal-name" style={{ fontSize: '14px' }}>保持</div>
          </div>
        </div>
      </div>

      {tempTarget && (
        <div className="summary-card fade-in" style={{ marginTop: '20px', padding: '18px' }}>
          <div className="summary-calories" style={{ marginTop: '0', marginBottom: '12px', padding: '12px' }}>
            <div className="summary-calories-label">每日目标热量</div>
            <div className="summary-calories-value" style={{ fontSize: '28px' }}>
              {tempTarget.calories} 千卡
            </div>
          </div>
          <div className="summary-macros" style={{ marginTop: '0' }}>
            <div className="summary-macro">
              <div className="summary-macro-label">蛋白质</div>
              <div className="summary-macro-value" style={{ fontSize: '16px' }}>{tempTarget.protein}g</div>
            </div>
            <div className="summary-macro">
              <div className="summary-macro-label">碳水</div>
              <div className="summary-macro-value" style={{ fontSize: '16px' }}>{tempTarget.carbs}g</div>
            </div>
            <div className="summary-macro">
              <div className="summary-macro-label">脂肪</div>
              <div className="summary-macro-value" style={{ fontSize: '16px' }}>{tempTarget.fat}g</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const isEditMode = !isFirstTime

  return (
    <div className="modal-overlay" onClick={isEditMode ? onClose : undefined}>
      <div
        className="modal-content fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: isEditMode ? '480px' : '520px' }}
      >
        <div className="modal-header">
          <div className="modal-title">
            {isEditMode ? '👤 个人档案' : '🎉 设置向导'}
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {isEditMode ? (
          renderEditMode()
        ) : (
          <>
            <div className="wizard-steps">
              {[1, 2, 3, 4].map((s) => (
                <>
                  <div
                    key={s}
                    className={`wizard-step ${s < step ? 'done' : ''} ${s === step ? 'active' : ''}`}
                  >
                    {s < step ? '✓' : s}
                  </div>
                  {s < 4 && (
                    <div
                      key={`line-${s}`}
                      className={`wizard-line ${s < step ? 'done' : ''}`}
                    />
                  )}
                </>
              ))}
            </div>

            <div className="wizard-content">{renderWizardStep()}</div>

            <div className="wizard-actions">
              {step > 1 && (
                <button className="btn btn-outline" onClick={handlePrev}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  上一步
                </button>
              )}
              {step < TOTAL_STEPS && (
                <button
                  className="btn btn-primary"
                  onClick={handleNext}
                  disabled={!canNext()}
                >
                  下一步
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              )}
              {step === TOTAL_STEPS && (
                <button
                  className="btn btn-accent"
                  onClick={handleSubmit}
                  disabled={!tempProfile}
                >
                  ✓ 开始记录饮食
                </button>
              )}
            </div>
          </>
        )}

        {isEditMode && (
          <div style={{ marginTop: '20px' }}>
            <button
              className="btn btn-primary btn-block"
              onClick={handleEditSubmit}
              disabled={!tempProfile}
            >
              保存修改
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
