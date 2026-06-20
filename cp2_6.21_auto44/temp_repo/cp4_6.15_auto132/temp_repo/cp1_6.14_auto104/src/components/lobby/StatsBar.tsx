import React from 'react'
import styled from '@emotion/styled'
import { cyberTheme } from '@/styles/theme'

export type StatType = 'hp' | 'speed' | 'attack'

interface StatsBarProps {
  type: StatType
  value: number
  maxValue: number
  label: string
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const Label = styled.span`
  width: 56px;
  font-family: ${cyberTheme.fonts.body};
  font-size: 12px;
  letter-spacing: 0.15em;
  color: ${cyberTheme.colors.textSecondary};
  text-transform: uppercase;
`

const Track = styled.div`
  position: relative;
  flex: 1;
  height: 10px;
  background: ${cyberTheme.colors.bgDeep};
  border: 1px solid ${cyberTheme.colors.borderGlow};
  overflow: hidden;
`

const Fill = styled.div<{ $grad: string; $ratio: number }>`
  position: relative;
  height: 100%;
  width: 0;
  background: ${({ $grad }) => $grad};
  box-shadow: 0 0 12px ${({ $grad }) => $grad.split(',')[1]?.trim() ?? '#00FFFF'}66;
  transition: width 900ms cubic-bezier(0.16, 1, 0.3, 1);
  background-size: 200% 100%;
  animation: fillShift 3s linear infinite;

  @keyframes fillShift {
    0% { background-position: 0% 0; }
    100% { background-position: 200% 0; }
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(
      90deg,
      transparent 0,
      transparent 8px,
      rgba(0, 0, 0, 0.25) 8px,
      rgba(0, 0, 0, 0.25) 9px
    );
  }
`

const Value = styled.span<{ $color: string }>`
  width: 44px;
  text-align: right;
  font-family: ${cyberTheme.fonts.display};
  font-size: 14px;
  font-weight: 700;
  color: ${({ $color }) => $color};
  text-shadow: 0 0 6px ${({ $color }) => $color + '88'};
`

const grads: Record<StatType, { grad: string; color: string }> = {
  hp: {
    grad: `linear-gradient(90deg, ${cyberTheme.colors.neonGreen}, ${cyberTheme.colors.neonGold}, ${cyberTheme.colors.neonGreen})`,
    color: cyberTheme.colors.neonGold
  },
  speed: {
    grad: `linear-gradient(90deg, ${cyberTheme.colors.neonCyan}, ${cyberTheme.colors.neonGreenSoft}, ${cyberTheme.colors.neonCyan})`,
    color: cyberTheme.colors.neonCyan
  },
  attack: {
    grad: `linear-gradient(90deg, ${cyberTheme.colors.neonPurpleSoft}, ${cyberTheme.colors.neonRed}, ${cyberTheme.colors.neonPurpleSoft})`,
    color: cyberTheme.colors.neonRedSoft
  }
}

export const StatsBar: React.FC<StatsBarProps> = ({ type, value, maxValue, label }) => {
  const cfg = grads[type]
  const ratio = Math.max(0, Math.min(1, value / maxValue))

  return (
    <Wrapper>
      <Label>{label}</Label>
      <Track>
        <Fill
          $grad={cfg.grad}
          $ratio={ratio}
          style={{ width: `${ratio * 100}%` }}
          className="stats-fill"
        />
      </Track>
      <Value $color={cfg.color}>{value}</Value>
    </Wrapper>
  )
}
