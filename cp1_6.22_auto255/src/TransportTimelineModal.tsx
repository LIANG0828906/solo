import { useCallback } from 'react';
import { ExhibitionArtwork, TransportStatus, TransportStatusLabels } from './types';

interface TransportTimelineModalProps {
  artwork: ExhibitionArtwork;
  onClose: () => void;
}

function TransportTimelineModal({ artwork, onClose }: TransportTimelineModalProps) {
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const allNodes = [
    { status: TransportStatus.OUT_FOR_DELIVERY, label: '已出库' },
    { status: TransportStatus.IN_TRANSIT, label: '运输中' },
    { status: TransportStatus.ARRIVED, label: '已抵达' }
  ];

  const getStatusInfo = (status: TransportStatus) => {
    const timelineNode = artwork.transportTimeline.find(t => t.status === status);
    const isCompleted = !!timelineNode;
    const isCurrent = artwork.transportStatus === status;

    return {
      isCompleted,
      isCurrent,
      timestamp: timelineNode?.timestamp
    };
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="timeline-modal-overlay" onClick={handleBackdropClick}>
      <div className="timeline-modal">
        <div className="timeline-modal-header">
          <h3>运输轨迹</h3>
          <button className="timeline-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="timeline-artwork-info">
          <div className="timeline-artwork-name">{artwork.name}</div>
          <div className="timeline-artwork-code">{artwork.code}</div>
        </div>

        <div className="timeline-track">
          {allNodes.map((node, index) => {
            const { isCompleted, isCurrent, timestamp } = getStatusInfo(node.status);

            return (
              <div key={node.status} className="timeline-node">
                <div className="timeline-connector">
                  {index < allNodes.length - 1 && (
                    <div
                      className={`connector-line ${isCompleted ? 'filled' : ''}`}
                    />
                  )}
                </div>
                <div className="timeline-dot-wrapper">
                  <div
                    className={`timeline-dot ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                  >
                    {isCompleted && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="10" height="10">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {isCurrent && <span className="pulse-ring"></span>}
                  </div>
                </div>
                <div className="timeline-content">
                  <div className="timeline-label">{node.label}</div>
                  {timestamp ? (
                    <div className="timeline-time">{formatTime(timestamp)}</div>
                  ) : (
                    <div className="timeline-time pending">待完成</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TransportTimelineModal;
