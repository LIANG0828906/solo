import { useRef } from 'react';
import { useStore } from '@/shared/store';

export default function SwatchPalette() {
  const { palette, activeColor, setActiveColor, addSwatch, removeSwatch, updateSwatchColor } = useStore();
  const colorPickerRef = useRef<HTMLInputElement>(null);
  const editingIndexRef = useRef<number | null>(null);

  const handleAdd = () => addSwatch('#FFFFFF');
  const handleRemove = () => {
    if (palette.length > 8) removeSwatch(palette.length - 1);
  };

  const openColorPicker = (index: number) => {
    editingIndexRef.current = index;
    if (colorPickerRef.current) {
      colorPickerRef.current.value = palette[index];
      colorPickerRef.current.click();
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingIndexRef.current !== null) {
      updateSwatchColor(editingIndexRef.current, e.target.value);
    }
    editingIndexRef.current = null;
  };

  const handleSwatchClick = (index: number, e: React.MouseEvent) => {
    if (e.shiftKey || e.type === 'contextmenu') {
      e.preventDefault();
      openColorPicker(index);
    } else {
      setActiveColor(palette[index]);
    }
  };

  const handleSwatchContextMenu = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    openColorPicker(index);
  };

  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, background: '#1e1e2e', borderTop: '1px solid rgba(255,255,255,0.1)', padding: 12, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>调色板</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={handleAdd} style={{ width: 24, height: 24, borderRadius: 4, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}>+</button>
          <button onClick={handleRemove} disabled={palette.length <= 8} style={{ width: 24, height: 24, borderRadius: 4, background: palette.length <= 8 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', border: 'none', color: palette.length <= 8 ? 'rgba(255,255,255,0.3)' : '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: palette.length <= 8 ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }} onMouseEnter={(e) => { if (palette.length > 8) e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }} onMouseLeave={(e) => { if (palette.length > 8) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}>−</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, padding: '4px 2px', marginTop: 8 }}>
        {palette.map((swatch, index) => (
          <div
            key={index}
            onClick={(e) => handleSwatchClick(index, e)}
            onContextMenu={(e) => handleSwatchContextMenu(index, e)}
            style={{
              width: 28, height: 28, borderRadius: 6, cursor: 'pointer', position: 'relative', transition: 'all 0.2s ease-out',
              background: swatch,
              border: activeColor === swatch ? '2px solid #fff' : '2px solid transparent',
              boxShadow: activeColor === swatch ? '0 0 6px rgba(255,255,255,0.8)' : 'none',
              transform: activeColor === swatch ? 'scale(1.08)' : 'scale(1)',
            }}
            onMouseEnter={(e) => { if (activeColor !== swatch) e.currentTarget.style.transform = 'scale(1.08)'; }}
            onMouseLeave={(e) => { if (activeColor !== swatch) e.currentTarget.style.transform = 'scale(1)'; }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <div style={{ flex: 1, height: 24, borderRadius: 4, background: activeColor }} />
        <span style={{ fontSize: 10, color: '#fff', minWidth: 50, textAlign: 'right', fontFamily: 'monospace' }}>{activeColor.toUpperCase()}</span>
      </div>
      <input ref={colorPickerRef} type="color" onChange={handleColorPickerChange} style={{ display: 'none' }} />
    </div>
  );
}
