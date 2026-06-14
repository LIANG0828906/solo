import React, { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { motion, useAnimation } from 'framer-motion'
import type { RobotType, RobotTypeMeta } from '@/core/types'
import { cyberTheme } from '@/styles/theme'
import { StatsBar } from './StatsBar'
import { ParticleBurst } from '@/components/ui/ParticleBurst'
import { Cpu, Shield, Gauge } from 'lucide-react'
import { sfx } from '@/utils/soundEffects'

interface RobotCardProps {
  meta: RobotTypeMeta
  selected: boolean
  onSelect: (t: RobotType) => void
  index: number
}

const Card = styled(motion.button)<{ $accent: string; $selected: boolean }>(
  ({ $accent, $selected }) => ({
    position: 'relative',
    width: '100%',
    padding: '26px 22px 22px',
    background: `linear-gradient(180deg, ${cyberTheme.colors.bgMid}cc 0%, ${cyberTheme.colors.bgDeep} 100%)`,
    border: `1.5px solid ${$selected ? $accent : cyberTheme.colors.borderGlow}`,
    clipPath: cyberTheme.clipPaths.sharpCutAll,
    cursor: 'pointer',
    overflow: 'hidden',
    isolation: 'isolate',
    transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
    textAlign: 'left',
    color: cyberTheme.colors.textPrimary,
    boxShadow: $selected
      ? `0 0 24px ${$accent}44, inset 0 0 32px ${$accent}18`
      : `inset 0 0 24px rgba(0, 255, 255, 0.03)`,
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      background: `linear-gradient(105deg, transparent 20%, ${$accent}08 40%, ${$accent}18 50%, ${$accent}08 60%, transparent 80%)`,
      transform: 'translateX(-120%)',
      zIndex: 2,
      pointerEvents: 'none'
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      background: `radial-gradient(circle at 50% 30%, ${$accent}0c 0%, transparent 60%)`,
      opacity: $selected ? 1 : 0,
      transition: 'opacity 300ms ease',
      zIndex: -1
    },
    '&:hover': {
      borderColor: `${$accent}bb`,
      transform: 'translateY(-4px)',
      boxShadow: `0 12px 36px ${$accent}22, 0 0 20px ${$accent}33, inset 0 0 24px ${$accent}10`,
      '&::before': {
        animation: 'scanSweep 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }
    }
  })
)

const Header = styled.div<{ $accent: string }>`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${({ $accent }) => $accent + '22'};
`

const TypeTag = styled.div<{ $accent: string }>`
  font-family: ${cyberTheme.fonts.display};
  font-size: 10px;
  letter-spacing: 0.25em;
  padding: 3px 10px;
  background: ${({ $accent }) => $accent + '14'};
  color: ${({ $accent }) => $accent};
  border: 1px solid ${({ $accent }) => $accent + '55'};
  text-transform: uppercase;
`

const RobotName = styled.h3<{ $accent: string; $selected: boolean }>`
  font-family: ${cyberTheme.fonts.display};
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: ${({ $accent, $selected }) => ($selected ? $accent : cyberTheme.colors.textPrimary)};
  text-shadow: ${({ $accent, $selected }) =>
    $selected ? `0 0 10px ${$accent}cc, 0 0 24px ${$accent}66` : 'none'};
  transition: all 200ms ease;
`

const CnName = styled.span`
  display: block;
  font-family: ${cyberTheme.fonts.body};
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.3em;
  color: ${cyberTheme.colors.textSecondary};
  margin-top: 3px;
`

const Illustration = styled(motion.div)<{ $accent: string }>`
  position: relative;
  height: 140px;
  margin: 10px 0 18px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 110px;
    height: 110px;
    filter: drop-shadow(0 0 16px ${({ $accent }) => $accent + '88'})
      drop-shadow(0 0 32px ${({ $accent }) => $accent + '33'});
  }
`

const GridBg = styled.div<{ $accent: string }>`
  position: absolute;
  inset: 0;
  background-image: linear-gradient(
      0deg,
      ${({ $accent }) => $accent + '10'} 1px,
      transparent 1px
    ),
    linear-gradient(90deg, ${({ $accent }) => $accent + '10'} 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: radial-gradient(circle at center, black 30%, transparent 80%);
  opacity: 0.7;
`

const Desc = styled.p`
  font-size: 13px;
  line-height: 1.55;
  color: ${cyberTheme.colors.textSecondary};
  margin-bottom: 16px;
  min-height: 40px;
`

const StatsWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 14px;
  border-top: 1px dashed ${cyberTheme.colors.borderGlow};
`

const CheckBadge = styled(motion.div)<{ $accent: string }>`
  position: absolute;
  top: 18px;
  right: 22px;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: ${cyberTheme.fonts.display};
  font-size: 12px;
  font-weight: 900;
  color: ${cyberTheme.colors.bgDeep};
  background: ${({ $accent }) => $accent};
  clip-path: polygon(
    50% 0,
    100% 25%,
    100% 75%,
    50% 100%,
    0 75%,
    0 25%
  );
  box-shadow: 0 0 12px ${({ $accent }) => $accent}aa;
`

const RobotSVG: React.FC<{ type: RobotType; color: string }> = ({ type, color }) => {
  const accent = color
  const dark = cyberTheme.colors.bgDeep
  const mid = cyberTheme.colors.bgMid
  if (type === 'scout') {
    return (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="60,14 82,38 82,72 60,96 38,72 38,38" fill={mid} stroke={accent} strokeWidth="2" />
        <polygon points="60,26 74,42 74,68 60,84 46,68 46,42" fill={dark} stroke={accent} strokeWidth="1.5" />
        <circle cx="60" cy="55" r="10" fill={accent} opacity="0.9" />
        <circle cx="60" cy="55" r="4" fill="#fff" />
        <path d="M60 14 L60 4" stroke={accent} strokeWidth="2" />
        <circle cx="60" cy="2" r="3" fill={accent} />
        <path d="M38 50 L24 50" stroke={accent} strokeWidth="2" />
        <path d="M82 50 L96 50" stroke={accent} strokeWidth="2" />
        <rect x="30" y="88" width="12" height="18" fill={mid} stroke={accent} strokeWidth="1.5" />
        <rect x="78" y="88" width="12" height="18" fill={mid} stroke={accent} strokeWidth="1.5" />
      </svg>
    )
  }
  if (type === 'attacker') {
    return (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="22" width="60" height="66" fill={mid} stroke={accent} strokeWidth="2" />
        <rect x="38" y="30" width="44" height="50" fill={dark} stroke={accent} strokeWidth="1.5" />
        <polygon points="60,36 70,50 60,64 50,50" fill={accent} />
        <polygon points="60,42 65,50 60,58 55,50" fill={dark} />
        <rect x="12" y="44" width="20" height="10" fill={mid} stroke={accent} strokeWidth="1.5" />
        <rect x="4" y="46" width="12" height="6" fill={accent} />
        <rect x="88" y="44" width="20" height="10" fill={mid} stroke={accent} strokeWidth="1.5" />
        <rect x="104" y="46" width="12" height="6" fill={accent} />
        <polygon points="30,88 24,108 40,108 40,88" fill={mid} stroke={accent} strokeWidth="1.5" />
        <polygon points="90,88 96,108 80,108 80,88" fill={mid} stroke={accent} strokeWidth="1.5" />
        <circle cx="60" cy="22" r="3" fill={accent} />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="22,36 60,14 98,36 98,84 60,106 22,84" fill={mid} stroke={accent} strokeWidth="2.5" />
      <polygon points="34,42 60,24 86,42 86,78 60,96 34,78" fill={dark} stroke={accent} strokeWidth="1.5" />
      <polygon points="48,48 60,40 72,48 72,70 60,78 48,70" fill={accent} opacity="0.5" />
      <rect x="54" y="52" width="12" height="12" fill={accent} />
      <rect x="57" y="55" width="6" height="6" fill="#fff" />
      <rect x="12" y="50" width="14" height="20" fill={mid} stroke={accent} strokeWidth="1.5" />
      <rect x="94" y="50" width="14" height="20" fill={mid} stroke={accent} strokeWidth="1.5" />
      <rect x="4" y="54" width="12" height="12" fill={accent} opacity="0.8" />
      <rect x="104" y="54" width="12" height="12" fill={accent} opacity="0.8" />
    </svg>
  )
}

const ICON_MAP: Record<RobotType, React.ReactNode> = {
  scout: <Gauge size={13} />,
  attacker: <Cpu size={13} />,
  tank: <Shield size={13} />
}

export const RobotCard: React.FC<RobotCardProps> = ({ meta, selected, onSelect, index }) => {
  const [burstTrigger, setBurstTrigger] = useState(0)
  const controls = useAnimation()

  useEffect(() => {
    if (selected) {
      setBurstTrigger((t) => t + 1)
      controls.start({
        scale: [1, 1.03, 1],
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
      })
    }
  }, [selected, controls])

  const maxStats = { hp: 140, speed: 9, attack: 26 }
  const { type, name, nameCn, description, stats, color } = meta

  return (
    <Card
      $accent={color}
      $selected={selected}
      initial={{ opacity: 0, y: 24 }}
      animate={controls}
      transition={{ delay: index * 0.08 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onMouseEnter={() => sfx.hover()}
      onClick={() => {
        sfx.place()
        onSelect(type)
      }}
    >
      <Header $accent={color}>
        <div>
          <RobotName $accent={color} $selected={selected}>
            {name}
          </RobotName>
          <CnName>{nameCn} UNIT</CnName>
        </div>
        <TypeTag $accent={color}>{ICON_MAP[type]}&nbsp;&nbsp;{type}</TypeTag>
      </Header>

      {selected && (
        <CheckBadge
          $accent={color}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        >
          ✓
        </CheckBadge>
      )}

      <Illustration $accent={color}>
        <GridBg $accent={color} />
        <motion.div
          animate={selected ? { y: [0, -6, 0], transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } } : {}}
        >
          <RobotSVG type={type} color={color} />
        </motion.div>
        <ParticleBurst
          x={55}
          y={70}
          color={color}
          count={selected ? 22 : 0}
          spread={selected ? 90 : 0}
          trigger={burstTrigger}
          sizeRange={[2, 6]}
        />
      </Illustration>

      <Desc>{description}</Desc>

      <StatsWrap>
        <StatsBar type="hp" value={stats.maxHp} maxValue={maxStats.hp} label="HP" />
        <StatsBar type="speed" value={stats.speed} maxValue={maxStats.speed} label="SPD" />
        <StatsBar type="attack" value={stats.attack} maxValue={maxStats.attack} label="ATK" />
      </StatsWrap>
    </Card>
  )
}
