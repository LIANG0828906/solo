import { motion } from 'framer-motion'
import { usePhotoStore, type ColorFilter as ColorFilterType } from '../store/photoStore'

interface FilterColor {
  name: ColorFilterType
  hex: string
}

const FILTER_COLORS: FilterColor[] = [
  { name: 'red', hex: '#D32F2F' },
  { name: 'orange', hex: '#FF6F00' },
  { name: 'yellow', hex: '#FBC02D' },
  { name: 'green', hex: '#388E3C' },
  { name: 'blue', hex: '#1976D2' },
  { name: 'purple', hex: '#7B1FA2' },
  { name: 'pink', hex: '#C2185B' },
  { name: 'gray', hex: '#616161' },
]

export const ColorFilter = () => {
  const { activeFilter, setFilter } = usePhotoStore()

  const handleFilterClick = (name: ColorFilterType) => {
    setFilter(activeFilter === name ? 'all' : name)
  }

  return (
    <div
      style={{
        width: '80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        paddingTop: '20px',
      }}
    >
      {FILTER_COLORS.map((color) => {
        const isActive = activeFilter === color.name
        return (
          <motion.button
            key={color.name}
            onClick={() => handleFilterClick(color.name)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={isActive ? { scale: 1.2 } : { scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: color.hex,
              border: isActive ? '3px solid #4A3728' : '2px solid transparent',
              boxShadow: isActive ? '0 0 0 2px #F5F0E8, 0 4px 12px rgba(74, 55, 40, 0.3)' : 'none',
              cursor: 'pointer',
            }}
            aria-label={`筛选${color.name}色调`}
          />
        )
      })}
    </div>
  )
}
