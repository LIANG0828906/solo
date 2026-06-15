import React, { useEffect, useMemo } from 'react'
import styled from '@emotion/styled'
import { motion } from 'framer-motion'
import { Trophy, Target, Clock, Skull, Heart, Zap, Home } from 'lucide-react'
import { cyberTheme } from '@/styles/theme'
import { useGameStore } from '@/store/useGameStore'
import { CyberButton } from './CyberButton'
import { sfx } from '@/utils/soundEffects'
import { useNavigate } from 'react-router-dom'

const Overlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: radial-gradient(
    ellipse at center,
    rgba(10, 14, 39, 0.85) 0%,
    rgba(10, 14, 39, 0.98) 100%
  );
  backdrop-filter: blur(6px);
`

const Panel = styled(motion.div)`
  position: relative;
  width: 100%;
  max-width: 820px;
  max-height: 92vh;
  overflow: hidden;
  background: linear-gradient(
    180deg,
    ${cyberTheme.colors.bgMid} 0%,
    ${cyberTheme.colors.bgDeep} 100%
  );
  border: 1.5px solid ${cyberTheme.colors.neonCyan}55;
  clip-path: ${cyberTheme.clipPaths.sharpCutAll};
  box-shadow: 0 0 48px ${cyberTheme.colors.neonCyan}22, inset 0 0 48px rgba(0, 255, 255, 0.03);
  display: flex;
  flex-direction: column;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: linear-gradient(
      45deg,
      transparent 48%,
      rgba(0, 255, 255, 0.04) 49%,
      rgba(139, 0, 255, 0.04) 51%,
      transparent 52%
    );
    background-size: 24px 24px;
    pointer-events: none;
    opacity: 0.5;
  }
`

const Header = styled.div`
  padding: 24px 32px 18px;
  border-bottom: 1.5px solid ${cyberTheme.colors.neonPurple}33;
  text-align: center;
  position: relative;
  z-index: 1;

  &::after {
    content: '';
    position: absolute;
    left: 20%;
    right: 20%;
    bottom: -1px;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      ${cyberTheme.colors.neonCyan} 50%,
      transparent 100%
    );
  }
`

const Title = styled(motion.h1)<{ $win: boolean }>`
  font-family: ${cyberTheme.fonts.display};
  font-size: 42px;
  font-weight: 900;
  letter-spacing: 0.18em;
  color: ${({ $win }) => ($win ? cyberTheme.colors.neonCyan : cyberTheme.colors.neonRedSoft)};
  text-shadow: 0 0 12px
      ${({ $win }) => ($win ? cyberTheme.colors.neonCyan : cyberTheme.colors.neonRedSoft)}88,
    0 0 36px ${({ $win }) => ($win ? cyberTheme.colors.neonCyan : cyberTheme.colors.neonRedSoft)}44;
  margin-bottom: 6px;
`

const Sub = styled.div`
  font-family: ${cyberTheme.fonts.body};
  font-size: 14px;
  letter-spacing: 0.12em;
  color: ${cyberTheme.colors.textSecondary};
  text-transform: uppercase;
`

const WinnerRow = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 14px;
  padding: 10px 22px;
  display: inline-flex;
  background: linear-gradient(
    90deg,
    rgba(255, 215, 0, 0.1),
    rgba(255, 215, 0, 0.22),
    rgba(255, 215, 0, 0.1)
  );
  border: 1px solid ${cyberTheme.colors.neonGold}66;
  clip-path: ${cyberTheme.clipPaths.notched};
  box-shadow: 0 0 20px ${cyberTheme.colors.neonGold}22;
`

const Body = styled.div`
  padding: 22px 32px;
  overflow: auto;
  flex: 1;
  position: relative;
  z-index: 1;
`

const SectionTitle = styled.div`
  font-family: ${cyberTheme.fonts.display};
  font-size: 13px;
  letter-spacing: 0.2em;
  color: ${cyberTheme.colors.neonPurpleSoft};
  margin-bottom: 12px;
  padding-left: 12px;
  border-left: 3px solid ${cyberTheme.colors.neonPurple};
  text-transform: uppercase;
`

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 24px;
`

const StatCard = styled.div`
  padding: 14px 16px;
  background: ${cyberTheme.colors.bgDeep}77;
  border: 1px solid ${cyberTheme.colors.borderGlow};
  clip-path: ${cyberTheme.clipPaths.notched};

  svg {
    color: ${cyberTheme.colors.neonCyan};
    filter: drop-shadow(0 0 4px currentColor);
  }
`

const StatLabel = styled.div`
  font-family: ${cyberTheme.fonts.body};
  font-size: 11px;
  color: ${cyberTheme.colors.textMuted};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-top: 6px;
