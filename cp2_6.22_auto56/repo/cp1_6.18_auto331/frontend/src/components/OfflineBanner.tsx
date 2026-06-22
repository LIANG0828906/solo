import { useAppStore } from '../store/useAppStore';

export default function OfflineBanner() {
  const isOnline = useAppStore((state) => state.isOnline);

  if (isOnline) return null;

  return (
    <>
      <div className="offline-banner">
        <span className="offline-icon">⚠</span>
        <span className="offline-text">当前处于离线模式，数据可能不是最新</span>
      </div>
      <style>{`
        .offline-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #FFA500;
          color: #1A1A1A;
          padding: 8px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
          z-index: 9999;
          border-bottom: 1px solid #000;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .offline-icon {
          font-size: 16px;
        }

        .offline-text {
          font-size: 13px;
        }
      `}</style>
    </>
  );
}
