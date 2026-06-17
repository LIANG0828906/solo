import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useTimelineStore, interpolateKeyframe, Keyframe, Scene } from '../../store/timelineStore'
import './TimelinePanel.css'

const TIMELINE_HEADER_HEIGHT = 50
const TRACK_HEIGHT = 60
const PIXELS_PER_FRAME = 4
const DIAMOND_SIZE = 10

export const TimelinePanel: React.FC = () => {
  const {
    scenes,
    currentFrame,
    totalFrames,
    isPlaying,
    isLooping,
    selectedSceneId,
    selectedKeyframeId,
    fps,
    setCurrentFrame,
    togglePlay,
    toggleLoop,
    goToStart,
    nextFrame,
    addKeyframe,
    removeKeyframe,
    updateKeyframe,
    selectKeyframe,
    selectScene,
  } = useTimelineStore()

  const timelineRef = useRef<HTMLDivElement>(null)
  const playIntervalRef = useRef<number | null>(null)
  const [draggingKeyframe, setDraggingKeyframe] = useState<{ sceneId: string; keyframeId: string } | null>(null)
  const [selectedKeyframeData, setSelectedKeyframeData] = useState<{ scene: Scene; keyframe: Keyframe } | null>(null)

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = 1000 / fps
      playIntervalRef.current = window.setInterval(() => {
        nextFrame()
      }, intervalMs)
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
        playIntervalRef.current = null
      }
    }
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [isPlaying, fps, nextFrame])

  useEffect(() => {
    if (selectedKeyframeId) {
      for (const scene of scenes) {
        const kf = scene.keyframes.find((k) => k.id === selectedKeyframeId)
        if (kf) {
          setSelectedKeyframeData({ scene, keyframe: kf })
          return
        }
      }
    }
    setSelectedKeyframeData(null)
  }, [selectedKeyframeId, scenes])

  const handleTimelineClick = (e: React.MouseEvent, sceneId: string) => {
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const frame = Math.floor(x / PIXELS_PER_FRAME)
    setCurrentFrame(frame)
  }

  const handleTrackDoubleClick = (e: React.MouseEvent, sceneId: string) => {
    e.stopPropagation()
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const frame = Math.floor(x / PIXELS_PER_FRAME)
    const scene = scenes.find((s) => s.id === sceneId)
    if (scene) {
      const exists = scene.keyframes.some((k) => k.frame === frame)
      if (!exists) {
        addKeyframe(sceneId, frame)
      }
    }
  }

  const handleKeyframeMouseDown = (e: React.MouseEvent, sceneId: string, keyframeId: string) => {
    e.stopPropagation()
    selectKeyframe(keyframeId)
    setDraggingKeyframe({ sceneId, keyframeId })
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingKeyframe || !timelineRef.current) return
      const rect = timelineRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const frame = Math.max(0, Math.min(Math.floor(x / PIXELS_PER_FRAME), totalFrames))
      updateKeyframe(draggingKeyframe.sceneId, draggingKeyframe.keyframeId, { frame })
    },
    [draggingKeyframe, totalFrames, updateKeyframe]
  )

  const handleMouseUp = useCallback(() => {
    setDraggingKeyframe(null)
  }, [])

  useEffect(() => {
    if (draggingKeyframe) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [draggingKeyframe, handleMouseMove, handleMouseUp])

  const handleKeyframePropChange = (prop: keyof Keyframe, value: number | string) => {
    if (!selectedKeyframeData) return
    updateKeyframe(selectedKeyframeData.scene.id, selectedKeyframeData.keyframe.id, {
      [prop]: value,
    } as Partial<Keyframe>)
  }

  const timelineWidth = totalFrames * PIXELS_PER_FRAME
  const playheadX = currentFrame * PIXELS_PER_FRAME

  const renderRuler = () => {
    const ticks = []
    for (let f = 0; f <= totalFrames; f += 10) {
      const x = f * PIXELS_PER_FRAME
      const isMajor = f % 50 === 0
      ticks.push(
        <div
          key={f}
          style={{
            position: 'absolute',
            left: x,
            top: 0,
            height: isMajor ? 20 : 10,
            width: 1,
            backgroundColor: '#666',
          }}
        />
      )
      if (isMajor) {
        ticks.push(
          <div
            key={`label-${f}`}
            style={{
              position: 'absolute',
              left: x + 3,
              top: 22,
              fontSize: 10,
              color: '#888',
              pointerEvents: 'none',
            }}
          >
            {f}
          </div>
        )
      }
    }
    return ticks
  }

  return (
    <div className="timeline-container">
      {/* Playback Controls */}
      <div className="playback-controls">
        <div className="playback-buttons">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="control-button"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* Go to Start Button */}
          <button
            onClick={goToStart}
            className="control-button small"
          >
            ⏮
          </button>

          {/* Loop Toggle Button */}
          <button
            onClick={toggleLoop}
            className={`loop-button ${isLooping ? 'active' : ''}`}
          >
            循环
            {isLooping && <span className="loop-icon">↻</span>}
          </button>
        </div>

        {/* Frame Counter */}
        <div className="frame-counter">
          帧 {currentFrame}/{totalFrames}
        </div>
      </div>

      {/* Timeline Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Scene Labels */}
        <div
          style={{
            width: 100,
            minWidth: 100,
            borderRight: '1px solid #0f3460',
            backgroundColor: '#121b30',
          }}
        >
          <div
            style={{
              height: TIMELINE_HEADER_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#888',
              borderBottom: '1px solid #0f3460',
            }}
          >
            场景
          </div>
          {scenes.map((scene) => (
            <div
              key={scene.id}
              onClick={() => selectScene(scene.id)}
              style={{
                height: TRACK_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 12,
                fontSize: 12,
                color: selectedSceneId === scene.id ? '#e94560' : '#e5e5e5',
                borderBottom: '1px solid #0f3460',
                cursor: 'pointer',
                backgroundColor: selectedSceneId === scene.id ? 'rgba(233, 69, 96, 0.1)' : 'transparent',
                transition: 'background-color 0.2s',
              }}
            >
              {scene.name}
            </div>
          ))}
        </div>

        {/* Timeline Tracks */}
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
          <div
            ref={timelineRef}
            style={{
              position: 'relative',
              width: timelineWidth,
              minWidth: '100%',
              cursor: 'pointer',
            }}
            onClick={(e) => handleTimelineClick(e, scenes[0]?.id || '')}
          >
            {/* Ruler */}
            <div
              style={{
                position: 'relative',
                height: TIMELINE_HEADER_HEIGHT,
                borderBottom: '1px solid #0f3460',
                backgroundColor: '#121b30',
              }}
            >
              {renderRuler()}
            </div>

            {/* Tracks */}
            {scenes.map((scene) => (
              <div
                key={scene.id}
                onDoubleClick={(e) => handleTrackDoubleClick(e, scene.id)}
                onClick={(e) => {
                  e.stopPropagation()
                  selectScene(scene.id)
                }}
                style={{
                  position: 'relative',
                  height: TRACK_HEIGHT,
                  borderBottom: '1px solid #0f3460',
                  backgroundColor: selectedSceneId === scene.id ? 'rgba(233, 69, 96, 0.05)' : 'transparent',
                  transition: 'background-color 0.2s',
                }}
              >
                {/* Grid lines */}
                {Array.from({ length: Math.floor(totalFrames / 10) + 1 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: i * 10 * PIXELS_PER_FRAME,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      backgroundColor: 'rgba(255,255,255,0.03)',
                    }}
                  />
                ))}

                {/* Keyframes */}
                {scene.keyframes.map((kf) => {
                  const isSelected = selectedKeyframeId === kf.id
                  const size = isSelected ? DIAMOND_SIZE * 1.5 : DIAMOND_SIZE
                  const x = kf.frame * PIXELS_PER_FRAME - size / 2
                  return (
                    <div
                      key={kf.id}
                      onMouseDown={(e) => handleKeyframeMouseDown(e, scene.id, kf.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        left: x,
                        top: TRACK_HEIGHT / 2 - size / 2,
                        width: size,
                        height: size,
                        backgroundColor: '#ff6b6b',
                        transform: 'rotate(45deg)',
                        cursor: 'grab',
                        transition: 'width 0.15s, height 0.15s, top 0.15s, left 0.15s',
                      }}
                    />
                  )
                })}
              </div>
            ))}

            {/* Playhead */}
            <div
              style={{
                position: 'absolute',
                left: playheadX,
                top: 0,
                bottom: 0,
                width: 2,
                backgroundColor: '#e94560',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -6,
                  left: -5,
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '8px solid #e94560',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Keyframe Properties Panel */}
      <div
        style={{
          maxHeight: selectedKeyframeData ? 200 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
          borderTop: selectedKeyframeData ? '1px solid #0f3460' : 'none',
          backgroundColor: '#121b30',
        }}
      >
        {selectedKeyframeData && (
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e5e5', marginBottom: 4 }}>
              关键帧属性
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <PropertyInput label="帧" value={selectedKeyframeData.keyframe.frame} onChange={(v) => handleKeyframePropChange('frame', v)} type="number" />
              <PropertyInput label="X" value={selectedKeyframeData.keyframe.x} onChange={(v) => handleKeyframePropChange('x', v)} type="number" />
              <PropertyInput label="Y" value={selectedKeyframeData.keyframe.y} onChange={(v) => handleKeyframePropChange('y', v)} type="number" />
              <PropertyInput label="尺寸" value={selectedKeyframeData.keyframe.size} onChange={(v) => handleKeyframePropChange('size', v)} type="number" />
              <PropertyInput label="透明度" value={selectedKeyframeData.keyframe.opacity} onChange={(v) => handleKeyframePropChange('opacity', v)} type="number" step={0.1} min={0} max={1} />
              <PropertyInput label="旋转" value={selectedKeyframeData.keyframe.rotation} onChange={(v) => handleKeyframePropChange('rotation', v)} type="number" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, color: '#888' }}>颜色</label>
                <input
                  type="color"
                  value={selectedKeyframeData.keyframe.color.startsWith('rgb') ? rgbToHex(selectedKeyframeData.keyframe.color) : selectedKeyframeData.keyframe.color}
                  onChange={(e) => handleKeyframePropChange('color', e.target.value)}
                  style={{ width: 30, height: 24, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 0 }}
                />
              </div>
            </div>
            <button
              onClick={() => removeKeyframe(selectedKeyframeData.scene.id, selectedKeyframeData.keyframe.id)}
              style={{
                marginTop: 8,
                padding: '6px 12px',
                backgroundColor: '#e74c3c',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                fontSize: 12,
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              删除关键帧
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const PropertyInput: React.FC<{
  label: string
  value: number
  onChange: (value: number) => void
  type?: string
  step?: number
  min?: number
  max?: number
}> = ({ label, value, onChange, type = 'number', step = 1, min, max }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <label style={{ fontSize: 11, color: '#888', minWidth: 24 }}>{label}</label>
      <input
        type={type}
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        style={{
          width: 60,
          padding: '4px 6px',
          backgroundColor: '#16213e',
          color: '#e5e5e5',
          border: '1px solid #0f3460',
          borderRadius: 4,
          fontSize: 11,
        }}
      />
    </div>
  )
}

function rgbToHex(rgb: string): string {
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
  if (!match) return rgb
  const r = parseInt(match[1])
  const g = parseInt(match[2])
  const b = parseInt(match[3])
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}
