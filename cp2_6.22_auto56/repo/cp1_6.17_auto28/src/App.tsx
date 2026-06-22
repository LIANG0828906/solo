import { useEffect } from 'react'
import FightStage from './FightStage'
import ControlPanel from './ControlPanel'
import CombatLog from './CombatLog'
import { useCombatStore, LogType } from './store'

const SKILL_EFFECTS: Record<string, { damageMultiplier: number; defenseBonus?: number; type: LogType }> = {
  '重斩': { damageMultiplier: 1.5, type: 'attack' },
  '旋风斩': { damageMultiplier: 1.2, type: 'attack' },
  '格挡': { damageMultiplier: 0.5, defenseBonus: 20, type: 'defense' },
  '火球': { damageMultiplier: 1.4, type: 'attack' },
  '冰锥': { damageMultiplier: 1.1, type: 'attack' },
  '护盾': { damageMultiplier: 0.4, defenseBonus: 25, type: 'defense' }
}

function App() {
  const { isFighting, round, showVictory, swordsman, mage, startFight, endFight, recordLog, resetFight, nextRound, applyDamage, setShowVictory } = useCombatStore()

  useEffect(() => {
    if (!isFighting) return

    const executeRound = () => {
      const swordsmanSkill = SKILL_EFFECTS[swordsman.skill]
      const mageSkill = SKILL_EFFECTS[mage.skill]

      const swordsmanBaseDamage = Math.floor(swordsman.attack * swordsmanSkill.damageMultiplier)
      const mageBaseDamage = Math.floor(mage.attack * mageSkill.damageMultiplier)

      const swordsmanDefense = swordsmanSkill.defenseBonus || 0
      const mageDefense = mageSkill.defenseBonus || 0

      const actualDamageToMage = Math.max(0, swordsmanBaseDamage - mageDefense)
      const actualDamageToSwordsman = Math.max(0, mageBaseDamage - swordsmanDefense)

      const swordsmanLogType = swordsmanSkill.type

      let swordsmanMsg = ''
      let mageMsg = ''

      if (swordsmanSkill.defenseBonus) {
        swordsmanMsg = `剑士使用${swordsman.skill}抵消${swordsmanDefense}点伤害`
      } else {
        swordsmanMsg = `剑士使用${swordsman.skill}造成${actualDamageToMage}点伤害`
      }

      if (mageSkill.defenseBonus) {
        mageMsg = `法师使用${mage.skill}抵消${mageDefense}点伤害`
      } else {
        mageMsg = `法师使用${mage.skill}造成${actualDamageToSwordsman}点伤害`
      }

      recordLog({
        round,
        type: swordsmanLogType,
        message: `回合${round}：${swordsmanMsg}，${mageMsg}`
      })

      applyDamage('mage', actualDamageToMage)
      applyDamage('swordsman', actualDamageToSwordsman)

      setTimeout(() => {
        const currentState = useCombatStore.getState()
        if (currentState.swordsman.currentHp <= 0 && currentState.mage.currentHp <= 0) {
          endFight('swordsman')
        } else if (currentState.swordsman.currentHp <= 0) {
          endFight('mage')
        } else if (currentState.mage.currentHp <= 0) {
          endFight('swordsman')
        } else {
          nextRound()
        }
      }, 1500)
    }

    const timer = setTimeout(executeRound, 500)
    return () => clearTimeout(timer)
  }, [isFighting, round, swordsman, mage, recordLog, applyDamage, endFight, nextRound])

  useEffect(() => {
    if (showVictory) {
      const timer = setTimeout(() => {
        setShowVictory(false)
        resetFight()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showVictory, setShowVictory, resetFight])

  const handleStart = () => {
    if (!isFighting && !showVictory) {
      startFight()
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '20px',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{
        color: '#fff',
        fontSize: '28px',
        fontWeight: 'bold',
        textShadow: '0 0 20px rgba(0, 191, 255, 0.5)',
        marginBottom: '8px',
        letterSpacing: '2px'
      }}>
        ⚔️ 决斗场模拟器 ⚔️
      </h1>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{ position: 'relative' }}>
          <FightStage />
          {isFighting && <div className="scanline-overlay" />}
        </div>
        <CombatLog />
      </div>

      <ControlPanel onStart={handleStart} disabled={isFighting || showVictory} />
    </div>
  )
}

export default App
