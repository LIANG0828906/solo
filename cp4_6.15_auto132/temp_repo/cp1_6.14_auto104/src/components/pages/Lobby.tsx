import React, { useEffect } from 'react'
import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Swords, Zap, Info, Terminal, PlayCircle } from 'lucide-react'
import { ROBOT_TYPES, COMMANDS, COMMAND_ORDER, COMMAND_SLOTS } from '@/config/gameConfig'
import { cyberTheme } from '@/styles/theme'
import { RobotCard } from '@/components/lobby/RobotCard'
import { CyberButton } from '@/components/ui/CyberButton'
import { useGameStore } from '@/store/useGameStore'
import * as ICONS from 'lucide-react'
import { sfx } from '@/utils/soundEffects'
import type { LucideIcon } from 'lucide-react'

const LobbyWrap = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: auto;
  z-index: 1;
`

const Container = styled(motion.div)`
  max-width: 1280px;
  margin: 0 auto;
  padding: 40px 32px 64px;
`

const Header = styled.header`
  text-align: center;
  margin-bottom: 42px;
`

const Brand = styled(motion.div)`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;

  svg {
    color: ${cyberTheme.colors.neonCyan};
    filter: drop-shadow(0 0 8px ${cyberTheme.colors.neonCyan});
  }
`

const Title = styled.h1`
  font-family: ${cyberTheme.fonts.display};
  font-size: 52px;
  font-weight: 900;
  letter-spacing: 0.16em;
  background: linear-gradient(
    90deg,
    ${cyberTheme.colors.neonCyan} 0%,
    ${cyberTheme.colors.neonPurpleSoft} 50%,
    ${cyberTheme.colors.neonCyan} 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: titleShift 4s linear infinite;
  text-shadow: 0 0 40px ${cyberTheme.colors.neonCyan}22;

  @keyframes titleShift {
    0% { background-position: 0% center; }
    100% { background-position: 200% center; }
  }
`

const Subtitle = styled.p`
  font-family: ${cyberTheme.fonts.body};
  font-size: 15px;
  letter-spacing: 0.4em;
  color: ${cyberTheme.colors.textSecondary};
  text-transform: uppercase;
  margin-top: 4px;
`

const Section = styled.section`
  margin-bottom: 44px;
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`

const SectionTitle = styled.h2`
  font-family: ${cyberTheme.fonts.display};
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: ${cyberTheme.colors.neonCyan};
  display: flex;
  align-items: center;
  gap: 10px;
  text-transform: uppercase;

  svg {
    color: ${cyberTheme.colors.neonPurpleSoft};
  }
`

const StepBadge = styled.div`
  font-family: ${cyberTheme.fonts.display};
  font-size: 11px;
  letter-spacing: 0.2em;
  padding: 5px 12px;
  background: ${cyberTheme.colors.neonPurple}18;
  color: ${cyberTheme.colors.neonPurpleSoft};
  border: 1px solid ${cyberTheme.colors.neonPurple}55;
  clip-path: ${cyberTheme.clipPaths.notched};
  text-transform: uppercase;
`

const RobotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;

  @media (max-width: ${cyberTheme.breakpoints.tablet}px) {
    grid-template-columns: 1fr;
    max-width: 480px;
    margin: 0 auto;
  }
`

const CTAWrap = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
  margin-bottom: 40px;
`

const CommandsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 12px;
  padding: 20px;
  background: linear-gradient(
    180deg,
    ${cyberTheme.colors.bgMid}aa 0%,
    ${cyberTheme.colors.bgDeep}cc 100%
  );
  border: 1px solid ${cyberTheme.colors.borderGlow};
  clip-path: ${cyberTheme.clipPaths.sharpCutAll};

  @media (max-width: ${cyberTheme.breakpoints.tablet}px) {
    grid-template-columns: repeat(2, 1fr);
  }
`

const CmdCard = styled(motion.div)<{ $color: string }>`
  position: relative;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: ${({ $color }) => $color + '08'};
  border: 1px solid ${({ $color }) => $color + '33'};
  clip-path: ${cyberTheme.clipPaths.notched};
  transition: all 200ms ease;

  &:hover {
    background: ${({ $color }) => $color + '14'};
    border-color: ${({ $color }) => $color + '88'};
    transform: translateY(-2px);
    box-shadow: 0 8px 20px ${({ $color }) => $color + '22'};
  }

  svg {
    color: ${({ $color }) => $color};
    filter: drop-shadow(0 0 4px ${({ $color }) => $color + 'aa'});
  }
`

const CmdLabel = styled.span<{ $color: string }>`
  font-family: ${cyberTheme.fonts.display};
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: ${({ $color }) => $color};
`

const CmdCn = styled.span`
  font-size: 11px;
  color: ${cyberTheme.colors.textSecondary};
`

const CmdDesc = styled.span`
  font-size: 10px;
  line-height: 1.4;
  color: ${cyberTheme.colors.textMuted};
  text-align: center;
  margin-top: 2px;
`

const InfoBox = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 16px;

  @media (max-width: ${cyberTheme.breakpoints.tablet}px) {
    grid-template-columns: 1fr;
  }
`

const InfoCard = styled.div`
  padding: 16px 18px;
  background: linear-gradient(
    135deg,
    ${cyberTheme.colors.neonPurple}0a 0%,
    transparent 60%
  );
  border: 1px solid ${cyberTheme.colors.borderGlow};
  clip-path: ${cyberTheme.clipPaths.notched};

  h4 {
    font-family: ${cyberTheme.fonts.display};
    font-size: 12px;
    letter-spacing: 0.2em;
    color: ${cyberTheme.colors.neonCyanSoft};
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  p {
    font-size: 13px;
    color: ${cyberTheme.colors.textSecondary};
    line-height: 1.6;
  }
`

export const Lobby: React.FC = () => {
  const navigate = useNavigate()
  const { selectedRobotType, selectRobot, createBattle, playerCommands } = useGameStore()

  useEffect(() => {
    void playerCommands
  }, [playerCommands])

  const handleStart = () => {
    if (!selectedRobotType) return
    sfx.victory()
    createBattle()
    setTimeout(() => {
      navigate('/battle')
      setTimeout(() => useGameStore.getState().startGame(), 200)
    }, 250)
  }

  return (
    <LobbyWrap>
      <Container initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <Header>
          <Brand initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <LogoRow>
              <Terminal size={36} />
              <Title>CYBER ARENA</Title>
              <Swords size={36} />
            </LogoRow>
            <Subtitle>// 编程机器人竞技场 · VISUAL PROGRAMMING COMBAT //</Subtitle>
          </Brand>
        </Header>

        <Section>
          <SectionHeader>
            <SectionTitle>
              <Info size={18} /> 第一步 · 选择你的作战单位
            </SectionTitle>
            <StepBadge>STEP 01 / 03</StepBadge>
          </SectionHeader>
          <RobotGrid>
            {Object.values(ROBOT_TYPES).map((meta, i) => (
              <RobotCard
                key={meta.type}
                meta={meta}
                selected={selectedRobotType === meta.type}
                onSelect={selectRobot}
                index={i}
              />
            ))}
          </RobotGrid>
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>
              <Zap size={18} /> 第二步 · 了解指令库（{COMMAND_SLOTS} SLOTS / TURN）
            </SectionTitle>
            <StepBadge>STEP 02 / 03</StepBadge>
          </SectionHeader>
          <CommandsGrid>
            {COMMAND_ORDER.map((key, i) => {
              const cmd = COMMANDS[key]
              const IconComp = (ICONS as unknown as Record<string, LucideIcon>)[cmd.icon]
              return (
                <CmdCard
                  key={cmd.type}
                  $color={cmd.color}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onMouseEnter={() => sfx.hover()}
                >
                  {IconComp && <IconComp size={24} />}
                  <CmdLabel $color={cmd.color}>{cmd.label}</CmdLabel>
                  <CmdCn>{cmd.labelCn}</CmdCn>
                  <CmdDesc>{cmd.description}</CmdDesc>
                </CmdCard>
              )
            })}
          </CommandsGrid>
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>
              <PlayCircle size={18} /> 第三步 · 战斗流程
            </SectionTitle>
            <StepBadge>STEP 03 / 03</StepBadge>
          </SectionHeader>
          <InfoBox>
            <InfoCard>
              <h4>◢ 指令编排</h4>
              <p>
                进入战场后，从左侧指令库拖拽指令到右侧 {COMMAND_SLOTS} 个序列槽位。每回合机器人将按顺序执行。
              </p>
            </InfoCard>
            <InfoCard>
              <h4>◢ 回合执行</h4>
              <p>
                每回合所有机器人按速度值排序同时行动。速度越高越先行动。善用暂停随时调整策略。
              </p>
            </InfoCard>
            <InfoCard>
              <h4>◢ 胜利条件</h4>
              <p>消灭所有敌方机器人即可获胜。对局结束后可拖动时间轴回放完整战斗过程。</p>
            </InfoCard>
          </InfoBox>
        </Section>

        <AnimatePresence>
          {selectedRobotType && (
            <CTAWrap
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              <div
                style={{
                  fontFamily: cyberTheme.fonts.display,
                  fontSize: 13,
                  letterSpacing: '0.12em',
                  color: cyberTheme.colors.textSecondary
                }}
              >
                ✓ 已选择&nbsp;
                <span style={{ color: ROBOT_TYPES[selectedRobotType].color }}>
                  {ROBOT_TYPES[selectedRobotType].name}
                </span>
                &nbsp;·&nbsp;准备部署 · READY TO DEPLOY
              </div>
              <CyberButton
                size="lg"
                variant="primary"
                leftIcon={<Swords size={20} />}
                onClick={handleStart}
              >
                创建房间 · 开始对局
              </CyberButton>
            </CTAWrap>
          )}
        </AnimatePresence>
      </Container>
    </LobbyWrap>
  )
}
