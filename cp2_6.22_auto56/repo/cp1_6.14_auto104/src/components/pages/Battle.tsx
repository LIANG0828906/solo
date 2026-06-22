import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from '@emotion/styled'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/useGameStore'
import { cyberTheme } from '@/styles/theme'
import { StatusBar } from '@/components/ui/StatusBar'
import { Arena } from '@/components/arena/Arena'
import { CommandPanel } from '@/components/command/CommandPanel'
import { Timeline } from '@/components/ui/Timeline'
import { PauseOverlay } from '@/components/ui/PauseOverlay'
import { BattleReport } from '@/components/ui/BattleReport'

const BattleContainer = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: transparent;
  overflow: hidden;
`

const MainArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  min-height: 0;
  overflow: hidden;

  @media (max-width: ${cyberTheme.breakpoints.tablet}px) {
    flex-direction: column;
  }
`

const ArenaWrapper = styled(motion.div)<{ $paused: boolean }>`
  flex: 1;
  position: relative;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  filter: ${({ $paused }) =>
    $paused ? 'grayscale(0.8) brightness(0.65)' : 'grayscale(0) brightness(1)'};
  transition: filter 400ms ease;
`

const CommandPanelWrapper = styled.div`
  display: flex;
  flex-shrink: 0;

  @media (max-width: ${cyberTheme.breakpoints.tablet}px) {
    width: 100%;
  }
`

const TopLayer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 100;

  > * {
    pointer-events: auto;
  }
`

export const Battle: React.FC = () => {
  const navigate = useNavigate()
  const { phase, engine, createBattle, selectedRobotType } = useGameStore()

  useEffect(() => {
    if (phase === 'lobby') {
      navigate('/')
      return
    }
    if (engine.snapshots.length === 0 && selectedRobotType) {
      createBattle()
    }
  }, [phase, engine.snapshots.length, selectedRobotType, createBattle, navigate])

  const isPaused = phase === 'paused'

  return (
    <BattleContainer>
      <StatusBar />

      <MainArea>
        <ArenaWrapper $paused={isPaused} animate={{ filter: isPaused ? 'grayscale(0.8) brightness(0.65)' : 'grayscale(0) brightness(1)' }} transition={{ duration: 0.4 }}>
          <Arena />
        </ArenaWrapper>

        <CommandPanelWrapper>
          <CommandPanel />
        </CommandPanelWrapper>
      </MainArea>

      {(phase === 'ended' || phase === 'replay') && <Timeline />}

      <TopLayer>
        <PauseOverlay />
        <BattleReport />
      </TopLayer>
    </BattleContainer>
  )
}
