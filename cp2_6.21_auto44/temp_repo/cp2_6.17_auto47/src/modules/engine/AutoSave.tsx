import { useEffect, useState, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'

interface AutoSaveProps {
  slotIndex: number
}

export default function AutoSave({ slotIndex }: AutoSaveProps) {
  const { currentNodeId, saveProgress, isSaving } = useGameStore()
  const [showIndicator, setShowIndicator] = useState(false)
  const prevNodeId = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (currentNodeId && currentNodeId !== prevNodeId.current) {
      prevNodeId.current = currentNodeId

      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      setShowIndicator(true)

      const save = async () => {
        await saveProgress(slotIndex)
      }

      save()

      timerRef.current = setTimeout(() => {
        setShowIndicator(false)
      }, 2000)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [currentNodeId, slotIndex, saveProgress])

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        opacity: showIndicator ? 1 : 0,
        transition: 'opacity 0.3s',
        pointerEvents: 'none',
        zIndex: 999,
      }}
    >
      {isSaving && (
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#6C5CE7',
            animation: 'pulse 1s infinite',
          }}
        />
      )}
      <span style={{ fontSize: '14px', color: '#B2BEC3' }}>
        {isSaving ? '自动保存中...' : '已保存'}
      </span>
    </div>
  )
}
