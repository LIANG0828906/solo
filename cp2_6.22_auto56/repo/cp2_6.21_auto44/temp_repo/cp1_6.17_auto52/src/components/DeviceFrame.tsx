import { useEffect, useRef, useState } from 'react'
import type { Breakpoint } from '../stores/breakpointStore'

interface DeviceFrameProps {
  breakpoint: Breakpoint
  src: string
  frameRef?: React.Ref<HTMLDivElement>
}

export function DeviceFrame({ breakpoint, src, frameRef }: DeviceFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return
      if (event.data?.type === 'click') {
        window.postMessage(
          { type: 'sync-click', selector: event.data.selector, excludeId: breakpoint.id },
          '*'
        )
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [breakpoint.id])

  useEffect(() => {
    const handleSyncClick = (event: MessageEvent) => {
      if (event.data?.type !== 'sync-click') return
      if (event.data?.excludeId === breakpoint.id) return
      if (!iframeRef.current?.contentWindow) return

      iframeRef.current.contentWindow.postMessage(
        { type: 'trigger-click', selector: event.data.selector },
        '*'
      )
    }

    window.addEventListener('message', handleSyncClick)
    return () => window.removeEventListener('message', handleSyncClick)
  }, [breakpoint.id])

  return (
    <div
      ref={frameRef}
      className="device-frame-card"
      style={{ '--bp-color': breakpoint.color } as React.CSSProperties}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="device-frame-header">
        <div className="device-frame-color-bar" />
        <div className="device-frame-info">
          <span className="device-frame-label">{breakpoint.label}</span>
          <span className="device-frame-width">{breakpoint.width}px</span>
        </div>
      </div>
      <div className="device-frame-viewport">
        <div
          className="device-frame-iframe-wrapper"
          style={{
            width: breakpoint.width,
          }}
        >
          <iframe
            ref={iframeRef}
            src={src}
            title={breakpoint.label}
            className="device-iframe"
            style={{
              border: `2px dashed ${breakpoint.color}`,
            }}
          />
          {isHovered && (
            <div className="device-frame-hover-label">
              {breakpoint.label} · {breakpoint.width}px
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
