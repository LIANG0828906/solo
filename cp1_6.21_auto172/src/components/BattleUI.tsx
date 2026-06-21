import { useEffect, useState, useCallback, useRef } from 'react'
import { useCharacter } from '@/contexts/CharacterContext'
import { useRhythm } from '@/contexts/RhythmContext'
import { saveHealthTimeline } from '@/api/characterApi'

export default function BattleUI() {
  const { state: charState } = useCharacter()
  const { state: rhythmState, exportTimelineAsJson } = useRhythm()
  const [hpFlash, setHpFlash] = useState(false)
  const [comboBreakVisible, setComboBreakVisible] = useState(false)
  const [waveInfoFade, setWaveInfoFade] = useState(false)
  const prevHpRef = useRef(charState.characters[charState.activeCharacterId].hp)
  const prevWaveRef = useRef(rhythmState.currentWave)

  const activeChar = charState.characters[charState.activeCharacterId]
  const hpPercent = (activeChar.hp / activeChar.maxHp) * 100
  const comboCount = rhythmState.comboCount
  const comboMilestone = rhythmState.comboMilestone

  useEffect(() => {
    const currentHp = charState.characters[charState.activeCharacterId].hp
    if (currentHp < prevHpRef.current) {
      setHpFlash(true)
      const timer = setTimeout(() => setHpFlash(false), 200)
      prevHpRef.current = currentHp
      return () => clearTimeout(timer)
    }
    prevHpRef.current = currentHp
  }, [charState])

  useEffect(() => {
    if (rhythmState.comboBroken) {
      setComboBreakVisible(true)
      const timer = setTimeout(() => setComboBreakVisible(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [rhythmState.comboBroken])

  useEffect(() => {
    if (rhythmState.currentWave !== prevWaveRef.current) {
      setWaveInfoFade(true)
      const timer = setTimeout(() => setWaveInfoFade(false), 500)
      prevWaveRef.current = rhythmState.currentWave
      return () => clearTimeout(timer)
    }
  }, [rhythmState.currentWave])

  const handleExportTimeline = useCallback(() => {
    const json = exportTimelineAsJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `health-timeline-level-1-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [exportTimelineAsJson])

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const skillIconSize = isMobile ? 36 : 48
  const comboFontSize = isMobile ? 32 : 48

  const getSkillIcon = (skillId: string) => {
    switch (skillId) {
      case 'heavy_strike': return '⚔'
      case 'whirlwind': return '🌀'
      case 'war_cry': return '📢'
      case 'precise_shot': return '🎯'
      case 'multi_arrow': return '🏹'
      case 'dodge': return '💨'
      case 'heal': return '💚'
      case 'holy_bolt': return '✨'
      case 'shield': return '🛡'
      default: return '?'
    }
  }

  return (
    <div className="battle-ui">
      <div className="combo-counter" style={{ fontSize: `${comboFontSize}px` }}>
        <span
          className={`combo-number ${comboCount > 20 ? 'combo-glow' : ''} ${comboMilestone > 0 ? 'combo-milestone' : ''}`}
        >
          {comboCount > 0 ? comboCount : ''}
        </span>
        {comboCount > 0 && comboCount < 20 && (
          <span className="combo-label">COMBO</span>
        )}
        {comboCount >= 20 && (
          <span className="combo-label combo-label-gold">MEGA COMBO</span>
        )}
      </div>

      {comboBreakVisible && (
        <div className="combo-break-overlay">
          <span className="combo-break-text">连击中断</span>
        </div>
      )}

      <div className="hp-bar-container">
        <div className="hp-bar-bg">
          <div
            className={`hp-bar-fill ${hpFlash ? 'hp-flash' : ''}`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        <span className="hp-text">
          {activeChar.hp} / {activeChar.maxHp}
        </span>
      </div>

      <div className="character-name">
        {activeChar.name}
      </div>

      <div className="skill-bar">
        {activeChar.skills.map((skill, idx) => {
          const now = Date.now()
          const isOnCooldown = skill.currentCooldown !== 0 && now < skill.currentCooldown
          const cooldownRemaining = isOnCooldown ? Math.max(0, skill.currentCooldown - now) : 0
          const cooldownPercent = isOnCooldown ? (cooldownRemaining / skill.cooldown) * 100 : 0

          return (
            <div
              key={skill.id}
              className={`skill-icon ${!isOnCooldown ? 'skill-available' : ''}`}
              style={{
                width: `${skillIconSize}px`,
                height: `${skillIconSize}px`,
                fontSize: `${skillIconSize * 0.5}px`,
              }}
            >
              <span className="skill-emoji">{getSkillIcon(skill.id)}</span>
              {isOnCooldown && (
                <div
                  className="skill-cooldown-overlay"
                  style={{ height: `${cooldownPercent}%` }}
                />
              )}
              <span className="skill-key">{['Q', 'W', 'E'][idx]}</span>
            </div>
          )
        })}
      </div>

      <div className="character-switch-bar">
        {(['berserker', 'ranger', 'sage'] as const).map((id, idx) => (
          <div
            key={id}
            className={`switch-indicator ${id === charState.activeCharacterId ? 'switch-active' : ''}`}
          >
            <span className="switch-key">{idx + 1}</span>
          </div>
        ))}
      </div>

      <div className={`wave-info ${waveInfoFade ? 'wave-fade' : ''}`}>
        <span className="wave-text">WAVE {rhythmState.currentWave}/{rhythmState.totalWaves}</span>
        <span className="enemy-count">敌人: {rhythmState.enemiesRemaining}</span>
      </div>

      <div className="health-timeline-panel">
        <div className="timeline-header">
          <span className="timeline-title">血量时间轴</span>
          <button className="export-btn" onClick={handleExportTimeline}>
            导出JSON
          </button>
        </div>
        <canvas
          ref={canvasRef => {
            if (!canvasRef) return
            const ctx = canvasRef.getContext('2d')
            if (!ctx) return
            const timeline = rhythmState.healthTimeline
            const w = canvasRef.width
            const h = canvasRef.height
            ctx.clearRect(0, 0, w, h)
            ctx.fillStyle = 'rgba(10, 11, 30, 0.8)'
            ctx.fillRect(0, 0, w, h)
            if (timeline.length < 2) return
            const minTime = timeline[0].timestamp
            const maxTime = timeline[timeline.length - 1].timestamp
            const timeRange = maxTime - minTime || 1
            ctx.strokeStyle = '#EF4444'
            ctx.lineWidth = 2
            ctx.beginPath()
            for (let i = 0; i < timeline.length; i++) {
              const x = ((timeline[i].timestamp - minTime) / timeRange) * (w - 10) + 5
              const y = h - 5 - (timeline[i].hp / timeline[i].maxHp) * (h - 10)
              if (i === 0) ctx.moveTo(x, y)
              else ctx.lineTo(x, y)
            }
            ctx.stroke()
          }}
          width={200}
          height={60}
          className="timeline-canvas"
        />
      </div>
    </div>
  )
}
