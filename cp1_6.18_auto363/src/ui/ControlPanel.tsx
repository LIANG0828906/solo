import { useState } from 'react'
import { useAudioStore } from '../store/useAudioStore'
import type { ColorScheme } from '../store/useAudioStore'

const colorSchemeLabels: Record<ColorScheme, string> = {
  fast: '快速变换',
  smooth: '平滑过渡',
  monochrome: '单色渐变',
}

export function ControlPanel() {
  const { density, colorScheme, damping } = useAudioStore(
    (state) => state.particleConfig
  )
  const setParticleConfig = useAudioStore((state) => state.setParticleConfig)
  const [showHelp, setShowHelp] = useState(false)

  return (
    <>
      <div className="control-panel">
        <button
          className="help-button"
          onClick={() => setShowHelp(true)}
          title="帮助"
        >
          ?
        </button>

        <h3 className="panel-title">控制面板</h3>

        <div className="control-group">
          <div className="control-label">
            <span>粒子密度</span>
            <span className="control-value">{density}</span>
          </div>
          <div className="slider-track">
            <input
              type="range"
              min={200}
              max={2000}
              step={100}
              value={density}
              onChange={(e) =>
                setParticleConfig({ density: Number(e.target.value) })
              }
              className="slider-input"
            />
            <div
              className="slider-fill"
              style={{
                width: `${((density - 200) / (2000 - 200)) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="control-group">
          <div className="control-label">
            <span>颜色映射方案</span>
          </div>
          <select
            className="scheme-select"
            value={colorScheme}
            onChange={(e) =>
              setParticleConfig({ colorScheme: e.target.value as ColorScheme })
            }
          >
            <option value="fast">快速变换</option>
            <option value="smooth">平滑过渡</option>
            <option value="monochrome">单色渐变</option>
          </select>
        </div>

        <div className="control-group">
          <div className="control-label">
            <span>运动阻尼系数</span>
            <span className="control-value">{damping.toFixed(2)}</span>
          </div>
          <div className="slider-track">
            <input
              type="range"
              min={0.8}
              max={0.99}
              step={0.01}
              value={damping}
              onChange={(e) =>
                setParticleConfig({ damping: Number(e.target.value) })
              }
              className="slider-input"
            />
            <div
              className="slider-fill"
              style={{
                width: `${((damping - 0.8) / (0.99 - 0.8)) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {showHelp && (
        <div className="help-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-content" onClick={(e) => e.stopPropagation()}>
            <h3>操作说明</h3>
            <ul>
              <li>点击左下角"开始捕获"按钮启动麦克风</li>
              <li>鼠标拖拽可旋转3D视角</li>
              <li>滚轮可缩放场景</li>
              <li>调节控制面板滑块改变粒子效果</li>
              <li>声音越大，粒子运动越剧烈</li>
              <li>音量超过阈值时粒子会爆发脉冲</li>
            </ul>
            <button
              className="close-button"
              onClick={() => setShowHelp(false)}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      <style>{`
        .control-panel {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 240px;
          background: rgba(20, 20, 40, 0.9);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 12px;
          padding: 16px;
          z-index: 100;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .help-button {
          position: absolute;
          top: 12px;
          left: 12px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #666;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .help-button:hover {
          background: #888;
        }

        .panel-title {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 16px 0;
          text-align: center;
        }

        .control-group {
          margin-bottom: 12px;
        }

        .control-group:last-child {
          margin-bottom: 0;
        }

        .control-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: rgba(255, 255, 255, 0.9);
          font-size: 13px;
          margin-bottom: 8px;
        }

        .control-value {
          color: #4ECDC4;
          font-weight: 600;
          font-family: monospace;
        }

        .slider-track {
          position: relative;
          width: 100%;
          height: 6px;
          background: #333;
          border-radius: 3px;
          overflow: hidden;
        }

        .slider-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, #FF6B6B, #4ECDC4);
          border-radius: 3px;
          pointer-events: none;
          transition: width 0.1s;
        }

        .slider-input {
          position: relative;
          width: 100%;
          height: 6px;
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          z-index: 1;
          margin: 0;
        }

        .slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
          cursor: pointer;
          transition: transform 0.2s;
        }

        .slider-input::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        .slider-input::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
          cursor: pointer;
          border: none;
          transition: transform 0.2s;
        }

        .slider-input::-moz-range-thumb:hover {
          transform: scale(1.1);
        }

        .scheme-select {
          width: 100%;
          height: 32px;
          background: rgba(51, 51, 51, 0.8);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 0 8px;
          font-size: 13px;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .scheme-select:hover {
          border-color: rgba(78, 205, 196, 0.5);
        }

        .scheme-select:focus {
          outline: none;
          border-color: #4ECDC4;
        }

        .help-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
        }

        .help-content {
          background: rgba(30, 30, 50, 0.95);
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          color: white;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .help-content h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          color: #4ECDC4;
        }

        .help-content ul {
          margin: 0 0 20px 0;
          padding-left: 20px;
          line-height: 1.8;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
        }

        .close-button {
          width: 100%;
          height: 36px;
          background: #4ECDC4;
          color: white;
          border: none;
          border-radius: 18px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .close-button:hover {
          background: #3db8b0;
        }

        @media (max-width: 768px) {
          .control-panel {
            bottom: 0;
            right: 0;
            left: 0;
            width: 100%;
            border-radius: 12px 12px 0 0;
            padding: 12px 16px;
          }

          .panel-title {
            font-size: 14px;
            margin-bottom: 12px;
          }

          .control-group {
            margin-bottom: 10px;
          }

          .control-label {
            font-size: 12px;
          }
        }
      `}</style>
    </>
  )
}
