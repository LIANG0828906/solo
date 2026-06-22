import { useSceneStore } from '@/store/useSceneStore';
import type { CameraMode } from '@/types';

export function ViewSwitcher() {
  const { cameraMode, setCameraMode } = useSceneStore();

  const views: { mode: CameraMode; label: string; icon: string }[] = [
    { mode: 'top45', label: '俯视45°', icon: '⬀' },
    { mode: 'south', label: '正南', icon: '↑' },
    { mode: 'free', label: '自由', icon: '⟳' },
  ];

  return (
    <div className="view-switcher">
      {views.map((view) => (
        <button
          key={view.mode}
          className={`view-btn ${cameraMode === view.mode ? 'active' : ''}`}
          onClick={() => setCameraMode(view.mode)}
          title={view.label}
        >
          <span className="btn-icon">{view.icon}</span>
          <span className="btn-label">{view.label}</span>
        </button>
      ))}

      <style>{`
        .view-switcher {
          position: absolute;
          top: 20px;
          right: 20px;
          display: flex;
          gap: 8px;
          z-index: 100;
        }

        .view-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: inherit;
          min-width: 64px;
        }

        .view-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: scale(1.05);
          color: #fff;
        }

        .view-btn.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .btn-icon {
          font-size: 18px;
          line-height: 1;
        }

        .btn-label {
          font-size: 11px;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .view-switcher {
            top: 12px;
            right: 12px;
            gap: 6px;
          }

          .view-btn {
            padding: 8px 10px;
            min-width: 52px;
          }

          .btn-icon {
            font-size: 16px;
          }

          .btn-label {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
}
