import React, { useCallback, useRef, useState, useEffect } from 'react';
import { getEmotionByColor, hslToHex, calculateIntensity, getEmotionEmoji } from './emotionMap';
import { EmotionRecord } from '@/shared/types';
import { generateId } from '@/shared/storage';

interface Props {
  onColorSelect: (record: EmotionRecord) => void;
  selectedDate: string;
}

export const ColorWheel: React.FC<Props> = ({ onColorSelect, selectedDate }) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [hue, setHue] = useState(270);
  const [saturation, setSaturation] = useState(70);
  const [lightness] = useState(50);
  const [selectedColor, setSelectedColor] = useState('#8b5cf6');
  const [isDragging, setIsDragging] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState('');
  const [rippleActive, setRippleActive] = useState(false);
  const [scale, setScale] = useState(1);

  const emotion = getEmotionByColor(selectedColor);
  const intensity = calculateIntensity(selectedColor);
  const emoji = getEmotionEmoji(emotion.emotion);

  const updateColor = useCallback((newHue: number, newSat: number) => {
    const clampedHue = ((newHue % 360) + 360) % 360;
    const clampedSat = Math.max(20, Math.min(100, newSat));
    setHue(clampedHue);
    setSaturation(clampedSat);
    setSelectedColor(hslToHex(clampedHue, clampedSat, lightness));
  }, [lightness]);

  const getColorFromEvent = useCallback((clientX: number, clientY: number) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;

    const angle = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    const maxDist = centerX * 0.85;
    const distance = Math.min(Math.sqrt(x * x + y * y), maxDist);
    const normalizedDist = distance / maxDist;

    const newSat = 30 + normalizedDist * 70;
    updateColor(angle, newSat);
  }, [updateColor]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    getColorFromEvent(e.clientX, e.clientY);
  }, [getColorFromEvent]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    getColorFromEvent(e.clientX, e.clientY);
  }, [isDragging, getColorFromEvent]);

  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setShowNoteInput(true);
    }
  }, [isDragging]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!wheelRef.current?.contains(e.target as Node)) return;
      e.preventDefault();
      if (e.ctrlKey) {
        setScale(prev => Math.max(0.5, Math.min(1.5, prev - e.deltaY * 0.001)));
      } else {
        updateColor(hue + e.deltaY * 0.2, saturation);
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [hue, saturation, updateColor]);

  const handleSubmit = () => {
    setRippleActive(true);
    const record: EmotionRecord = {
      id: generateId(),
      date: selectedDate,
      color: selectedColor,
      emotion: emotion.emotion,
      note: note.trim(),
      intensity,
    };
    onColorSelect(record);
    setTimeout(() => {
      setRippleActive(false);
      setShowNoteInput(false);
      setNote('');
    }, 600);
  };

  const indicatorAngle = hue - 90;
  const indicatorDist = 38 + (saturation - 30) / 70 * 8;

  return (
    <div className="color-wheel-container">
      <div className="color-wheel-title">
        <span className="title-icon">🎨</span>
        <span>选择今日色彩</span>
      </div>
      <div className="date-display">{selectedDate}</div>

      <div
        className="color-wheel-wrapper"
        style={{ transform: `scale(${scale})` }}
      >
        <div
          ref={wheelRef}
          className={`color-wheel ${isDragging ? 'dragging' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div className="color-wheel-ring" />
          <div
            className="color-indicator"
            style={{
              transform: `rotate(${indicatorAngle}deg) translateY(-${indicatorDist}%)`,
            }}
          >
            <div className="indicator-dot" style={{ background: selectedColor }} />
          </div>
          <div className="color-wheel-center">
            <div
              className="selected-color-preview"
              style={{
                background: selectedColor,
                boxShadow: `0 0 30px ${selectedColor}80, 0 0 60px ${selectedColor}40`,
              }}
            >
              {rippleActive && <div className="ripple-effect" style={{ borderColor: selectedColor }} />}
            </div>
            <div className="color-info">
              <span className="color-hex">{selectedColor.toUpperCase()}</span>
              <span className="color-emotion">{emoji} {emotion.emotion}</span>
              <span className="color-desc">{emotion.description}</span>
            </div>
          </div>
        </div>
      </div>

      {showNoteInput && (
        <div className="note-input-overlay">
          <div className="note-input-card glass">
            <div className="note-header">
              <div className="note-color-chip" style={{ background: selectedColor }} />
              <span>{emoji} {emotion.emotion}</span>
            </div>
            <textarea
              className="note-textarea"
              placeholder="写下今天的心情..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              rows={3}
              autoFocus
            />
            <div className="note-actions">
              <button className="btn-cancel" onClick={() => setShowNoteInput(false)}>取消</button>
              <button className="btn-submit" onClick={handleSubmit} style={{ background: selectedColor }}>
                记录心情
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
