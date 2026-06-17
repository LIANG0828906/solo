import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CodeAnalyzer } from '../modules/analyzer/CodeAnalyzer';
import { GitHubFetcher } from '../modules/github/GitHubFetcher';

export function Panel() {
  const [inputValue, setInputValue] = useState('');
  const {
    nodes,
    edges,
    isPlaying,
    speed,
    togglePlay,
    setSpeed,
    resetAnimation,
  } = useAppStore();

  const moduleTypes = new Set(nodes.map((n) => n.moduleType));

  const handleAnalyze = () => {
    if (!inputValue.trim()) return;

    if (inputValue.includes('github.com')) {
      const fetcher = new GitHubFetcher();
      fetcher.fetchRepo(inputValue);
    } else {
      const analyzer = new CodeAnalyzer();
      const result = analyzer.analyze(inputValue);
      useAppStore.getState().setNodes(result.nodes);
      useAppStore.getState().setEdges(result.edges);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleAnalyze();
    }
  };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div style={logoStyle}>
          <span style={logoIconStyle}>◈</span>
          <span style={logoTextStyle}>代码时光机</span>
        </div>
        <div style={subtitleStyle}>Code Time Machine</div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>代码输入</div>
        <textarea
          style={textareaStyle}
          placeholder="输入 GitHub 仓库链接，或直接粘贴代码片段...

支持 Ctrl+Enter 快速分析"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button style={buttonStyle} onClick={handleAnalyze}>
          分析代码
        </button>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>数据统计</div>
        <div style={statsContainerStyle}>
          <div style={statCardStyle}>
            <div style={statNumberStyle}>{nodes.length}</div>
            <div style={statLabelStyle}>节点数</div>
          </div>
          <div style={statCardStyle}>
            <div style={statNumberStyle}>{edges.length}</div>
            <div style={statLabelStyle}>连接数</div>
          </div>
          <div style={statCardStyle}>
            <div style={statNumberStyle}>{moduleTypes.size}</div>
            <div style={statLabelStyle}>模块数</div>
          </div>
        </div>
        <div style={legendStyle}>
          <div style={legendItemStyle}>
            <span style={{ ...legendDotStyle, backgroundColor: '#6BCB77' }}></span>
            <span style={legendTextStyle}>工具函数</span>
          </div>
          <div style={legendItemStyle}>
            <span style={{ ...legendDotStyle, backgroundColor: '#4ECDC4' }}></span>
            <span style={legendTextStyle}>业务逻辑</span>
          </div>
          <div style={legendItemStyle}>
            <span style={{ ...legendDotStyle, backgroundColor: '#FFD93D' }}></span>
            <span style={legendTextStyle}>UI组件</span>
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>动画控制</div>
        <div style={controlsContainerStyle}>
          <button
            style={{ ...controlButtonStyle, flex: 1 }}
            onClick={togglePlay}
          >
            {isPlaying ? '⏸ 暂停' : '▶ 播放'}
          </button>
          <button
            style={{ ...controlButtonStyle, flex: 1, marginLeft: 8 }}
            onClick={resetAnimation}
          >
            ↻ 重置
          </button>
        </div>
        <div style={sliderContainerStyle}>
          <span style={sliderLabelStyle}>速度</span>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            style={sliderStyle}
          />
          <span style={sliderValueStyle}>{speed.toFixed(1)}x</span>
        </div>
      </div>

      <div style={footerStyle}>
        <span style={footerTextStyle}>拖拽旋转 · 滚轮缩放 · 点击查看详情</span>
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  left: 20,
  top: 20,
  width: 280,
  maxHeight: 'calc(100vh - 40px)',
  backgroundColor: '#12122A',
  borderRadius: 16,
  border: '1px solid #2A2A44',
  padding: 20,
  zIndex: 100,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  overflowY: 'auto',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  paddingBottom: 16,
  borderBottom: '1px solid #2A2A44',
};

const logoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginBottom: 4,
};

const logoIconStyle: React.CSSProperties = {
  fontSize: 24,
  color: '#4ECDC4',
};

const logoTextStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: '#ffffff',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#A0A0B0',
  letterSpacing: 1,
  textTransform: 'uppercase',
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#A0A0B0',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  height: 120,
  backgroundColor: '#0D0D1F',
  border: '1px solid #2D2D4A',
  borderRadius: 8,
  padding: 12,
  color: '#E0E0E0',
  fontSize: 12,
  fontFamily: 'monospace',
  resize: 'none',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
  lineHeight: 1.5,
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  height: 36,
  backgroundColor: '#4ECDC4',
  color: '#0B0D17',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};

const statsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  justifyContent: 'space-between',
};

const statCardStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 80,
  backgroundColor: '#1A1A2E',
  borderRadius: 8,
  padding: '12px 8px',
  textAlign: 'center',
};

const statNumberStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: '#FFD93D',
  marginBottom: 4,
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#A0A0B0',
};

const legendStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginTop: 4,
};

const legendItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const legendDotStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: '50%',
};

const legendTextStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#C0C0D0',
};

const controlsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
};

const controlButtonStyle: React.CSSProperties = {
  height: 36,
  backgroundColor: '#4ECDC4',
  color: '#0B0D17',
  border: 'none',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};

const sliderContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const sliderLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#A0A0B0',
  minWidth: 32,
};

const sliderStyle: React.CSSProperties = {
  flex: 1,
  height: 4,
  appearance: 'none',
  backgroundColor: '#2A2A44',
  borderRadius: 2,
  outline: 'none',
  cursor: 'pointer',
};

const sliderValueStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#4ECDC4',
  fontWeight: 600,
  minWidth: 32,
  textAlign: 'right',
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  paddingTop: 12,
  borderTop: '1px solid #2A2A44',
};

const footerTextStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#606080',
};
