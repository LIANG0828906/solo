import React from 'react';
import { useStore } from '@/store';

const PresetPanel: React.FC = () => {
  const presets = useStore((s) => s.presets);
  const selectedPreset = useStore((s) => s.selectedPreset);
  const selectPreset = useStore((s) => s.selectPreset);
  const isPlaying = useStore((s) => s.isPlaying);
  const togglePlay = useStore((s) => s.togglePlay);

  return (
    <>
      <div className="preset-panel-desktop">
        <div className="preset-title">PRESETS</div>
        <ul className="preset-list">
          {presets.map((preset, idx) => (
            <li
              key={idx}
              className={`preset-item ${selectedPreset === idx ? 'active' : ''}`}
              onClick={() => selectPreset(idx)}
            >
              {selectedPreset === idx && <div className="preset-indicator" />}
              <span className="preset-name">{preset.name}</span>
            </li>
          ))}
        </ul>
        <button className="play-toggle" onClick={togglePlay}>
          <span className="play-icon">{isPlaying ? '⏸' : '▶'}</span>
          <span className="play-text">{isPlaying ? '暂停' : '继续'}</span>
        </button>
      </div>
      <div className="preset-panel-mobile">
        <div className="preset-scroll">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              className={`preset-chip ${selectedPreset === idx ? 'active' : ''}`}
              onClick={() => selectPreset(idx)}
            >
              {preset.name}
            </button>
          ))}
          <button className="play-chip" onClick={togglePlay}>
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>
      </div>
      <style>{`
        .preset-panel-desktop {
          width: 200px;
          background: #1A1A2E;
          border-radius: 8px;
          padding: 16px 0;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .preset-panel-mobile {
          display: none;
        }
        .preset-title {
          color: #00FF41;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          letter-spacing: 2px;
          padding: 0 16px 12px;
          border-bottom: 1px solid #2A2A3E;
          margin-bottom: 4px;
        }
        .preset-list {
          list-style: none;
          margin: 0;
          padding: 0;
          flex: 1;
        }
        .preset-item {
          height: 44px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          cursor: pointer;
          transition: background 0.2s;
          position: relative;
          color: #E0E0E0;
          font-family: 'Courier New', monospace;
          font-size: 14px;
        }
        .preset-item:hover {
          background: #2A2A3E;
        }
        .preset-item.active {
          background: rgba(0, 255, 65, 0.05);
        }
        .preset-indicator {
          position: absolute;
          left: 0;
          top: 8px;
          bottom: 8px;
          width: 3px;
          background: #00FF41;
          border-radius: 0 2px 2px 0;
        }
        .preset-name {
          padding-left: 4px;
        }
        .play-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin: 12px 16px 0;
          padding: 8px 0;
          background: #2A2A3E;
          border: 1px solid #3A3A4E;
          border-radius: 6px;
          color: #E0E0E0;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .play-toggle:hover {
          background: #3A3A4E;
        }
        .play-icon {
          font-size: 12px;
        }
        .play-text {
          font-size: 13px;
        }
        @media (max-width: 768px) {
          .preset-panel-desktop {
            display: none;
          }
          .preset-panel-mobile {
            display: block;
            width: 100%;
            margin-bottom: 12px;
          }
          .preset-scroll {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            padding: 8px;
            background: #1A1A2E;
            border-radius: 8px;
          }
          .preset-scroll::-webkit-scrollbar {
            height: 4px;
          }
          .preset-scroll::-webkit-scrollbar-thumb {
            background: #3A3A4E;
            border-radius: 2px;
          }
          .preset-chip {
            flex-shrink: 0;
            padding: 6px 14px;
            background: #2A2A3E;
            border: 1px solid #3A3A4E;
            border-radius: 16px;
            color: #E0E0E0;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .preset-chip:hover {
            background: #3A3A4E;
          }
          .preset-chip.active {
            background: rgba(0, 255, 65, 0.15);
            border-color: #00FF41;
            color: #00FF41;
          }
          .play-chip {
            flex-shrink: 0;
            padding: 6px 14px;
            background: #2A2A3E;
            border: 1px solid #3A3A4E;
            border-radius: 16px;
            color: #E0E0E0;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .play-chip:hover {
            background: #3A3A4E;
          }
        }
      `}</style>
    </>
  );
};

export default PresetPanel;
