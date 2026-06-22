import { Pet, PetType, PetColor } from '../types'

const colorMap: Record<PetColor, { body: string; accent: string }> = {
  default: { body: '#f5deb3', accent: '#d2b48c' },
  pink: { body: '#ffb6c1', accent: '#ff91a4' },
  blue: { body: '#add8e6', accent: '#87ceeb' },
}

const petEmojis: Record<PetType, string> = {
  cat: '🐱',
  dog: '🐶',
  dragon: '🐲',
}

interface PetAvatarProps {
  pet: Pet
  size?: number
  showEffects?: boolean
  animationClass?: string
}

function PetAvatar({ pet, size = 80, showEffects = true, animationClass = '' }: PetAvatarProps) {
  const colors = colorMap[pet.color]
  const allHigh = pet.hunger > 80 && pet.happiness > 80 && pet.energy > 80
  const anyLow = pet.hunger < 20 || pet.happiness < 20 || pet.energy < 20

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }} className={`${animationClass} pet-breathe`}>
      {showEffects && allHigh && (
        <>
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="star-dust"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${10 + Math.random() * 80}%`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </>
      )}
      {showEffects && anyLow && (
        <>
          <span className="cloud-sad">☁️</span>
          {[...Array(3)].map((_, i) => (
            <span
              key={i}
              className="raindrop"
              style={{
                left: `${35 + i * 12}%`,
                top: '5%',
                animationDelay: `${i * 0.4}s`,
              }}
            >💧</span>
          ))}
        </>
      )}
      <div
        className="drop-shadow-pet"
        style={{
          fontSize: size * 0.7,
          filter: `hue-rotate(${pet.color === 'pink' ? '-20deg' : pet.color === 'blue' ? '180deg' : '0deg'}) saturate(${pet.color === 'default' ? 1 : 1.2})`,
        }}
      >
        {petEmojis[pet.type]}
      </div>
      <div style={{
        position: 'absolute',
        bottom: -2,
        left: '50%',
        transform: 'translateX(-50%)',
        width: size * 0.5,
        height: 6,
        background: 'rgba(0,0,0,0.1)',
        borderRadius: '50%',
        filter: 'blur(2px)',
      }} />
    </div>
  )
}

export default PetAvatar
