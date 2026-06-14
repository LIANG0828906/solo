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
  const [rotation, setRotation] = useState(0);
  const [previewScale, setPreviewScale] = useState(1);

  const lastHueRef = useRef(270);
  const touchStartRef = useRef<{
    dist: number;
    angle: number;
    scale: number;
    rotation: number;
    hue: number;
    saturation: number;
  } | null>(null);
  const singleTouchStartRef = useRef<{
    x: number;
    y: number;
  } | null>(null);

  const emotion = getEmotionByColor(selectedColor);
  const intensity = calculateIntensity(selectedColor);
  const emoji = getEmotionEmoji(emotion.emotion);

  const updateColor = useCallback((newHue: number, newSat: number) => {
    const clampedHue = ((newHue % 360) + 360) % 360;
    const clampedSat = Math.max(20, Math.min(100, newSat));
    lastHueRef.current = clampedHue;
    setHue(clampedHue);
    setSaturation(clampedSat);
    const newColor = hslToHex(clampedHue, clampedSat, lightness);
    setSelectedColor(newColor);
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
    const adjustedHue = (angle - rotation + 360) % 360;
    updateColor(adjustedHue, newSat);
    setPreviewScale(1.08);
  }, [updateColor, rotation]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    setIsDragging(true);
    singleTouchStartRef.current = { x: e.clientX, y: e.clientY };
    getColorFromEvent(e.clientX, e.clientY);
  }, [getColorFromEvent]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    getColorFromEvent(e.clientX, e.clientY);
  }, [isDragging, getColorFromEvent]);

  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setPreviewScale(1);
      setShowNoteInput(true);
      singleTouchStartRef.current = null;
    }
  }, [isDragging]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isDragging) setPreviewScale(1);
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedColor, isDragging]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!wheelRef.current?.contains(e.target as Node)) return;
      e.preventDefault();
      if (e.ctrlKey) {
        setScale(prev => Math.max(0.5, Math.min(1.5, prev - e.deltaY * 0.001)));
      } else if (e.shiftKey) {
        setRotation(prev => prev - e.deltaY * 0.5);
      } else {
        updateColor(hue + e.deltaY * 0.2, saturation);
      }
    };
    const target = wheelRef.current;
    if (target) {
      target.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (target) {
        target.removeEventListener('wheel', handleWheel);
      }
    };
  }, [hue, saturation, updateColor]);

  useEffect(() => {
    const target = wheelRef.current;
    if (!target) return;

    const getTouchCenter = (touches: TouchList) => {
      const t1 = touches[0];
      const t2 = touches[1];
      return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
    };

    const getTouchDistance = (touches: TouchList) => {
      const t1 = touches[0];
      const t2 = touches[1];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchAngle = (touches: TouchList) => {
      const t1 = touches[0];
      const t2 = touches[1];
      return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180 / Math.PI;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        touchStartRef.current = {
          dist: getTouchDistance(e.touches),
          angle: getTouchAngle(e.touches),
          scale,
          rotation,
          hue,
          saturation,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchStartRef.current) {
        e.preventDefault();
        const start = touchStartRef.current;
        const newDist = getTouchDistance(e.touches);
        const newAngle = getTouchAngle(e.touches);

        const newScale = Math.max(0.5, Math.min(1.5, start.scale * (newDist / start.dist)));
        const newRotation = start.rotation + (newAngle - start.angle);
        const center = getTouchCenter(e.touches);

        setScale(newScale);
        setRotation(newRotation);

        if (!wheelRef.current) return;
        const rect = wheelRef.current.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const x = center.x - rect.left - cx;
        const y = center.y - rect.top - cy;
        const maxDist = cx * 0.85;
        const dist = Math.min(Math.sqrt(x * x + y * y), maxDist);
        const normalizedDist = dist / maxDist;
        const newSat = Math.max(20, Math.min(100, 30 + normalizedDist * 70));

        const angle = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
        const adjustedHue = ((angle - newRotation) % 360 + 360) % 360;
        updateColor(adjustedHue, newSat);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2 && touchStartRef.current) {
        const start = touchStartRef.current;
        const hadChange =
          Math.abs(start.hue - hue) > 2 ||
          Math.abs(start.saturation - saturation) > 2;
        if (hadChange) {
          setShowNoteInput(true);
        }
        touchStartRef.current = null;
      }
    };

    target.addEventListener('touchstart', handleTouchStart, { passive: false });
    target.addEventListener('touchmove', handleTouchMove, { passive: false });
    target.addEventListener('touchend', handleTouchEnd);
    target.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      target.removeEventListener('touchstart', handleTouchStart);
      target.removeEventListener('touchmove', handleTouchMove);
      target.removeEventListener('touchend', handleTouchEnd);
      target.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [scale, rotation, hue, saturation, updateColor]);

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

  const indicatorAngle = hue + rotation - 90;
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
        style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
      >
        <div
          ref={wheelRef}
          className={`color-wheel ${isDragging ? 'dragging' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ transform: `rotate(${-rotation}deg)` }}
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
          <div className="color-wheel-center" style={{ transform: `rotate(${-rotation}deg)` }}>
            <div
              className="selected-color-preview"
              style={{
                background: selectedColor,
                boxShadow: `0 0 30px ${selectedColor}80, 0 0 60px ${selectedColor}40`,
                transform: `scale(${previewScale})`,
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
