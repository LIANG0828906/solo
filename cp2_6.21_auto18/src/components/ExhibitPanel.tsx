import { useEffect } from 'react';
import { Trash2, Move, RotateCcw } from 'lucide-react';
import { useSceneStore } from '../store/sceneStore';

interface ExhibitPanelProps {
  collapsed: boolean;
}

function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function ExhibitPanel({ collapsed }: ExhibitPanelProps) {
  const selectedId = useSceneStore((state) => state.selectedId);
  const exhibits = useSceneStore((state) => state.exhibits);
  const updateTransform = useSceneStore((state) => state.updateTransform);
  const removeExhibit = useSceneStore((state) => state.removeExhibit);
  const transformMode = useSceneStore((state) => state.transformMode);
  const setTransformMode = useSceneStore((state) => state.setTransformMode);

  const selectedExhibit = exhibits.find((e) => e.id === selectedId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId) return;
      if (e.key === 't' || e.key === 'T') {
        setTransformMode('translate');
      } else if (e.key === 'r' || e.key === 'R') {
        setTransformMode('rotate');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        removeExhibit(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, setTransformMode, removeExhibit]);

  if (!selectedExhibit || collapsed) {
    return null;
  }

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    if (!selectedId || !selectedExhibit) return;
    updateTransform(selectedId, {
      position: { ...selectedExhibit.transform.position, [axis]: value },
    });
  };

  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    if (!selectedId || !selectedExhibit) return;
    updateTransform(selectedId, {
      rotation: { ...selectedExhibit.transform.rotation, [axis]: degToRad(value) },
    });
  };

  const handleScaleChange = (value: number) => {
    if (!selectedId) return;
    updateTransform(selectedId, { scale: value });
  };

  return (
    <div className="exhibit-panel">
      <div className="panel-header">
        <h3 className="panel-title">{selectedExhibit.name}</h3>
        <button
          className="delete-button"
          onClick={() => selectedId && removeExhibit(selectedId)}
          title="删除展品"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="mode-toggle">
        <button
          className={`mode-button ${transformMode === 'translate' ? 'active' : ''}`}
          onClick={() => setTransformMode('translate')}
        >
          <Move size={16} />
          <span>平移 (T)</span>
        </button>
        <button
          className={`mode-button ${transformMode === 'rotate' ? 'active' : ''}`}
          onClick={() => setTransformMode('rotate')}
        >
          <RotateCcw size={16} />
          <span>旋转 (R)</span>
        </button>
      </div>

      <div className="property-section">
        <h4 className="section-title">位置</h4>
        <div className="slider-group">
          <div className="slider-row">
            <label className="slider-label x">X</label>
            <input
              type="range"
              min="-8"
              max="8"
              step="0.5"
              value={selectedExhibit.transform.position.x}
              onChange={(e) => handlePositionChange('x', parseFloat(e.target.value))}
              className="slider"
            />
            <span className="slider-value">{selectedExhibit.transform.position.x.toFixed(1)}</span>
          </div>
          <div className="slider-row">
            <label className="slider-label y">Y</label>
            <input
              type="range"
              min="0"
              max="6"
              step="0.5"
              value={selectedExhibit.transform.position.y}
              onChange={(e) => handlePositionChange('y', parseFloat(e.target.value))}
              className="slider"
            />
            <span className="slider-value">{selectedExhibit.transform.position.y.toFixed(1)}</span>
          </div>
          <div className="slider-row">
            <label className="slider-label z">Z</label>
            <input
              type="range"
              min="-8"
              max="8"
              step="0.5"
              value={selectedExhibit.transform.position.z}
              onChange={(e) => handlePositionChange('z', parseFloat(e.target.value))}
              className="slider"
            />
            <span className="slider-value">{selectedExhibit.transform.position.z.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="property-section">
        <h4 className="section-title">旋转</h4>
        <div className="slider-group">
          <div className="slider-row">
            <label className="slider-label x">X</label>
            <input
              type="range"
              min="0"
              max="360"
              step="5"
              value={radToDeg(selectedExhibit.transform.rotation.x) % 360}
              onChange={(e) => handleRotationChange('x', parseFloat(e.target.value))}
              className="slider"
            />
            <span className="slider-value">{Math.round(radToDeg(selectedExhibit.transform.rotation.x) % 360)}°</span>
          </div>
          <div className="slider-row">
            <label className="slider-label y">Y</label>
            <input
              type="range"
              min="0"
              max="360"
              step="5"
              value={radToDeg(selectedExhibit.transform.rotation.y) % 360}
              onChange={(e) => handleRotationChange('y', parseFloat(e.target.value))}
              className="slider"
            />
            <span className="slider-value">{Math.round(radToDeg(selectedExhibit.transform.rotation.y) % 360)}°</span>
          </div>
          <div className="slider-row">
            <label className="slider-label z">Z</label>
            <input
              type="range"
              min="0"
              max="360"
              step="5"
              value={radToDeg(selectedExhibit.transform.rotation.z) % 360}
              onChange={(e) => handleRotationChange('z', parseFloat(e.target.value))}
              className="slider"
            />
            <span className="slider-value">{Math.round(radToDeg(selectedExhibit.transform.rotation.z) % 360)}°</span>
          </div>
        </div>
      </div>

      <div className="property-section">
        <h4 className="section-title">缩放</h4>
        <div className="slider-group">
          <div className="slider-row">
            <label className="slider-label">S</label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={selectedExhibit.transform.scale}
              onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
              className="slider"
            />
            <span className="slider-value">{selectedExhibit.transform.scale.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="property-section">
        <h4 className="section-title">颜色</h4>
        <div className="color-display">
          <div
            className="color-preview"
            style={{ backgroundColor: selectedExhibit.color }}
          />
          <span className="color-hex">{selectedExhibit.color}</span>
        </div>
      </div>
    </div>
  );
}
