import { useMemo } from 'react'
import TerrainComponent from './TerrainComponent'
import ProfilePanel from './ProfilePanel'
import { useTerrainStore } from './store'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (v: number) => void
}

function ParamSlider({ label, value, min, max, step, unit = '', onChange }: SliderProps) {
  const ratio = (value - min) / (max - min)
  const trackGradient = useMemo(() => {
    const r = Math.round(70 + ratio * 200)
    const g = Math.round(130 - ratio * 80)
    const b = Math.round(255 - ratio * 200)
    return `linear-gradient(90deg, rgba(70,130,255,0.9) 0%, rgba(${r},${g},${b},0.95) ${ratio * 100}%, rgba(255,255,255,0.08) ${ratio * 100}%, rgba(255,255,255,0.08) 100%)`
  }, [ratio])

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: '#c5cfdb',
            fontWeight: 500,
            letterSpacing: 0.3,
          }}
        >
          {label}
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 3,
            padding: '3px 10px',
            borderRadius: 6,
            background: `rgba(${70 + ratio * 185}, ${130 - ratio * 60}, ${255 - ratio * 155}, 0.18)`,
            border: `1px solid rgba(${70 + ratio * 185}, ${130 - ratio * 60}, ${255 - ratio * 155}, 0.35)`,
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'SF Mono, Consolas, monospace',
              color: `rgb(${130 + ratio * 125}, ${170 - ratio * 40}, ${255})`,
              textShadow: `0 0 8px rgba(${130 + ratio * 125}, ${170 - ratio * 40}, 255, 0.4)`,
            }}
          >
            {value}
          </span>
          {unit && (
            <span style={{ fontSize: 11, color: '#8a94a5', fontWeight: 500 }}>{unit}</span>
          )}
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          height: 6,
          appearance: 'none',
          WebkitAppearance: 'none',
          background: trackGradient,
          borderRadius: 3,
          outline: 'none',
          cursor: 'pointer',
          border: 'none',
        }}
        className="custom-slider"
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 5,
          fontSize: 10,
          color: '#5a6575',
          fontWeight: 500,
          letterSpacing: 0.3,
        }}
      >
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

export default function App() {
  const { params, setParams } = useTerrainStore()

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background:
          'radial-gradient(ellipse at 20% 10%, rgba(30, 60, 120, 0.25), transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(120, 40, 80, 0.18), transparent 60%), #0a0e14',
      }}
    >
      <style>{`
        .custom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #fff 0%, #c8d8ff 40%, #6af 80%, #48a 100%);
          border: 2px solid rgba(255,255,255,0.9);
          cursor: pointer;
          box-shadow: 0 0 0 3px rgba(100, 170, 255, 0.2), 0 3px 10px rgba(0,0,0,0.5), 0 0 12px rgba(100,170,255,0.6);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .custom-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 0 4px rgba(100, 170, 255, 0.28), 0 4px 14px rgba(0,0,0,0.55), 0 0 16px rgba(100,170,255,0.8);
        }
        .custom-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #fff 0%, #c8d8ff 40%, #6af 80%, #48a 100%);
          border: 2px solid rgba(255,255,255,0.9);
          cursor: pointer;
          box-shadow: 0 0 0 3px rgba(100, 170, 255, 0.2), 0 3px 10px rgba(0,0,0,0.5);
        }
      `}</style>

      <div
        style={{
          width: '30%',
          minWidth: 280,
          maxWidth: 420,
          padding: '24px 20px',
          background: 'rgba(20, 26, 38, 0.72)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRight: '1px solid rgba(100, 150, 255, 0.18)',
          boxShadow: '2px 0 30px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 6,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background:
                  'linear-gradient(135deg, #4a90ff 0%, #9066ff 50%, #ff6b9d 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(100, 140, 255, 0.4)',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 20h18" />
                <path d="M5 20l4-10 4 5 4-8 4 13" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  background:
                    'linear-gradient(90deg, #9fc5ff, #c29eff, #ffb0cc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: 0.4,
                }}
              >
                地形生成器
              </div>
              <div style={{ fontSize: 10.5, color: '#6a7484', letterSpacing: 0.6 }}>
                3D TERRAIN GENERATOR v1.0
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: '#8a94a5',
              lineHeight: 1.6,
              paddingLeft: 42,
              marginTop: 4,
            }}
          >
            调节参数实时生成三维地形，点击地表可查看海拔剖面分析
          </div>
        </div>

        <div
          style={{
            padding: '14px 14px 4px',
            borderRadius: 12,
            background: 'rgba(15, 20, 32, 0.6)',
            border: '1px solid rgba(255,255,255,0.05)',
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 18,
              paddingBottom: 12,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              style={{
                width: 3,
                height: 16,
                borderRadius: 2,
                background: 'linear-gradient(180deg, #6af, #a6f)',
              }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#bcc6d5',
                letterSpacing: 1.5,
              }}
            >
              地形参数控制
            </span>
          </div>

          <ParamSlider
            label="起伏度"
            value={params.roughness}
            min={0}
            max={100}
            step={1}
            onChange={(v) => setParams({ roughness: v })}
          />

          <ParamSlider
            label="山峰密度"
            value={params.peakDensity}
            min={0}
            max={10}
            step={0.1}
            onChange={(v) => setParams({ peakDensity: v })}
          />

          <ParamSlider
            label="平滑度"
            value={params.smoothness}
            min={1}
            max={5}
            step={0.1}
            onChange={(v) => setParams({ smoothness: v })}
          />
        </div>

        <div
          style={{
            marginTop: 'auto',
            padding: 14,
            borderRadius: 12,
            background:
              'linear-gradient(135deg, rgba(100,150,255,0.08), rgba(200,100,200,0.06))',
            border: '1px solid rgba(100,150,255,0.18)',
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: '#9ca7ba',
              lineHeight: 1.7,
              marginBottom: 10,
            }}
          >
            <span style={{ color: '#7ab0ff', fontWeight: 600 }}>操作提示</span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 7,
              fontSize: 11.5,
              color: '#8b95a6',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: 'rgba(100,170,255,0.15)',
                  color: '#8fbfff',
                  fontSize: 10,
                  fontWeight: 600,
                  minWidth: 42,
                  textAlign: 'center',
                }}
              >
                拖拽
              </span>
              旋转视角观察地形
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: 'rgba(170, 120, 255, 0.15)',
                  color: '#c3a0ff',
                  fontSize: 10,
                  fontWeight: 600,
                  minWidth: 42,
                  textAlign: 'center',
                }}
              >
                滚轮
              </span>
              缩放视口距离
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: 'rgba(255,120,150,0.15)',
                  color: '#ff99b0',
                  fontSize: 10,
                  fontWeight: 600,
                  minWidth: 42,
                  textAlign: 'center',
                }}
              >
                点击
              </span>
              查看剖面分析
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.05)',
            fontSize: 10,
            color: '#565f70',
            textAlign: 'center',
            letterSpacing: 0.8,
          }}
        >
          THREE.JS · ZUSTAND · TYPESCRIPT
        </div>
      </div>

      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <TerrainComponent />
        <ProfilePanel />
      </div>
    </div>
  )
}
