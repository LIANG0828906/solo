import React, { useMemo, useRef, useState } from 'react'
import { FiVolume2, FiVolumeX, FiEdit2, FiTrash2, FiMoreVertical, FiMusic } from 'react-icons/fi'
import type { MelodyTrack } from '../eventBus'
import { useApp } from './AppContext'
import { generateWaveformData, INSTRUMENT_NAMES, INSTRUMENT_COLORS, getTotalDuration } from '../domain/melody'
import WaveformCanvas from './WaveformCanvas'

import './TrackCard.css'

interface TrackCardProps {
  track: MelodyTrack
  index: number
  onDragStart: (index: number) => void
  onDragOver: (index: number) => void
  onDragEnd: () => void
}

const TrackCard: React.FC<TrackCardProps> = ({ track, index, onDragStart, onDragOver, onDragEnd }) => {
  const { updateTrack, removeTrack, openEditor } = useApp()
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const totalBeats = Math.max(8, Math.ceil(getTotalDuration(track.notes)))
  
  const waveformSamples = useMemo(() => {
    const width = 300
    return generateWaveformData(track.notes, width, 40, totalBeats)
  }, [track.notes, totalBeats])

  const instrumentColor = INSTRUMENT_COLORS[track.instrument]

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value)
    updateTrack(track.id, { volume })
  }

  const toggleMute = () => {
    updateTrack(track.id, { mute: !track.mute })
  }

  const handleEdit = () => {
    openEditor(track.id)
  }

  const handleDelete = () => {
    if (confirm(`确定要删除 "${track.name}" 吗？`)) {
      removeTrack(track.id)
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    onDragStart(index)
    e.dataTransfer.effectAllowed = 'move'
    if (cardRef.current) {
      e.dataTransfer.setDragImage(cardRef.current, 20, 20)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    onDragOver(index)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    onDragEnd()
  }

  return (
    <div
      ref={cardRef}
      className={`track-card ${isDragging ? 'dragging' : ''} ${track.mute ? 'muted' : ''}`}
      style={{ borderLeftColor: instrumentColor }}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDrop={handleDragEnd}
    >
      <div className="track-card-header">
        <div className="drag-handle" title="拖拽排序">
          <FiMoreVertical />
        </div>
        
        <div className="track-icon" style={{ backgroundColor: instrumentColor }}>
          <FiMusic />
        </div>
        
        <div className="track-info">
          <h3 className="track-name">{track.name}</h3>
          <span className="track-instrument" style={{ color: instrumentColor }}>
            {INSTRUMENT_NAMES[track.instrument]}
          </span>
        </div>

        <div className="track-actions">
          <button 
            className="action-btn edit-btn" 
            onClick={handleEdit}
            title="编辑旋律"
          >
            <FiEdit2 />
          </button>
          <button 
            className="action-btn mute-btn" 
            onClick={toggleMute}
            title={track.mute ? '取消静音' : '静音'}
          >
            {track.mute ? <FiVolumeX /> : <FiVolume2 />}
          </button>
          <button 
            className="action-btn delete-btn" 
            onClick={handleDelete}
            title="删除音轨"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      <div className="track-waveform">
        <WaveformCanvas 
          samples={waveformSamples} 
          color={track.mute ? '#666' : instrumentColor} 
          height={40} 
        />
      </div>

      <div className="track-controls">
        <div className="volume-control">
          <FiVolume2 size={14} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={track.volume}
            onChange={handleVolumeChange}
            className="volume-slider"
            style={{ '--slider-color': instrumentColor } as React.CSSProperties}
            disabled={track.mute}
          />
          <span className="volume-value">{Math.round(track.volume * 100)}%</span>
        </div>
      </div>

      <div className="track-effects">
        <div className="effect-control">
          <span className="effect-label">混响</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={track.reverb}
            onChange={(e) => updateTrack(track.id, { reverb: parseFloat(e.target.value) })}
            className="effect-slider"
            disabled={track.mute}
          />
        </div>
        <div className="effect-control">
          <span className="effect-label">延迟</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={track.delay}
            onChange={(e) => updateTrack(track.id, { delay: parseFloat(e.target.value) })}
            className="effect-slider"
            disabled={track.mute}
          />
        </div>
      </div>
    </div>
  )
}

export default TrackCard
