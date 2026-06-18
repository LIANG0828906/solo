import { useState, useCallback } from 'react'
import { useSpeechStore } from './store/speechStore'
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis'
import WaveformCanvas from './components/WaveformCanvas'
import SpectrumCanvas from './components/SpectrumCanvas'

const presetLabels: Record<string, string> = {
  default: '默认',
  warm: '温暖',
  bright: '明亮',
  deep: '低沉',
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  unit?: string
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#E0E0E0', fontSize: '13px' }}>{label}</span>
        <span
          style={{
            color: '#FF6B6B',
            fontSize: '12px',
            fontWeight: 600,
            opacity: showTooltip || true ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
        >
          {value}{unit || ''}
        </span>
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onMouseDown={() => setShowTooltip(true)}
          onMouseUp={() => setShowTooltip(false)}
          onTouchStart={() => setShowTooltip(true)}
          onTouchEnd={() => setShowTooltip(false)}
          style={{
            width: '180px',
            height: '6px',
            appearance: 'none',
            WebkitAppearance: 'none',
            background: '#333',
            borderRadius: '3px',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
      </div>
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #FF6B6B;
          cursor: pointer;
          box-shadow: 0 0 6px rgba(255, 107, 107, 0.5);
          transition: transform 0.15s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #FF6B6B;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 6px rgba(255, 107, 107, 0.5);
        }
        input[type="range"]::-moz-range-track {
          height: 6px;
          background: #333;
          border-radius: 3px;
        }
      `}</style>
    </div>
  )
}

export default function App() {
  const {
    text,
    lang,
    rate,
    pitch,
    volume,
    isPlaying,
    isPaused,
    progress,
    preset,
    setText,
    setLang,
    setRate,
    setPitch,
    setVolume,
    setPreset,
    resetPreset,
  } = useSpeechStore()

  const { togglePlay, stop } = useSpeechSynthesis()

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value)
    },
    [setText]
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0F0F1A',
        color: '#E0E0E0',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '24px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
      }}
    >
      <style>{`
        @keyframes btnClick {
          0% { transform: scale(1); }
          50% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        .btn-click:active {
          animation: btnClick 0.1s ease;
        }
        .btn-hover:hover {
          filter: brightness(1.1);
        }
        @media (max-width: 800px) {
          .control-panel {
            flex-direction: column !important;
            height: auto !important;
          }
          .control-left, .control-right {
            width: 100% !important;
          }
        }
      `}</style>

      <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, letterSpacing: '1px' }}>
        🎙️ 语音波形合成器
      </h1>

      <div
        className="control-panel"
        style={{
          width: '100%',
          maxWidth: '900px',
          height: '320px',
          backgroundColor: '#1A1A2E',
          borderRadius: '16px',
          padding: '24px',
          boxSizing: 'border-box',
          display: 'flex',
          gap: '24px',
        }}
      >
        <div
          className="control-left"
          style={{
            flex: '1 1 55%',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', fontWeight: 600 }}>输入文本</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="btn-click btn-hover"
                onClick={() => setLang('zh')}
                style={{
                  padding: '4px 12px',
                  borderRadius: '8px',
                  border: lang === 'zh' ? '1px solid #FF6B6B' : '1px solid #444',
                  backgroundColor: lang === 'zh' ? 'rgba(255,107,107,0.15)' : 'transparent',
                  color: lang === 'zh' ? '#FF6B6B' : '#999',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.2s',
                }}
              >
                中文
              </button>
              <button
                className="btn-click btn-hover"
                onClick={() => setLang('en')}
                style={{
                  padding: '4px 12px',
                  borderRadius: '8px',
                  border: lang === 'en' ? '1px solid #FF6B6B' : '1px solid #444',
                  backgroundColor: lang === 'en' ? 'rgba(255,107,107,0.15)' : 'transparent',
                  color: lang === 'en' ? '#FF6B6B' : '#999',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.2s',
                }}
              >
                EN
              </button>
            </div>
          </div>

          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder={lang === 'zh' ? '请输入要合成的文字...' : 'Enter text to synthesize...'}
            maxLength={500}
            style={{
              flex: 1,
              width: '100%',
              backgroundColor: '#0F0F1A',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#E0E0E0',
              padding: '12px',
              fontSize: '14px',
              lineHeight: '1.6',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>
              {text.length}/500
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              className="btn-click btn-hover"
              onClick={togglePlay}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#FF6B6B',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            >
              {isPlaying && !isPaused ? '⏸' : '▶'}
            </button>
            <button
              className="btn-click btn-hover"
              onClick={stop}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1px solid #555',
                backgroundColor: 'transparent',
                color: '#E0E0E0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            >
              ⏹
            </button>
            <div
              style={{
                flex: 1,
                height: '8px',
                backgroundColor: '#E0E0E0',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress * 100}%`,
                  height: '100%',
                  backgroundColor: '#FF6B6B',
                  borderRadius: '4px',
                  transition: 'width 0.1s linear',
                }}
              />
            </div>
          </div>
        </div>

        <div
          className="control-right"
          style={{
            flex: '1 1 40%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            justifyContent: 'center',
          }}
        >
          <Slider
            label="语速"
            value={rate}
            min={0.5}
            max={2.0}
            step={0.1}
            onChange={setRate}
            unit="x"
          />
          <Slider
            label="音调"
            value={pitch}
            min={0.5}
            max={2.0}
            step={0.1}
            onChange={setPitch}
            unit="x"
          />
          <Slider
            label="音量"
            value={volume}
            min={0}
            max={100}
            step={1}
            onChange={setVolume}
            unit="%"
          />

          <div
            style={{
              marginTop: '8px',
              padding: '12px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              border: '1px solid #2a2a3e',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>音色预设</span>
              <button
                className="btn-click btn-hover"
                onClick={resetPreset}
                style={{
                  padding: '2px 10px',
                  borderRadius: '6px',
                  border: '1px solid #555',
                  backgroundColor: 'transparent',
                  color: '#999',
                  cursor: 'pointer',
                  fontSize: '11px',
                  transition: 'all 0.2s',
                }}
              >
                重置
              </button>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(['default', 'warm', 'bright', 'deep'] as const).map((p) => (
                <button
                  key={p}
                  className="btn-click btn-hover"
                  onClick={() => setPreset(p)}
                  style={{
                    padding: '4px 14px',
                    borderRadius: '8px',
                    border:
                      preset === p ? '1px solid #FF6B6B' : '1px solid #444',
                    backgroundColor:
                      preset === p ? 'rgba(255,107,107,0.15)' : 'transparent',
                    color: preset === p ? '#FF6B6B' : '#999',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s',
                  }}
                >
                  {presetLabels[p]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          height: '380px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px', alignSelf: 'flex-start' }}>
            波形 (时域)
          </div>
          <WaveformCanvas width={600} height={200} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px', alignSelf: 'flex-start' }}>
            频谱 (频域)
          </div>
          <SpectrumCanvas width={600} height={150} />
        </div>
      </div>
    </div>
  )
}
