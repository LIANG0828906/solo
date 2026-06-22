
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useCardContext } from '../context/CardContext';

const TimeMachine: React.FC = () => {
  const { cards, timeLineStamp, timeLineMode, setTimeLineStamp, setTimeLineMode } = useCardContext();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getTimeRange = useCallback(() => {
    if (cards.length === 0) {
      const now = Date.now();
      return { min: now - 86400000, max: now };
    }
    const times = cards.map(c => new Date(c.createdAt).getTime());
    const min = Math.min(...times);
    const max = Date.now();
    return { min, max: max > min ? max : min + 1 };
  }, [cards]);

  const { min, max } = getTimeRange();
  const trackWidth = isMobile ? 160 : 200;

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const getPositionFromTime = (time: number) => {
    const range = max - min;
    if (range === 0) return 0;
    const ratio = (time - min) / range;
    return ratio * trackWidth;
  };

  const getTimeFromPosition = (pos: number) => {
    const ratio = Math.max(0, Math.min(1, pos / trackWidth));
    return min + ratio * (max - min);
  };

  const handleSliderMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    setTimeLineMode(true);
  }, [setTimeLineMode]);

  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const slider = sliderRef.current;
    if (!slider) return;
    
    const rect = slider.getBoundingClientRect();
    const pos = e.clientX - rect.left;
    const clampedPos = Math.max(0, Math.min(trackWidth, pos));
    const newTime = getTimeFromPosition(clampedPos);
    setTimeLineStamp(newTime);
  }, [trackWidth, getTimeFromPosition, setTimeLineStamp]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const slider = sliderRef.current;
      if (!slider) return;

      const rect = slider.getBoundingClientRect();
      const pos = e.clientX - rect.left;
      const clampedPos = Math.max(0, Math.min(trackWidth, pos));
      const newTime = getTimeFromPosition(clampedPos);
      setTimeLineStamp(newTime);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setTimeLineMode(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, trackWidth, getTimeFromPosition, setTimeLineStamp, setTimeLineMode]);

  const sliderPosition = getPositionFromTime(timeLineStamp);

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <div
        style={{
          color: '#F8FAFC',
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          padding: '4px 10px',
          borderRadius: '6px',
          backdropFilter: 'blur(4px)',
          whiteSpace: 'nowrap',
        }}
      >
        {formatTimestamp(timeLineStamp)}
      </div>

      <div
        ref={sliderRef}
        onClick={handleTrackClick}
        style={{
          width: trackWidth,
          height: '40px',
          backgroundColor: '#1E293B',
          borderRadius: '20px',
          position: 'relative',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          boxSizing: 'border-box',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '14px',
            right: '14px',
            top: '50%',
            height: '2px',
            backgroundColor: '#334155',
            transform: 'translateY(-50%)',
          }}
        />

        <div
          onMouseDown={handleSliderMouseDown}
          style={{
            position: 'absolute',
            left: 14 + sliderPosition - 6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '12px',
            height: '12px',
            backgroundColor: '#6366F1',
            borderRadius: '50%',
            cursor: isDragging ? 'grabbing' : 'grab',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
            transition: isDragging ? 'none' : 'left 0.2s ease',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            height: '2px',
            width: sliderPosition,
            backgroundColor: '#6366F1',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            transition: isDragging ? 'none' : 'width 0.2s ease',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: trackWidth,
          padding: '0 4px',
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            color: '#64748B',
            fontSize: '10px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          最早
        </span>
        <span
          style={{
            color: '#64748B',
            fontSize: '10px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          现在
        </span>
      </div>

      <div
        style={{
          color: '#94A3B8',
          fontSize: '11px',
          fontFamily: 'Inter, sans-serif',
          marginTop: '4px',
        }}
      >
        {timeLineMode ? '⏳ 时间线模式' : '拖动滑块回溯时光'}
      </div>
    </div>
  );
};

export default TimeMachine;
