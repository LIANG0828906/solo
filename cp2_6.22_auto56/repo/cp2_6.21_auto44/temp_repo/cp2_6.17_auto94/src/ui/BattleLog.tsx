import React, { useEffect, useRef } from 'react'
import { useGameStore } from '@/stores/gameStore'

export const BattleLog: React.FC = () => {
  const { battleLog } = useGameStore()
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [battleLog])

  return (
    <div className="battle-log h-[120px] bg-[var(--log-bg)]/90 backdrop-blur-sm rounded-tl-[8px] rounded-tr-[8px] border-t border-l border-r border-[var(--cell-border)] overflow-hidden">
      <div className="h-full overflow-y-auto p-3 flex flex-col gap-1">
        {battleLog.map((log, index) => (
          <div
            key={index}
            className={`text-[12px] leading-[1.4] animate-fadeIn ${
              index === battleLog.length - 1 ? 'text-[var(--log-highlight)] font-medium' : 'text-white'
            }`}
          >
            {log}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  )
}

export default BattleLog