`

const StatNum = styled.div<{ $color?: string }>`
  font-family: ${cyberTheme.fonts.display};
  font-size: 24px;
  font-weight: 900;
  color: ${({ $color }) => $color ?? cyberTheme.colors.neonCyan};
  text-shadow: 0 0 8px ${({ $color }) => ($color ?? cyberTheme.colors.neonCyan) + '88'};
`

const RobotList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const RobotRow = styled.div<{ $isWinner: boolean; $alive: boolean }>`
  display: grid;
  grid-template-columns: 32px 1.5fr 0.8fr 0.8fr 0.8fr 1fr;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: ${({ $isWinner }) =>
    $isWinner ? 'rgba(255, 215, 0, 0.08)' : cyberTheme.colors.bgDeep + 'aa'};
  border: 1px solid
    ${({ $isWinner, $alive }) =>
      $isWinner
        ? cyberTheme.colors.neonGold + '88'
        : $alive
          ? cyberTheme.colors.borderGlow
          : cyberTheme.colors.neonRed + '44'};
  clip-path: ${cyberTheme.clipPaths.notched};
  transition: all 150ms ease;
  opacity: ${({ $alive }) => ($alive ? 1 : 0.65)};
`

const Dot = styled.div<{ $color: string }>`
  width: 14px;
  height: 14px;
  background: ${({ $color }) => $color};
  box-shadow: 0 0 8px ${({ $color }) => $color};
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
`

const RName = styled.div`
  font-family: ${cyberTheme.fonts.display};
  font-size: 13px;
  letter-spacing: 0.08em;
  color: ${cyberTheme.colors.textPrimary};
`

const RStat = styled.div<{ $color?: string }>`
  font-family: ${cyberTheme.fonts.display};
  font-size: 13px;
  font-weight: 700;
  color: ${({ $color }) => $color ?? cyberTheme.colors.textSecondary};
  text-align: center;
`

const ColHeader = styled(RobotRow)`
  padding: 6px 14px;
  background: transparent;
  border: none;
  margin-bottom: 4px;

  ${RStat}, ${RName} {
    font-size: 10px;
    color: ${cyberTheme.colors.textMuted};
    letter-spacing: 0.18em;
  }
`

const Bar = styled.div<{ $ratio: number; $color: string }>`
  position: relative;
  height: 8px;
  background: ${cyberTheme.colors.bgDeep};
  border: 1px solid ${cyberTheme.colors.borderGlow};
  overflow: hidden;

  div {
    height: 100%;
    width: ${({ $ratio }) => Math.max(0, Math.min(1, $ratio)) * 100}%;
    background: linear-gradient(
      90deg,
      ${({ $color }) => $color}cc 0%,
      ${({ $color }) => $color} 100%
    );
    box-shadow: 0 0 8px ${({ $color }) => $color}88;
    transition: width 500ms cubic-bezier(0.16, 1, 0.3, 1);
  }
`

const Footer = styled.div`
  padding: 16px 32px 22px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  border-top: 1px solid ${cyberTheme.colors.neonCyan}22;
  position: relative;
  z-index: 1;
