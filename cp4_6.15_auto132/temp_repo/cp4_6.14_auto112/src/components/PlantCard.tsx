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
      className="animate-fade-in-up opacity-0 cursor-pointer relative overflow-hidden"
      style={{
        width: 260,
        height: 200,
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #d1d5db',
        padding: 20,
        boxSizing: 'border-box',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        animationDelay: `${index * 0.05}s`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)'
        e.currentTarget.style.boxShadow =
          '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div
        className="absolute flex items-center justify-center z-10"
        style={{
          top: 14,
          right: 14,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: config.color,
          boxShadow: `0 2px 8px ${config.color}55`,
        }}
        title={config.label}
      >
        <StatusIcon size={14} color="#ffffff" strokeWidth={2.5} />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          height: '100%',
          paddingRight: 40,
        }}
      >
        <h3
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#1e293b',
            margin: 0,
            lineHeight: 1.3,
            wordBreak: 'break-word',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {plant.name}
        </h3>

        <div style={{ marginTop: 10 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: '#64748b',
              background: '#f1f5f9',
              borderRadius: 4,
              padding: '2px 8px',
              display: 'inline-block',
            }}
          >
            {plant.variety}
          </span>
        </div>

        <div
          style={{
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>
            {plant.plantedDate}
          </span>
          <span
            style={{
              fontSize: 12,
              color: config.color,
              fontWeight: 500,
              background: `${config.color}15`,
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            {config.label}
          </span>
        </div>
      </div>
    </div>
  )
}
