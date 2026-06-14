import type { Plant, PlantStatus } from '@/types'
import { useNavigate } from 'react-router-dom'
import { Heart, Droplets, Sun, Bug } from 'lucide-react'

const statusConfig: Record<PlantStatus, { icon: typeof Heart; color: string; label: string }> = {
  healthy: { icon: Heart, color: '#22c55e', label: '健康' },
  thirsty: { icon: Droplets, color: '#f97316', label: '缺水' },
  low_light: { icon: Sun, color: '#eab308', label: '缺光' },
  pest: { icon: Bug, color: '#ef4444', label: '虫害' },
}

interface PlantCardProps {
  plant: Plant
  index: number
}

export default function PlantCard({ plant, index }: PlantCardProps) {
  const navigate = useNavigate()
  const config = statusConfig[plant.status]
  const StatusIcon = config.icon

  return (
    <div
      onClick={() => navigate(`/plant/${plant.id}`)}
      className="animate-fade-in-up opacity-0 cursor-pointer flex flex-col justify-between p-4 relative"
      style={{
        width: 260,
        height: 200,
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #d1d5db',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        animationDelay: `${index * 0.05}s`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)'
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div
        className="absolute top-3 right-3 flex items-center justify-center"
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: config.color,
        }}
        title={config.label}
      >
        <StatusIcon size={14} color="#ffffff" />
      </div>

      <div className="flex-1 flex flex-col justify-end">
        <h3
          style={{ fontSize: 18, fontWeight: 600, color: '#1e293b', margin: 0 }}
          className="mb-2 truncate"
        >
          {plant.name}
        </h3>
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: '#64748b',
            background: '#f1f5f9',
            borderRadius: 4,
            padding: '2px 8px',
            display: 'inline-block',
            width: 'fit-content',
          }}
        >
          {plant.variety}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span style={{ fontSize: 12, color: '#94a3b8' }}>
          {plant.plantedDate}
        </span>
        <span style={{ fontSize: 12, color: config.color, fontWeight: 500 }}>
          {config.label}
        </span>
      </div>
    </div>
  )
}
