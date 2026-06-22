import { useState, useEffect, useRef } from 'react';
import type { Frame } from '../../types';

interface StoryBoardProps {
  frame: Frame | null;
  canvasWidth: number;
  canvasHeight: number;
}

function htmlToPlainText(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export default function StoryBoard({ frame, canvasWidth, canvasHeight }: StoryBoardProps) {
  const [isSwitching, setIsSwitching] = useState(false);
  const prevFrameId = useRef<string | null>(null);

  useEffect(() => {
    if (prevFrameId.current !== frame?.id) {
      prevFrameId.current = frame?.id || null;
      setIsSwitching(true);
      const t = setTimeout(() => setIsSwitching(false), 200);
      return () => clearTimeout(t);
    }
  }, [frame?.id]);

  const description = frame?.description || '';
  const plainText = htmlToPlainText(description);

  return (
    <div className="canvas-area">
      <div className={`canvas-wrapper ${isSwitching ? 'switching' : ''}`}>
        <canvas
          className="main-canvas"
          width={canvasWidth}
          height={canvasHeight}
          style={{ width: canvasWidth, height: canvasHeight }}
        />
        <div className={`preview-overlay ${!plainText ? 'empty' : ''}`}>
          <div className="preview-overlay-title">帧描述预览</div>
          <div
            className="preview-overlay-content"
            dangerouslySetInnerHTML={{ __html: description || '<span style="color:#aaa">暂无描述</span>' }}
          />
        </div>
      </div>
    </div>
  );
}
