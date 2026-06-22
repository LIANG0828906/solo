import React, { useEffect, useRef, useState } from 'react';
import { TopBar } from '@ui/TopBar';
import { Toolbar } from '@ui/toolbar';
import { CollaboratorPanel, CursorLayer } from '@ui/collaboratorPanel';
import { StatusBar } from '@ui/StatusBar';
import { CanvasCore } from '@engine/canvasCore';
import { TextStickyInput } from '@components/TextStickyInput';
import { websocket } from '@network/websocket';
import { useElementStore } from '@data/elementStore';
import { DEFAULT_ROOM_ID } from '@types/index';

interface TextInputState {
  x: number;
  y: number;
  visible: boolean;
}

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coreRef = useRef<CanvasCore | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [textInput, setTextInput] = useState<TextInputState>({
    x: 0,
    y: 0,
    visible: false,
  });
  const [fps, setFps] = useState(60);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [isMobile, setIsMobile] = useState(false);

  const roomId = useElementStore((s) => s.roomId);
  const replay = useElementStore((s) => s.replay);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    if (urlRoom && urlRoom !== DEFAULT_ROOM_ID) {
      useElementStore.getState().setRoom(urlRoom);
    }
  }, []);

  useEffect(() => {
    websocket.connect(roomId);
    websocket.broadcastUserJoin();
    return () => {
      websocket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const core = new CanvasCore(canvasRef.current);
    coreRef.current = core;

    core.setTextInputCallback((x, y) => {
      setTextInput({ x, y, visible: true });
    });

    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ w: rect.width, h: rect.height });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);

    const fpsInterval = window.setInterval(() => {
      setFps(core.getFPS());
    }, 1000);

    const dprTimer = window.setTimeout(() => core.resize(), 50);

    return () => {
      window.clearInterval(fpsInterval);
      window.clearTimeout(dprTimer);
      ro.disconnect();
      core.destroy();
      coreRef.current = null;
    };
  }, []);

  const handleTextConfirm = (x: number, y: number, content: string) => {
    coreRef.current?.addTextElement(x, y, content);
    setTextInput({ x: 0, y: 0, visible: false });
  };

  const handleTextCancel = () => {
    setTextInput({ x: 0, y: 0, visible: false });
  };

  return (
    <div className="app-root">
      <TopBar />

      <div className="main-layout">
        {!isMobile && <Toolbar />}
        {isMobile && <Toolbar />}

        <div
          className={`canvas-container ${replay.isPlaying ? 'replaying' : ''}`}
          ref={containerRef}
        >
          <canvas ref={canvasRef} className="whiteboard-canvas" />

          <CursorLayer canvasWidth={canvasSize.w} canvasHeight={canvasSize.h} />

          {textInput.visible && (
            <TextStickyInput
              x={textInput.x}
              y={textInput.y}
              onConfirm={handleTextConfirm}
              onCancel={handleTextCancel}
            />
          )}

          {replay.isPlaying && (
            <div className="replay-overlay-info">
              <div className="replay-pulse" />
              <span>
                历史回放模式 · 第 {replay.currentStep} / {replay.totalSteps} 步
              </span>
            </div>
          )}
        </div>

        {!isMobile && <CollaboratorPanel />}
      </div>

      <StatusBar fps={fps} />
    </div>
  );
};

export default App;
