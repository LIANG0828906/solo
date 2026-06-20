import { Move, RotateCw, Maximize2 } from 'lucide-react';
import { useSceneStore } from '../store/sceneStore';
import { TransformMode, EXHIBIT_TYPE_NAMES, ExhibitType } from '../types/scene';

const MODE_ICONS: Record<TransformMode, React.ReactNode> = {
  translate: <Move size={18} />,
  rotate: <RotateCw size={18} />,
  scale: <Maximize2 size={18} />,
};

const MODE_LABELS: Record<TransformMode, string> = {
  translate: '平移',
  rotate: '旋转',
  scale: '缩放',
};

export function TransformToolbar() {
  const selectedId = useSceneStore((state) => state.selectedId);
  const exhibits = useSceneStore((state) => state.exhibits);
  const transformMode = useSceneStore((state) => state.transformMode);
  const setTransformMode = useSceneStore((state) => state.setTransformMode);

  const selectedExhibit = exhibits.find((e) => e.id === selectedId);
  const modes: TransformMode[] = ['translate', 'rotate', 'scale'];

  if (!selectedExhibit) {
    return null;
  }

  const typeName = EXHIBIT_TYPE_NAMES[selectedExhibit.type as ExhibitType] || selectedExhibit.type;
  const shortId = selectedExhibit.id.substring(0, 6);

  return (
    <div className="transform-toolbar">
      <div className="exhibit-info">
        <div className="exhibit-type-badge">
          <span className="exhibit-type-name">{typeName}</span>
          <span className="exhibit-id">ID: {shortId}</span>
        </div>
      </div>

      <div className="mode-buttons">
        {modes.map((mode) => (
          <button
            key={mode}
            className={`mode-btn ${transformMode === mode ? 'active' : ''}`}
            onClick={() => setTransformMode(mode)}
            title={MODE_LABELS[mode]}
          >
            {MODE_ICONS[mode]}
            <span className="mode-text">{MODE_LABELS[mode]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
