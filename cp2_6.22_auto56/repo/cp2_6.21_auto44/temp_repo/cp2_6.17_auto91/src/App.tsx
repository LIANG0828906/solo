import { useEffect } from 'react';
import { PreviewCanvas } from './modules/editor/PreviewCanvas';
import { ControlBar } from './modules/editor/ControlBar';
import { Timeline } from './modules/editor/Timeline';
import { loadSampleVideo } from './modules/video/videoStore';
import './App.css';

function App() {
  useEffect(() => {
    loadSampleVideo();
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">
          <span className="title-accent">Clip</span>Canvas
        </h1>
        <p className="app-subtitle">交互式视频剪辑时间轴编辑器</p>
      </header>

      <main className="app-main">
        <section className="preview-section">
          <PreviewCanvas />
          <ControlBar />
        </section>

        <section className="timeline-section">
          <Timeline />
        </section>
      </main>
    </div>
  );
}

export default App;
