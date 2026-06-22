import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import type { EventType } from '../types';

export function EventModal() {
  const { currentEvent, showEventModal, closeEventModal } = useGameStore((state) => ({
    currentEvent: state.currentEvent,
    showEventModal: state.showEventModal,
    closeEventModal: state.closeEventModal,
  }));

  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (showEventModal) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showEventModal]);

  const handleOverlayClick = () => {
    closeEventModal();
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeEventModal();
  };

  if (!isVisible || !currentEvent) return null;

  const getEventTypeColor = (type: EventType): string => {
    switch (type) {
      case 'beneficial':
        return '#4CAF50';
      case 'harmful':
        return '#E53935';
      case 'neutral':
        return '#FFC107';
      default:
        return '#9E9E9E';
    }
  };

  const getEventTypeLabel = (type: EventType): string => {
    switch (type) {
      case 'beneficial':
        return '有益事件';
      case 'harmful':
        return '有害事件';
      case 'neutral':
        return '中性事件';
      default:
        return '未知';
    }
  };

  return (
    <div
      className={`event-modal-overlay ${isAnimating ? 'fade-in' : 'fade-out'}`}
      onClick={handleOverlayClick}
    >
      <div
        className={`event-modal-card ${isAnimating ? 'scale-in' : 'scale-out'}`}
        onClick={handleModalClick}
      >
        <div
          className="event-type-badge"
          style={{ backgroundColor: getEventTypeColor(currentEvent.type) }}
        >
          {getEventTypeLabel(currentEvent.type)}
        </div>
        <h3 className="event-title">{currentEvent.name}</h3>
        <p className="event-description">{currentEvent.description}</p>
        <p className="event-hint">点击任意处继续</p>
      </div>
    </div>
  );
}
