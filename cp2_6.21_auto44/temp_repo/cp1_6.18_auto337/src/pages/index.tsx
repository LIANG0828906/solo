import React, { useEffect } from 'react';
import { Recorder } from '../components/Recorder';
import { EmotionChart } from '../components/EmotionChart';
import { HistoryChart } from '../components/HistoryChart';
import { useStore } from '../lib/store';
import { getHistory } from '../lib/api';

const Index: React.FC = () => {
  const { activeTab, setActiveTab, currentRecording, setHistory, isAnalyzing } = useStore();

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await getHistory();
        setHistory(data);
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    };
    loadHistory();
  }, [setHistory]);

  return (
    <div style={styles.container} className="layout-container">
      <div style={styles.leftPanel} className="left-panel">
        <div style={styles.header}>
          <h1 style={styles.title}>声纹情绪图谱</h1>
          <p style={styles.subtitle}>录制语音，探索你的情绪世界</p>
        </div>

        <div style={styles.tabContainer}>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'record' ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab('record')}
          >
            录音
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'result' ? styles.tabActive : {}),
              ...(!currentRecording ? styles.tabDisabled : {}),
            }}
            onClick={() => currentRecording && setActiveTab('result')}
            disabled={!currentRecording}
          >
            结果
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'history' ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab('history')}
          >
            历史
          </button>
        </div>

        {activeTab === 'record' && <Recorder />}
        {activeTab === 'result' && currentRecording && (
          <div style={styles.resultPanel}>
            <div style={styles.resultHeader}>
              <h3 style={styles.resultTitle}>情绪分析结果</h3>
              {isAnalyzing && <span style={styles.analyzing}>分析中...</span>}
            </div>
            <div style={styles.resultInfo}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>录音时长:</span>
                <span style={styles.infoValue}>{currentRecording.duration.toFixed(1)}秒</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>主情绪:</span>
                <span style={{
                  ...styles.infoValue,
                  color: getEmotionColor(currentRecording.emotionCategory),
                }}>
                  {getEmotionLabel(currentRecording.emotionCategory)}
                </span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>愉悦度:</span>
                <span style={styles.infoValue}>{currentRecording.valence.toFixed(2)}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>激活度:</span>
                <span style={styles.infoValue}>{currentRecording.arousal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'history' && (
          <div style={styles.historyPanel}>
            <h3 style={styles.panelTitle}>历史记录</h3>
            <p style={styles.panelSubtitle}>点击散点图查看详细信息</p>
          </div>
        )}
      </div>

      <div style={styles.rightPanel}>
        {(activeTab === 'record' || activeTab === 'result') && currentRecording ? (
          <EmotionChart data={currentRecording} />
        ) : activeTab === 'history' ? (
          <HistoryChart />
        ) : (
          <div style={styles.placeholder}>
            <div style={styles.placeholderIcon}>🎤</div>
            <p style={styles.placeholderText}>录制一段语音开始探索</p>
            <p style={styles.placeholderHint}>支持1-10秒语音录制</p>
          </div>
        )}
      </div>
    </div>
  );
};

function getEmotionColor(category: string): string {
  const colors: Record<string, string> = {
    happy: '#FFD93D',
    calm: '#6BCB77',
    sad: '#4F8FD3',
    angry: '#FF6B6B',
  };
  return colors[category] || '#E2E2E2';
}

function getEmotionLabel(category: string): string {
  const labels: Record<string, string> = {
    happy: '开心',
    calm: '平静',
    sad: '忧伤',
    angry: '愤怒',
  };
  return labels[category] || category;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#1A1A2E',
    color: '#E2E2E2',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  leftPanel: {
    width: '400px',
    minWidth: '400px',
    padding: '32px 24px',
    backgroundColor: '#16213E',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  rightPanel: {
    flex: 1,
    padding: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '600px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '8px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '14px',
    color: '#8892B0',
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
    backgroundColor: '#0F172A',
    padding: '4px',
    borderRadius: '12px',
  },
  tab: {
    flex: 1,
    padding: '12px 16px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#8892B0',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  tabActive: {
    backgroundColor: '#667EEA',
    color: '#fff',
  },
  tabDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  resultPanel: {
    backgroundColor: '#0F172A',
    borderRadius: '16px',
    padding: '24px',
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  resultTitle: {
    fontSize: '18px',
    fontWeight: '600',
  },
  analyzing: {
    fontSize: '12px',
    color: '#667EEA',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  resultInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#16213E',
    borderRadius: '10px',
  },
  infoLabel: {
    fontSize: '14px',
    color: '#8892B0',
  },
  infoValue: {
    fontSize: '14px',
    fontWeight: '600',
  },
  historyPanel: {
    backgroundColor: '#0F172A',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
  },
  panelTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  panelSubtitle: {
    fontSize: '12px',
    color: '#8892B0',
  },
  placeholder: {
    textAlign: 'center',
    color: '#8892B0',
  },
  placeholderIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    opacity: 0.5,
  },
  placeholderText: {
    fontSize: '18px',
    marginBottom: '8px',
  },
  placeholderHint: {
    fontSize: '14px',
    opacity: 0.7,
  },
};

export default Index;
