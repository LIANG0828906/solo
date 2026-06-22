import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';

export function StatusBar() {
  const [fps, setFps] = useState(60);
  const centerOfMass = useGameStore((state) => state.centerOfMass);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const updateFps = () => {
      frameCount++;
      const currentTime = performance.now();
      if (currentTime - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }
      animationId = requestAnimationFrame(updateFps);
    };

    animationId = requestAnimationFrame(updateFps);

    return () => cancelAnimationFrame(animationId);
  }, []);

  const offsetPercent = centerOfMass.offsetPercent;
  const isDanger = centerOfMass.isOutOfBounds;
  const isWarning = offsetPercent > 80 && !isDanger;

  return (
    <>
      <div className="status-bar">
        <div className="status-bar__item">
          <span className="status-bar__label">FPS</span>
          <span className="status-bar__value status-bar__value--fps">{fps}</span>
        </div>
        <div className="status-bar__divider" />
        <div className="status-bar__item">
          <span className="status-bar__label">重心偏移</span>
          <span
            className={`status-bar__value ${
              isDanger
                ? 'status-bar__value--danger'
                : isWarning
                ? 'status-bar__value--warning'
                : 'status-bar__value--normal'
            }`}
          >
            {offsetPercent.toFixed(1)}%
          </span>
        </div>
        <div className="status-bar__divider" />
        <div className="status-bar__item">
          <span className="status-bar__label">总重量</span>
          <span className="status-bar__value">{centerOfMass.totalMass.toFixed(2)}</span>
        </div>
      </div>

      <style>{`
        .status-bar {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 20px;
          height: 30px;
          width: 600px;
          padding: 0 20px;
          background: #1A1A1ACC;
          border: 1px solid #333333;
          border-radius: 8px;
          backdrop-filter: blur(10px);
          z-index: 100;
          color: #ffffff;
          font-size: 13px;
        }

        .status-bar__item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-bar__label {
          color: #888888;
          font-size: 12px;
        }

        .status-bar__value {
          font-family: 'Courier New', monospace;
          font-weight: 600;
        }

        .status-bar__value--fps {
          color: #2ECC71;
        }

        .status-bar__value--normal {
          color: #F1C40F;
        }

        .status-bar__value--warning {
          color: #F39C12;
        }

        .status-bar__value--danger {
          color: #E74C3C;
        }

        .status-bar__divider {
          width: 1px;
          height: 16px;
          background: #333333;
        }

        @media (max-width: 1024px) {
          .status-bar {
            width: 80%;
            font-size: 11px;
            padding: 0 12px;
            gap: 12px;
          }

          .status-bar__label {
            font-size: 10px;
          }
        }
      `}</style>
    </>
  );
}