`

export const BattleReport: React.FC = () => {
  const { phase, winner, robots, latestSnapshot, turn, resetAll, replayIndex, gotoReplayIndex } =
    useGameStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (phase === 'ended') {
      sfx.victory()
      setTimeout(() => gotoReplayIndex(0), 600)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  if (phase !== 'ended' && phase !== 'replay') return null

  void latestSnapshot
  void replayIndex

  const { totalTurns, playerWon, maxDmg, mostSurvived } = useMemo(() => {
    const totalTurns = Math.max(1, turn)
    const player = robots.find((r) => r.isPlayer)
    const playerWon = winner?.isPlayer ?? false
    const dmgVals = robots.map((r) => r.totalDamage)
    const maxDmg = Math.max(1, ...dmgVals)
    const survs = robots.map((r) => r.survivedTurns)
    const mostSurvived = Math.max(1, ...survs)
    return { totalTurns, playerWon, maxDmg, mostSurvived, player }
  }, [turn, winner, robots])

  const sorted = [...robots].sort((a, b) => {
    if (a.hp > 0 && b.hp <= 0) return -1
    if (a.hp <= 0 && b.hp > 0) return 1
    return b.survivedTurns - a.survivedTurns || b.totalDamage - a.totalDamage
  })

  return (
    <Overlay initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Panel initial={{ scale: 0.92, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}>
        <Header>
          <Title $win={playerWon} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            {playerWon ? '✦ VICTORY ✦' : '✧ DEFEAT ✧'}
          </Title>
          <Sub>// 战斗结束 · BATTLE TERMINATED · 对战报告已生成 //</Sub>
          {winner && (
            <div style={{ marginTop: 12 }}>
              <WinnerRow
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Trophy color={cyberTheme.colors.neonGold} size={22} />
                <span
                  style={{
                    fontFamily: cyberTheme.fonts.display,
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: cyberTheme.colors.neonGold,
                    textShadow: `0 0 8px ${cyberTheme.colors.neonGold}88`
                  }}
                >
                  {winner.name}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: cyberTheme.colors.textSecondary,
                    letterSpacing: '0.1em'
                  }}
                >
                  // 最终胜利者
                </span>
              </WinnerRow>
            </div>
          )}
        </Header>

        <Body>
          <SectionTitle>◢ 战斗总览 · OVERVIEW</SectionTitle>
          <StatGrid>
            <StatCard>
              <Clock size={20} />
              <StatLabel>总回合数</StatLabel>
              <StatNum>{totalTurns}</StatNum>
            </StatCard>
            <StatCard>
              <Target size={20} color={cyberTheme.colors.neonRedSoft} />
              <StatLabel>最高伤害输出</StatLabel>
              <StatNum $color={cyberTheme.colors.neonRedSoft}>{maxDmg}</StatNum>
            </StatCard>
            <StatCard>
              <Skull size={20} color={cyberTheme.colors.neonPurpleSoft} />
              <StatLabel>最长存活回合</StatLabel>
              <StatNum $color={cyberTheme.colors.neonPurpleSoft}>{mostSurvived}</StatNum>
            </StatCard>
          </StatGrid>

          <SectionTitle>◢ 机库战绩 · COMBATANTS</SectionTitle>
          <ColHeader $isWinner={false} $alive>
            <Dot $color="transparent" />
            <RName>单位名称</RName>
            <RStat>状态</RStat>
            <RStat>伤害</RStat>
            <RStat>存活</RStat>
            <RStat>输出曲线</RStat>
          </ColHeader>
          <RobotList>
            {sorted.map((r) => {
              const isWinner = winner?.id === r.id
              const hpRatio = r.hp / r.stats.maxHp
              return (
                <RobotRow key={r.id} $isWinner={isWinner} $alive={r.hp > 0}>
                  <Dot $color={r.color} />
                  <div>
                    <RName style={r.isPlayer ? { color: cyberTheme.colors.neonCyan } : undefined}>
                      {r.name}
                      {r.isPlayer && (
                        <span style={{ marginLeft: 8, fontSize: 10, opacity: 0.7 }}>
                          [YOU]
                        </span>
                      )}
                    </RName>
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.1em',
                        color: cyberTheme.colors.textMuted,
                        marginTop: 2
                      }}
                    >
                      {r.type.toUpperCase()} · HP {r.hp}/{r.stats.maxHp}
                    </div>
                  </div>
                  <RStat $color={r.hp > 0 ? cyberTheme.colors.neonGreen : cyberTheme.colors.neonRedSoft}>
                    {r.hp > 0 ? 'ALIVE' : 'K.O.'}
                  </RStat>
                  <RStat
                    $color={
                      r.totalDamage === maxDmg
                        ? cyberTheme.colors.neonGold
                        : cyberTheme.colors.textPrimary
                    }
                  >
                    {r.totalDamage}
                  </RStat>
                  <RStat>{r.survivedTurns}T</RStat>
                  <div>
                    <Bar $ratio={r.totalDamage / Math.max(1, maxDmg)} $color={r.color}>
                      <div />
                    </Bar>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 4
                      }}
                    >
                      <Heart size={10} color={cyberTheme.colors.neonGreenSoft} />
                      <Bar $ratio={hpRatio} $color={cyberTheme.colors.neonGreen}>
                        <div />
                      </Bar>
                    </div>
                  </div>
                </RobotRow>
              )
            })}
          </RobotList>

          <div style={{ marginTop: 18, fontSize: 12, color: cyberTheme.colors.textMuted }}>
            <Zap size={12} style={{ display: 'inline', verticalAlign: -2 }} /> 使用底部时间轴拖动回放，可查看每一回合的机器人位置与行动指令
          </div>
        </Body>

        <Footer>
          <CyberButton
            size="md"
            variant="ghost"
            leftIcon={<Home size={16} />}
            onClick={() => {
              resetAll()
              navigate('/')
            }}
          >
            返回大厅
          </CyberButton>
          <CyberButton
            size="md"
            variant="secondary"
            leftIcon={<Zap size={16} />}
            onClick={() => {
              resetAll()
            }}
          >
            再来一局
          </CyberButton>
        </Footer>
      </Panel>
    </Overlay>
  )
}
