import React from 'react'
import { useScoreStore, InstrumentType } from '../store/useScoreStore'
import { INSTRUMENT_COLORS } from '../audio/PlayerEngine'

const INSTRUMENT_NAMES: Record<InstrumentType, string> = {
  piano: '钢琴',
  guitar: '吉他',
  drums: '架子鼓',
  violin: '小提琴',
  bass: '贝斯',
}

const INSTRUMENT_ICONS: Record<InstrumentType, string> = {
  piano: '🎹',
  guitar: '🎸',
  drums: '🥁',
  violin: '🎻',
  bass: '🎸',
}

const INSTRUMENTS: InstrumentType[] = ['piano', 'guitar', 'drums', 'violin', 'bass']

export const TrackList: React.FC = React.memo(() => {
  const {
    selectedInstrument,
    tracks,
    setSelectedInstrument,
    toggleMute,
    setVolume,
  } = useScoreStore()

  return (
    <div className="track-list">
      {INSTRUMENTS.map((instrument) => {
        const track = tracks.find(t => t.instrument === instrument)
        if (!track) return null

        const isSelected = selectedInstrument === instrument
        const color = INSTRUMENT_COLORS[instrument]

        return (
          <div
            key={instrument}
            className={`track-row ${isSelected ? 'selected' : ''}`}
            style={{
              borderLeft: `4px solid ${isSelected ? color : 'transparent'}`,
            }}
            onClick={() => setSelectedInstrument(instrument)}
          >
            <div className="track-info">
              <span className="track-icon">{INSTRUMENT_ICONS[instrument]}</span>
              <span className="track-name">{INSTRUMENT_NAMES[instrument]}</span>
            </div>

            <div className="track-controls">
              <button
                className={`mute-btn ${track.muted ? 'muted' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMute(instrument)
                }}
                title="静音"
              >
                M
              </button>

              <div className="volume-container">
                <input
                  type="range"
                  min="-20"
                  max="0"
                  step="1"
                  value={track.volume}
                  className="volume-slider"
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation()
                    setVolume(instrument, Number(e.target.value))
                  }}
                />
                <span className="volume-value">{track.volume}dB</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
})

TrackList.displayName = 'TrackList'
