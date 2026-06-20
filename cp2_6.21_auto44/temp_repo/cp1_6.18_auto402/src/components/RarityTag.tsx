import type { Rarity } from '../types'
import { getRarityColor, getRarityName } from '../modules/nft-core/ItemGenerator'

interface Props {
  rarity: Rarity
  size?: 'sm' | 'md' | 'lg'
}

const RarityTag = ({ rarity, size = 'sm' }: Props) => {
  const color = getRarityColor(rarity)
  const name = getRarityName(rarity)

  const padding = size === 'sm' ? '2px 8px' : size === 'md' ? '4px 12px' : '6px 16px'
  const fontSize = size === 'sm' ? 11 : size === 'md' ? 13 : 15

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding,
        fontSize,
        fontWeight: 600,
        color,
        background: `${color}15`,
        border: `1px solid ${color}50`,
        borderRadius: 12,
        lineHeight: 1.2,
      }}
    >
      <span
        style={{
          width: size === 'sm' ? 6 : size === 'md' ? 8 : 10,
          height: size === 'sm' ? 6 : size === 'md' ? 8 : 10,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 ${size === 'sm' ? 4 : size === 'md' ? 6 : 8}px ${color}`,
        }}
      />
      {name}
    </span>
  )
}

export default RarityTag
