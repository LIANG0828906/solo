import { memo, useRef, useState, useCallback, useEffect } from 'react';
import { useColorStore } from '@/store/useColorStore';
import { getContrastColor } from '@/utils/colorUtils';

const ColorPreview = memo(() => {
  const hex = useColorStore((s) => s.hex);
  const hsl = useColorStore((s) => s.hsl);
  const setHex = useColorStore((s) => s.setHex);
  const addToHistory = useColorStore((s) => s.addToHistory);

  const [inputHex, setInputHex] = useState(hex);
  const [inputError, setInputError] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isEditing, setIsEditing] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setInputHex(hex);
    }
  }, [hex, isEditing]);

  const textColor = getContrastColor(hex);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputHex(v);
  };

  const handleHexFocus = () => {
    setIsEditing(true);
  };

  const handleHexBlur = () => {
    setIsEditing(false);
    const ok = setHex(inputHex);
    if (ok) {
      setInputError(false);
      const state = useColorStore.getState();
      setInputHex(state.hex);
      addToHistory(state.hex, state.hsl);
    } else {
      setInputError(true);
      setInputHex(hex);
      setTimeout(() => setInputError(false), 1500);
    }
  };

  const handleHexKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({
      x: Math.max(10, Math.min(90, x)),
      y: Math.max(10, Math.min(90, y)),
    });
  }, []);

  return (
    <div className="color-preview-wrapper">
      <div
        ref={previewRef}
        className="color-preview"
        style={{ background: hex }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onMouseMove={handleMouseMove}
      >
        <div className="color-info" style={{ color: textColor }}>
          <div className="color-hex-display">{hex}</div>
          <div className="color-hsl-display">
            HSL({hsl.h}, {hsl.s}%, {hsl.l}%)
          </div>
        </div>

        {hovering && (
          <div
            className="magnifier"
            style={{
              left: `${zoomPos.x}%`,
              top: `${zoomPos.y}%`,
              background: hex,
              borderColor: textColor,
            }}
          />
        )}
      </div>

      <div className={`hex-input-wrapper ${inputError ? 'error' : ''}`}>
        <span className="hex-prefix">#</span>
        <input
          type="text"
          className="hex-input"
          value={inputHex.replace(/^#/, '')}
          onChange={handleHexChange}
          onFocus={handleHexFocus}
          onBlur={handleHexBlur}
          onKeyDown={handleHexKeyDown}
          maxLength={6}
          spellCheck={false}
          autoComplete="off"
          placeholder="RRGGBB"
        />
      </div>
    </div>
  );
});

ColorPreview.displayName = 'ColorPreview';
export default ColorPreview;
