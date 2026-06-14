import React from 'react'
import { motion } from 'framer-motion'
import styled from '@emotion/styled'
import { Play, RotateCcw, Home } from 'lucide-react'
import { cyberTheme } from '@/styles/theme'
import { CyberButton } from './CyberButton'
import { useGameStore } from '@/store/useGameStore'
import { useNavigate } from 'react-router-dom'

const Overlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  backdrop-filter: grayscale(0.8) brightness(0.6) blur(3px);
  -webkit-backdrop-filter: grayscale(0.8) brightness(0.6) blur(3px);
  background: rgba(10, 14, 39, 0.75);
  gap: 36px;
`

const PauseIconWrap = styled.div`
  position: relative;
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border: 2px solid ${cyberTheme.colors.neonCyan}66;
    border-radius: 50%;
    animation: glowPulse 2s ease-in-out infinite;
    box-shadow: 0 0 32px ${cyberTheme.colors.neonCyan}44, inset 0 0 32px ${cyberTheme.colors.neonCyan}22;
  }
`

const Bars = styled(motion.div)`
  display: flex;
  gap: 20px;
  color: ${cyberTheme.colors.neonCyan};

  span {
    display: block;
    width: 26px;
    height: 84px;
    background: ${cyberTheme.colors.neonCyan};
    clip-path: polygon(0 0, 100% 10%, 100% 90%, 0 100%);
    box-shadow: 0 0 12px ${cyberTheme.colors.neonCyan}, 0 0 32px ${cyberTheme.colors.neonCyan}88;
  }
`

const Title = styled(motion.h2)`
  font-family: ${cyberTheme.fonts.display};
  font-size: 48px;
  font-weight: 900;
  letter-spacing: 0.2em;
  color: ${cyberTheme.colors.neonCyan};
  text-shadow: 0 0 12px ${cyberTheme.colors.neonCyan}, 0 0 36px ${cyberTheme.colors.neonCyan}88;
`

const Subtitle = styled.p`
  font-family: ${cyberTheme.fonts.body};
  font-size: 15px;
  color: ${cyberTheme.colors.textSecondary};
  letter-spacing: 0.1em;
  margin-top: -20px;
`

const ButtonRow = styled.div`
  display: flex;
  gap: 16px;
`

export const PauseOverlay: React.FC = () => {
  const { phase, resumeGame, resetAll } = useGameStore()
  const navigate = useNavigate()

  if (phase !== 'paused') return null

  const goHome = () => {
    resetAll()
    navigate('/')
  }

  return (
    <Overlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <PauseIconWrap>
        <Bars
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}
        >
          <span />
          <span />
        </Bars>
      </PauseIconWrap>

      <Title initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
        SYSTEM PAUSED
      </Title>
      <Subtitle>// 系统已暂停 - 可编辑指令序列，变更将在下一回合生效 //</Subtitle>

      <ButtonRow initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
        <CyberButton
          size="lg"
          variant="primary"
          leftIcon={<Play size={20} />}
          onClick={resumeGame}
        >
          继续对战
        </CyberButton>
        <CyberButton
          size="lg"
          variant="secondary"
          leftIcon={<RotateCcw size={18} />}
          onClick={resetAll}
        >
          重置对局
        </CyberButton>
        <CyberButton size="lg" variant="ghost" leftIcon={<Home size={18} />} onClick={goHome}>
          返回大厅
        </CyberButton>
      </ButtonRow>
    </Overlay>
  )
}
