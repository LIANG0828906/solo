import { useEffect } from 'react';
import { Waveform } from './Waveform';
import { Grid } from './Grid';
import { ControlPanel } from './ControlPanel';
import { useStore } from '../data/store';
import '../styles.css';

export const App = () => {
  const loadFromShareLink = useStore(state => state.loadFromShareLink);

  useEffect(() => {
    const loaded = loadFromShareLink();
    if (loaded) {
      console.log('从分享链接加载配置成功');
    }
  }, [loadFromShareLink]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <span className="title-icon">🎛️</span>
          节奏工坊
          <span className="title-subtitle">Rhythm Workshop</span>
        </h1>
      </header>

      <main className="app-main">
        <section className="top-section">
          <Waveform />
        </section>

        <section className="center-section">
          <Grid />
        </section>

        <section className="bottom-section">
          <ControlPanel />
        </section>
      </main>

      <footer className="app-footer">
        <p>点击网格方块激活节拍 · 拖拽调整旋钮音量 · 选择预设快速开始</p>
      </footer>
    </div>
  );
};
