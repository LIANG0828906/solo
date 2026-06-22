import React, { useRef, useEffect, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { ClockCanvas } from './components/ClockCanvas';
import { ControlPanel } from './components/ControlPanel';
import { useClockStore, type Time } from './store/clockStore';

const formatFilenameDate = () => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

const App: React.FC = () => {
  const { time, dialColor, tickStyle, showNumbers, isScreenshotTriggered, setTime, resetScreenshotTrigger } =
    useClockStore();

  const canvasRef = useRef<HTMLDivElement>(null);

  const handleTimeChange = useCallback(
    (newTime: Time) => {
      setTime(newTime);
    },
    [setTime]
  );

  const handleScreenshot = useCallback(async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `clock_${formatFilenameDate()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('截图失败:', err);
    }

    resetScreenshotTrigger();
  }, [resetScreenshotTrigger]);

  useEffect(() => {
    if (isScreenshotTriggered) {
      handleScreenshot();
    }
  }, [isScreenshotTriggered, handleScreenshot]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">⏰ 时钟教具生成器</h1>
        <p className="app-subtitle">拖拽时针和分针 · 自定义表盘样式 · 一键截图保存</p>
      </header>

      <main className="app-main">
        <section className="canvas-section">
          <ClockCanvas
            ref={canvasRef}
            time={time}
            dialColor={dialColor}
            tickStyle={tickStyle}
            showNumbers={showNumbers}
            onTimeChange={handleTimeChange}
          />
        </section>

        <aside className="panel-section">
          <ControlPanel />
        </aside>
      </main>

      <footer className="app-footer">
        <p>提示：拖拽指针调整时间 · 时针拖拽时自动对齐5分钟刻度</p>
      </footer>
    </div>
  );
};

export default App;
