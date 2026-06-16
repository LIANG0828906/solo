import React, { useEffect } from 'react';
import ControlBar from './components/ControlBar';
import StaffView from './components/StaffView';
import PianoKeyboard from './components/PianoKeyboard';
import SavedList from './components/SavedList';
import { useMusicStore } from './store/musicStore';

const App: React.FC = () => {
  const { notes, currentNoteIndex, playProgress, parseScore } = useMusicStore();

  useEffect(() => {
    parseScore();
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#121212',
        color: '#ECF0F1',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <header
        style={{
          textAlign: 'center',
          padding: '8px 0',
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            background: 'linear-gradient(90deg, #F39C12, #3498DB)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 4,
          }}
        >
          乐谱可视化学习工具
        </h1>
        <p style={{ fontSize: 13, color: '#7F8C8D' }}>
          输入乐谱文本 → 解析 → 播放，体验音高与钢琴键位的直观对应
        </p>
      </header>

      <ControlBar />

      <StaffView
        notes={notes}
        currentNoteIndex={currentNoteIndex}
        playProgress={playProgress}
      />

      <div
        style={{
          backgroundColor: '#1C1C1C',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '8px 16px',
            borderBottom: '1px solid #2C2C2C',
            fontSize: 13,
            color: '#BDC3C7',
          }}
        >
          🎹 虚拟钢琴键盘（悬停查看音名，点击试听）
        </div>
        <PianoKeyboard />
      </div>

      <div
        style={{
          backgroundColor: '#1C1C1C',
          borderRadius: '8px',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #2C2C2C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#ECF0F1' }}>
            📚 我的收藏
          </h2>
          <span style={{ fontSize: 12, color: '#7F8C8D' }}>
            最多保存 20 个片段
          </span>
        </div>
        <SavedList />
      </div>

      <footer
        style={{
          textAlign: 'center',
          padding: '16px 0',
          fontSize: 12,
          color: '#555',
        }}
      >
        乐谱格式说明：每个音符以「音名+八度,时值」表示，空格分隔。
        例如：C4,1 D4,0.5 E4,2（时值1代表四分音符）
      </footer>
    </div>
  );
};

export default App;
