import { useState, useEffect } from 'react'
import { useGameStore } from './store'

const RiddleCard = () => {
  const { currentModal, riddles, lanterns, actions } = useGameStore()
  const [answer, setAnswer] = useState('')
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const currentRiddle = riddles.find((r) => r.lanternId === currentModal.lanternId)
  const currentLantern = lanterns.find((l) => l.id === currentModal.lanternId)

  useEffect(() => {
    if (currentModal.isOpen) {
      setIsAnimating(true)
      setAnswer('')
      setMessage(null)
    }
  }, [currentModal.isOpen, currentModal.lanternId])

  const playBellSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)

      oscillator.onended = () => {
        audioContext.close()
      }
    } catch {
      console.log('Web Audio not supported')
    }
  }

  const handleSubmit = async () => {
    if (!currentModal.lanternId || !answer.trim()) return

    const isCorrect = await actions.verifyAnswer(currentModal.lanternId, answer.trim())

    if (isCorrect) {
      playBellSound()
      setMessage({ text: '恭喜！答案正确！', type: 'success' })
      setTimeout(() => {
        handleClose()
      }, 1500)
    } else {
      setMessage({ text: '答案不对，再想想吧~', type: 'error' })
    }
  }

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      actions.closeModal()
    }, 300)
  }

  if (!currentModal.isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleClose}
    >
      <div
        className={isAnimating ? 'card-enter' : 'card-exit'}
        style={{
          width: '320px',
          backgroundColor: '#FFF8E7',
          borderRadius: '12px',
          border: '2px solid #B8860B',
          padding: '24px',
          position: 'relative',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: currentLantern?.isLit ? '#FFD700' : '#D4A373',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'rotate 2s linear infinite',
              boxShadow: currentLantern?.isLit
                ? '0 0 15px #FFD700'
                : '0 0 8px rgba(212, 163, 115, 0.5)',
            }}
          >
            🏮
          </div>
        </div>

        <h3
          style={{
            textAlign: 'center',
            color: '#8B4513',
            marginBottom: '16px',
            fontSize: '18px',
          }}
        >
          第 {currentModal.lanternId} 号灯笼
        </h3>

        <div
          style={{
            backgroundColor: '#FDF5E6',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid #D4A373',
          }}
        >
          <p
            style={{
              color: '#5C4033',
              fontSize: '16px',
              lineHeight: '1.6',
              textAlign: 'center',
            }}
          >
            {currentRiddle?.riddle || '加载中...'}
          </p>
          <p
            style={{
              color: '#A0522D',
              fontSize: '12px',
              marginTop: '8px',
              textAlign: 'center',
            }}
          >
            提示：{currentRiddle?.hint}
          </p>
        </div>

        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="请输入你的答案"
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '2px solid #D4A373',
            fontSize: '14px',
            marginBottom: '12px',
            backgroundColor: '#FFFAF0',
            color: '#5C4033',
            outline: 'none',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubmit()
            }
          }}
        />

        {message && (
          <p
            style={{
              textAlign: 'center',
              marginBottom: '12px',
              color: message.type === 'success' ? '#228B22' : '#D35400',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {message.text}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            gap: '12px',
          }}
        >
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#F5DEB3',
              color: '#8B4513',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            关闭
          </button>
          <button
            onClick={handleSubmit}
            disabled={!answer.trim()}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: answer.trim() ? '#D35400' : '#D4A373',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: answer.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            揭晓
          </button>
        </div>
      </div>
    </div>
  )
}

export default RiddleCard
