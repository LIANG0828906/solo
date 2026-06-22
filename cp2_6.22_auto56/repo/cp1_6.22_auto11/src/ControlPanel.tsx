import { useState } from 'react'
import { Settings, X } from 'lucide-react'

interface ControlPanelProps {
  particleCount: number
  colorSpeed: number
  rotationSpeed: number
  flowDirection: { x: number; y: number; z: number }
  onParticleCountChange: (value: number) => void
  onColorSpeedChange: (value: number) => void
  onRotationSpeedChange: (value: number) => void
  onFlowDirectionChange: (axis: 'x' | 'y' | 'z', value: number) => void
}

export default function ControlPanel({
  particleCount,
  colorSpeed,
  rotationSpeed,
  flowDirection,
  onParticleCountChange,
  onColorSpeedChange,
  onRotationSpeedChange,
  onFlowDirectionChange,
}: ControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  const sliderStyle = `
    w-full h-2 rounded-full appearance-none cursor-pointer
    bg-gradient-to-r from-cyan-400 to-purple-500
    hover:scale-[1.02] transition-transform duration-200
  `

  const thumbStyle = `
    appearance-none w-5 h-5 rounded-full bg-white shadow-lg
    cursor-pointer hover:scale-110 transition-transform duration-200
  `

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full
                   bg-gradient-to-br from-cyan-500 to-purple-600
                   shadow-lg shadow-purple-500/30
                   hover:shadow-purple-500/50 hover:scale-110
                   transition-all duration-300 z-50
                   flex items-center justify-center"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Settings className="w-6 h-6 text-white" />
        )}
      </button>

      <div
        className={`fixed bottom-6 left-6 z-40 transition-all duration-300 ease-out
          ${isOpen 
            ? 'translate-y-0 opacity-100 pointer-events-auto' 
            : 'translate-y-8 opacity-0 pointer-events-none'}`}
      >
        <div
          className="w-72 p-5 rounded-2xl
                     bg-white/10 backdrop-blur-xl
                     border border-white/20
                     shadow-2xl shadow-black/30"
        >
          <h2 className="text-white text-lg font-semibold mb-5 tracking-wide">
            星云控制面板
          </h2>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/80">粒子密度</span>
                <span className="text-cyan-300 font-mono">{particleCount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="20000"
                max="50000"
                step="1000"
                value={particleCount}
                onChange={(e) => onParticleCountChange(Number(e.target.value))}
                className={sliderStyle}
                style={
                  {
                    '--thumb-size': '20px',
                  } as React.CSSProperties
                }
              />
              <div className="flex justify-between text-xs text-white/40 mt-1">
                <span>20000</span>
                <span>50000</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/80">颜色周期速度</span>
                <span className="text-cyan-300 font-mono">{colorSpeed.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={colorSpeed}
                onChange={(e) => onColorSpeedChange(Number(e.target.value))}
                className={sliderStyle}
              />
              <div className="flex justify-between text-xs text-white/40 mt-1">
                <span>0.1</span>
                <span>1.0</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/80">旋转速度</span>
                <span className="text-cyan-300 font-mono">{rotationSpeed.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.5"
                step="0.01"
                value={rotationSpeed}
                onChange={(e) => onRotationSpeedChange(Number(e.target.value))}
                className={sliderStyle}
              />
              <div className="flex justify-between text-xs text-white/40 mt-1">
                <span>0.0</span>
                <span>0.5</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-white/80 mb-3">流动方向</div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-white/60 w-4 text-sm">X</span>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={flowDirection.x}
                    onChange={(e) => onFlowDirectionChange('x', Number(e.target.value))}
                    className={`flex-1 h-1.5 rounded-full appearance-none cursor-pointer
                      bg-gradient-to-r from-purple-500 via-white/30 to-cyan-400
                      hover:scale-[1.01] transition-transform duration-200`}
                  />
                  <span className="text-cyan-300 font-mono text-xs w-10 text-right">
                    {flowDirection.x.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/60 w-4 text-sm">Y</span>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={flowDirection.y}
                    onChange={(e) => onFlowDirectionChange('y', Number(e.target.value))}
                    className={`flex-1 h-1.5 rounded-full appearance-none cursor-pointer
                      bg-gradient-to-r from-purple-500 via-white/30 to-cyan-400
                      hover:scale-[1.01] transition-transform duration-200`}
                  />
                  <span className="text-cyan-300 font-mono text-xs w-10 text-right">
                    {flowDirection.y.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/60 w-4 text-sm">Z</span>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={flowDirection.z}
                    onChange={(e) => onFlowDirectionChange('z', Number(e.target.value))}
                    className={`flex-1 h-1.5 rounded-full appearance-none cursor-pointer
                      bg-gradient-to-r from-purple-500 via-white/30 to-cyan-400
                      hover:scale-[1.01] transition-transform duration-200`}
                  />
                  <span className="text-cyan-300 font-mono text-xs w-10 text-right">
                    {flowDirection.z.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s ease;
        }
        
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
        }
      `}</style>
    </>
  )
}
