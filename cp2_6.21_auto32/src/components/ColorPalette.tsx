import { useState, useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useStore, createId } from '../store/useStore';

export default function ColorPalette() {
  const colorSwatches = useStore((s) => s.colorSwatches);
  const updateColorSwatch = useStore((s) => s.updateColorSwatch);
  const setColorSwatches = useStore((s) => s.setColorSwatches);
  const pushHistory = useStore((s) => s.pushHistory);

  const [activePickerId, setActivePickerId] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (activePickerId && pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest('.color-swatch')) {
          setActivePickerId(null);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePickerId]);

  function handleSwatchClick(id: string) {
    setActivePickerId(activePickerId === id ? null : id);
  }

  function handleHexInput(id: string, rawValue: string) {
    let value = rawValue.toUpperCase().replace(/[^0-9A-F]/g, '');
    if (value.length > 6) value = value.substring(0, 6);
    if (value.length === 6) {
      pushHistory();
      updateColorSwatch(id, { hex: `#${value}` });
    }
  }

  function handlePickerChange(id: string, hex: string) {
    updateColorSwatch(id, { hex: hex.toUpperCase() });
  }

  function handlePickerChangeEnd() {
    pushHistory();
  }

  function handleNameChange(id: string, name: string) {
    updateColorSwatch(id, { name });
  }

  function handleResetDefaults() {
    pushHistory();
    const defaults = ['#E57373', '#64B5F6', '#81C784', '#FFD54F', '#BA68C8'];
    setColorSwatches(
      defaults.map((hex, i) => ({
        id: createId(),
        hex,
        name: `色${i + 1}`,
      }))
    );
  }

  const activeSwatch = colorSwatches.find((s) => s.id === activePickerId);

  return (
    <div className="color-palette">
      <div className="palette-header">
        <h3 className="palette-title">色彩调色板</h3>
        <button className="palette-reset-btn" onClick={handleResetDefaults} title="重置默认颜色">
          重置
        </button>
      </div>

      <div className="swatches-container">
        {colorSwatches.map((swatch) => (
          <div key={swatch.id} className="swatch-row">
            <div
              className="color-swatch"
              style={{ backgroundColor: swatch.hex }}
              onClick={() => handleSwatchClick(swatch.id)}
              title={`点击编辑 ${swatch.hex}`}
            />
            <div className="swatch-inputs">
              <input
                type="text"
                className="swatch-hex-input"
                value={swatch.hex.replace('#', '')}
                maxLength={6}
                placeholder="FFFFFF"
                onChange={(e) => handleHexInput(swatch.id, e.target.value)}
              />
              <input
                type="text"
                className="swatch-name-input"
                value={swatch.name}
                placeholder="色名"
                onChange={(e) => handleNameChange(swatch.id, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {activePickerId && activeSwatch && (
        <div className="picker-popup" ref={pickerRef} onMouseLeave={() => handlePickerChangeEnd()}>
          <HexColorPicker
            color={activeSwatch.hex}
            onChange={(hex) => handlePickerChange(activePickerId, hex)}
          />
          <div className="picker-current-hex">{activeSwatch.hex}</div>
        </div>
      )}
    </div>
  );
}
