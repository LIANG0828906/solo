import React, { useMemo, useState, useEffect, useRef } from 'react'
import { FiVolume2, FiRadio, FiClock, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { useApp } from './AppContext'
import { generateCombinedWaveform, getTotalDuration } from '../domain/melody'
import WaveformCanvas from './WaveformCanvas'
import { audioEngine } from '../audio/engine'

import './MixerPanel.css'

const MixerPanel: React.FC = () => {
  const { tracks, masterVolume, masterReverb, masterDelay, setMasterMix, currentTime, duration, bpm } = useApp()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [liveWaveform, setLiveWaveform] = useState<number[]>([])
  const animationRef = useRef<number>()

  const totalBeats = useMemo(() => {
    let maxBeat = 8
    tracks.forEach(track => {
      const trackDuration = getTotalDuration(track.notes)
      if (trackDuration > maxBeat) maxBeat = trackDuration
    })
    return Math.ceil(maxBeat)
  }, [tracks])

  const combinedSamples = useMemo(() => {
    return generateCombinedWaveform(tracks, 400, 80, totalBeats)
  }, [tracks, totalBeats])

  useEffect(() => {
    const updateWaveform = () => {
      const data = audioEngine.getWaveformData()
      if (data && data.length > 0) {
        const samples: number[] = []
        const step = Math.floor(data.length / 100)
        for (let i = 0; i < 100; i++) {
          samples.push(data[i * step] * 40)
        }
        setLiveWaveform(samples)
      }
      animationRef.current = requestAnimationFrame(updateWaveform)
    }

    animationRef.current = requestAnimationFrame(updateWaveform)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const handleMasterVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value)
    setMasterMix(volume, masterReverb, masterDelay)
  }

  const handleReverb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const reverb = parseFloat(e.target.value)
    setMasterMix(masterVolume, reverb, masterDelay)
  }

  const handleDelay = (e: React.ChangeEvent<HTMLInputElement>) => {
    const delay = parseFloat(e.target.value)
    setMasterMix(masterVolume, masterReverb, delay)
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={`mixer-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="mixer-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="mixer-title">
          <FiRadio />
          <span>混音控制台</span>
        </div>
        <button className="collapse-btn">
          {isCollapsed ? <FiChevronUp /> : <FiChevronDown />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="mixer-content">
          <div className="combined-waveform">
            <div className="waveform-header">
              <span className="waveform-label">叠加波形预览</span>
              <span className="track-count">{tracks.length} 条音轨</span>
            </div>
            <div className="waveform-container">
              <WaveformCanvas 
                samples={liveWaveform.length > 0 ? liveWaveform : combinedSamples} 
                color="#8B5CF6" 
                height={80} 
              />
              <div 
                className="playhead-indicator" 
                style={{ left: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mixer-controls">
            <div className="master-control">
              <div className="control-header">
                <FiVolume2 size={16} />
                <span className="control-label">主音量</span>
                <span className="control-value">{Math.round(masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={masterVolume}
                onChange={handleMasterVolume}
                className="master-slider"
              />
            </div>

            <div className="effect-controls">
              <div className="effect-knob-container">
                <div className="knob-wrapper">
                  <div 
                    className="knob"
                    style={{ '--rotation': `${masterReverb * 270 - 135}deg` } as React.CSSProperties}
                  >
                    <div className="knob-indicator" />
                  </div>
                  <div className="knob-base" />
                </div>
                <span className="knob-label">
                  <FiClock size={12} />
                  混响
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={masterReverb}
                  onChange={handleReverb}
                  className="knob-slider"
                />
                <span className="knob-value">{Math.round(masterReverb * 100)}%</span>
              </div>

              <div className="effect-knob-container">
                <div className="knob-wrapper">
                  <div 
                    className="knob"
                    style={{ '--rotation': `${masterDelay * 270 - 135}deg` } as React.CSSProperties}
                  >
                    <div className="knob-indicator" />
                  </div>
                  <div className="knob-base" />
                </div>
                <span className="knob-label">
                  <FiClock size={12} />
                  延迟
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={masterDelay}
                  onChange={handleDelay}
                  className="knob-slider"
                />
                <span className="knob-value">{Math.round(masterDelay * 100)}%</span>
              </div>
            </div>
          </div>

          <div className="mixer-stats">
            <div className="stat-item">
              <span className="stat-label">BPM</span>
              <span className="stat-value">{bpm}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">时长</span>
              <span className="stat-value">
                {formatTime(duration)}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">音轨数</span>
              <span className="stat-value">{tracks.length}/6</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default MixerPanel
