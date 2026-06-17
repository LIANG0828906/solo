import { useEffect, useState } from 'react'
import { useSkillTreeStore } from '@/store/skillTreeStore'
import './LevelProgress.css'

export const LevelProgress = () => {
  const { level, currentLevelXp, xpToNext } = useSkillTreeStore()
  const [animate, setAnimate] = useState(false)
  const [prevLevel, setPrevLevel] = useState(level)

  useEffect(() => {
    if (level !== prevLevel) {
      setAnimate(true)
      setPrevLevel(level)
      const t = setTimeout(() => setAnimate(false), 1000)
      return () => clearTimeout(t)
    }
  }, [level, prevLevel])

  const percent = Math.min((currentLevelXp / xpToNext) * 100, 100)

  return (
    <div className="level-progress">
      <div className="level-info">
        <span className={`level-number ${animate ? 'level-up' : ''}`}>Lv.{level}</span>
        <span className="xp-text">
          {currentLevelXp} / {xpToNext} XP
        </span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
