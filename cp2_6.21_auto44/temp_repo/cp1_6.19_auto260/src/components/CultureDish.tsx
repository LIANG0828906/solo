import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEcosystemStore } from '@/store/ecosystemStore'
import { usePlantStore, type Plant } from '@/store/plantStore'

interface PlantDotProps {
  plant: Plant
  isSelected: boolean
  onClick: () => void
}

const PlantDot = motion(React.memo(function PlantDotInner({ plant, isSelected, onClick }: PlantDotProps) {
  const { h, s, l } = plant.glowColor
  const size = Math.min(56, Math.max(6, plant.growth * 0.5 + 6))
  const glowInner = 8 + plant.growth * 0.3
  const glowOuter = 16 + plant.growth * 0.5

  return (
    <motion.div
      className="absolute rounded-full cursor-pointer will-change-transform"
      style={{
        left: `${plant.x * 100}%`,
        top: `${plant.y * 100}%`,
        transform: 'translate(-50%, -50%)',
        width: `${size}px`,
        height: `${size}px`,
        background: `hsl(${h}, ${s}%, ${l}%)`,
        boxShadow: `0 0 ${glowInner}px hsl(${h}, ${s}%, ${l}% / 0.6), 0 0 ${glowOuter}px hsl(${h}, ${s}%, ${l}% / 0.3)`,
      }}
      animate={{
        scale: [0.95, 1.05, 0.95],
        rotate: [0, 5, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      onClick={onClick}
    />
  )
}))

function PlantPopup({ plant, onClose }: { plant: Plant; onClose: () => void }) {
  const typeLabel = plant.type === 'moss' ? '苔藓' : '蕨类'
  const resiliencePercent = Math.round(plant.resilience * 100)

  return (
    <motion.div
      className="absolute z-10 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm min-w-[160px]"
      style={{
        left: `${plant.x * 100}%`,
        top: `${plant.y * 100}%`,
        transform: 'translate(-50%, calc(-100% - 12px))',
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
    >
      <div className="font-semibold mb-1">{plant.name}</div>
      <div className="text-white/70 text-xs mb-2">类型：{typeLabel}</div>
      <div className="text-xs mb-1">韧性</div>
      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${resiliencePercent}%`,
            background: 'linear-gradient(90deg, #22c55e, #eab308)',
          }}
        />
      </div>
      <div className="text-[10px] text-white/50 mt-0.5 text-right">{resiliencePercent}%</div>
      <button
        className="absolute top-1.5 right-2 text-white/50 hover:text-white text-xs"
        onClick={onClose}
      >
        ✕
      </button>
    </motion.div>
  )
}

const CultureDish = React.memo(function CultureDish() {
  const alertActive = useEcosystemStore((s) => s.alertActive)
  const plants = usePlantStore((s) => s.plants)
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)

  const handlePlantClick = useCallback((id: string) => {
    setSelectedPlantId((prev) => (prev === id ? null : id))
  }, [])

  const handleClosePopup = useCallback(() => {
    setSelectedPlantId(null)
  }, [])

  const selectedPlant = plants.find((p) => p.id === selectedPlantId) ?? null

  return (
    <div className="relative flex items-center justify-center w-full" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      <div className="relative w-full max-w-[700px] aspect-square">
        <motion.div
          className="w-full aspect-square relative rounded-full"
          style={{ border: '2px solid rgba(255,255,255,0.1)' }}
          animate={{
            background: alertActive
              ? 'radial-gradient(circle, #2b1a1a 0%, #3e1a1a 100%)'
              : 'radial-gradient(circle, #1a1a2e 0%, #16213e 100%)',
            boxShadow: alertActive
              ? '0 0 60px rgba(255,50,50,0.12)'
              : '0 0 60px rgba(0,200,255,0.05)',
          }}
          transition={{ duration: 2 }}
        >
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.03) 39px, rgba(255,255,255,0.03) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.03) 39px, rgba(255,255,255,0.03) 40px)',
            }}
          />

          {plants.map((plant) => (
            <PlantDot
              key={plant.id}
              plant={plant}
              isSelected={plant.id === selectedPlantId}
              onClick={() => handlePlantClick(plant.id)}
            />
          ))}

          <AnimatePresence>
            {selectedPlant && (
              <PlantPopup plant={selectedPlant} onClose={handleClosePopup} />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
})

export default CultureDish
