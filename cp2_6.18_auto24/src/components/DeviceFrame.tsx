import React, { memo } from 'react'
import { Smartphone, Tablet, Monitor, Plus } from 'lucide-react'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export const DEVICE_SPECS: Record<DeviceType, { width: number; label: string; dotColor: string }> = {
  mobile: { width: 375, label: '手机 375px', dotColor: '#EF4444' },
  tablet: { width: 768, label: '平板 768px', dotColor: '#F59E0B' },
  desktop: { width: 1280, label: '桌面 1280px', dotColor: '#10B981' },
}

const DEVICE_ICONS: Record<DeviceType, React.ReactNode> = {
  mobile: <Smartphone size={14} />,
  tablet: <Tablet size={14} />,
  desktop: <Monitor size={14} />,
}

interface DeviceFrameProps {
  device: DeviceType
  addCardTooltip?: string
  onAddCard: () => void
  children: React.ReactNode
  scrollRef?: React.RefObject<HTMLDivElement>
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void
}

export const DeviceFrame = memo(function DeviceFrame(props: DeviceFrameProps) {
  const { device, onAddCard, children, scrollRef, onScroll } = props
  const specs = DEVICE_SPECS[device]

  const heightMap: Record<DeviceType, number> = {
    mobile: 480,
    tablet: 520,
    desktop: 560,
  }

  return (
    <div className="device-wrapper">
      <div className="device-toolbar">
        <div className="device-label">
          <span className="dot" style={{ background: specs.dotColor }} />
          {DEVICE_ICONS[device]}
          <span>{specs.label}</span>
        </div>
        <button
          type="button"
          className="add-card-btn"
          onClick={onAddCard}
          title="添加卡片"
        >
          <Plus size={16} />
        </button>
      </div>
      <div
        className="device-frame"
        style={{
          width: specs.width,
          height: heightMap[device],
          maxWidth: '100%',
        }}
      >
        <div
          className="device-scroll"
          ref={scrollRef}
          onScroll={onScroll}
        >
          {children}
        </div>
      </div>
    </div>
  )
})
