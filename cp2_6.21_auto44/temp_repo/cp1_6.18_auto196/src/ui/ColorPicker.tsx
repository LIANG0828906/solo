import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useGradientStore } from '../store/useGradientStore';
import { colorEngine } from '../engine/ColorEngine';
import { hexToRgb, hexToHsl, rgbToHex, hslToHex } from '../utils/colorUtils';
import type { ColorMode } from '../types';

const ColorPicker: React.FC = () => {
  const {
    stops,
    angle,
    selectedStopId,
    setSelectedStopId,
    updateStop,
    addStop,
    removeStop
  } = useGradientStore();

  const [colorMode, setColorMode] = useState<ColorMode>('hex');
  const [colorInput, setColorInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStopId, setDragStopId] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const sortedStops = useMemo(() => {
    return [...stops].sort((a, b) => a.position - b.position);
  }, [stops]);

  const selectedStop = useMemo(() => {
    return stops.find((s) => s.id === selectedStopId);
  }, [stops, selectedStopId]);

  const gradientBackground = useMemo(() => {
    return colorEngine.generateCSSGradient({ stops, angle, steps: 50 });
  }, [stops, angle]);

  useEffect(() => {
    if (selectedStop) {
      switch (colorMode) {
        case 'hex':
          setColorInput(selectedStop.color);
          break;
        case 'rgb': {
          const rgb = hexToRgb(selectedStop.color);
          if (rgb) {
            setColorInput(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
          }
          break;
        }
        case 'hsl': {
          const hsl = hexToHsl(selectedStop.color);
          if (hsl) {
            setColorInput(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);
          }
          break;
        }
      }
    }
  }, [selectedStop, colorMode]);

  const updateColorFromInput = useCallback(() => {
    if (!selectedStopId || !colorInput) return;

    let hexColor = '';

    if (colorMode === 'hex') {
      const match = colorInput.match(/^#?([0-9A-Fa-f]{6})$/);
      if (match) {
        hexColor = '#' + match[1];
      }
    } else if (colorMode === 'rgb') {
      const match = colorInput.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
      if (match) {
        const r = Math.min(255, Math.max(0, parseInt(match[1])));
        const g = Math.min(255, Math.max(0, parseInt(match[2])));
        const b = Math.min(255, Math.max(0, parseInt(match[3])));
        hexColor = rgbToHex(r, g, b);
      }
    } else if (colorMode === 'hsl') {
      const match = colorInput.match(/hsl\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/);
      if (match) {
        const h = Math.min(360, Math.max(0, parseInt(match[1])));
        const s = Math.min(100, Math.max(0, parseInt(match[2])));
        const l = Math.min(100, Math.max(0, parseInt(match[3])));
        hexColor = hslToHex(h, s, l);
      }
    }

    if (hexColor && /^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
      updateStop(selectedStopId, { color: hexColor }, false);
    }
  }, [selectedStopId, colorInput, colorMode, updateStop]);

  const handleStopMouseDown = useCallback(
    (e: React.MouseEvent, stopId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedStopId(stopId);
      setIsDragging(true);
      setDragStopId(stopId);
    },
    [setSelectedStopId]
  );

  const handleTrackMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragStopId || !trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const position = Math.max(0, Math.min(100, (x / rect.width) * 100));

      updateStop(dragStopId, { position: Math.round(position) }, false);
    },
    [isDragging, dragStopId, updateStop]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragStopId(null);
      useGradientStore.getState().saveToHistory();
    }
  }, [isDragging]);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging || !trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const position = Math.round((x / rect.width) * 100);

      const config = { stops, angle, steps: 50 };
      const colors = colorEngine.generateColors(config);
      const colorIndex = Math.round((position / 100) * (colors.length - 1));
      const color = colors[colorIndex] || '#888888';

      addStop(color, position);
    },
    [isDragging, stops, angle, addStop]
  );

  const handleColorChange = useCallback(
    (color: string) => {
      if (!selectedStopId) return;
      updateStop(selectedStopId, { color }, false);
    },
    [selectedStopId, updateStop]
  );

  const handleRemoveStop = useCallback(() => {
    if (!selectedStopId) return;
    removeStop(selectedStopId);
  }, [selectedStopId, removeStop]);

  const handleColorInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setColorInput(e.target.value);
    },
    []
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleTrackMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleTrackMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleTrackMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        const trackElement = trackRef.current;
        if (trackElement && !trackElement.contains(e.target as Node)) {
          setSelectedStopId(null);
        }
      }
    };

    if (selectedStopId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedStopId, setSelectedStopId]);

  return (
    <div className="color-picker">
      <div className="color-picker__track-container">
        <div className="color-picker__label">色标编辑器</div>
        <div
          ref={trackRef}
          className="color-picker__track"
          style={{ background: gradientBackground }}
          onClick={handleTrackClick}
        >
          {sortedStops.map((stop) => (
            <div
              key={stop.id}
              className={`color-picker__stop ${
                selectedStopId === stop.id ? 'color-picker__stop--active' : ''
              } ${dragStopId === stop.id ? 'color-picker__stop--dragging' : ''}`}
              style={{
                left: `${stop.position}%`,
                backgroundColor: stop.color,
                boxShadow:
                  selectedStopId === stop.id
                    ? `0 0 0 3px #2D2D2D, 0 2px 8px rgba(0,0,0,0.2)`
                    : '0 2px 6px rgba(0,0,0,0.15)'
              }}
              onMouseDown={(e) => handleStopMouseDown(e, stop.id)}
              title={`${stop.color} - ${stop.position}%`}
            />
          ))}
        </div>
        <div className="color-picker__hint">
          点击轨道添加色标 · 拖拽调整位置 · {stops.length}/8 个色标
        </div>
      </div>

      {selectedStop && (
        <div ref={pickerRef} className="color-picker__panel">
          <HexColorPicker color={selectedStop.color} onChange={handleColorChange} />

          <div className="color-picker__modes">
            {(['hex', 'rgb', 'hsl'] as ColorMode[]).map((mode) => (
              <button
                key={mode}
                className={`color-picker__mode-btn ${
                  colorMode === mode ? 'color-picker__mode-btn--active' : ''
                }`}
                onClick={() => setColorMode(mode)}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="color-picker__input-group">
            <input
              type="text"
              className="color-picker__input"
              value={colorInput}
              onChange={handleColorInputChange}
              onBlur={updateColorFromInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateColorFromInput();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              placeholder={`${colorMode.toUpperCase()} 颜色值`}
            />
            {stops.length > 2 && (
              <button
                className="color-picker__delete-btn"
                onClick={handleRemoveStop}
                title="删除色标"
              >
                删除
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
