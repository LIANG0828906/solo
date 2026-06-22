import type { SceneData } from '../types';
import './ThumbnailGrid.css';

interface ThumbnailGridProps {
  scenes: SceneData[];
  onSceneClick: (scene: SceneData) => void;
}

export function ThumbnailGrid({ scenes, onSceneClick }: ThumbnailGridProps) {
  return (
    <div className="thumbnail-grid">
      {scenes.map((scene) => (
        <div
          key={scene.id}
          className="thumbnail-card"
          style={{ backgroundColor: scene.primaryColor }}
          onClick={() => onSceneClick(scene)}
        >
          <div className="thumbnail-content">
            <h2 className="thumbnail-title">{scene.name}</h2>
            <p className="thumbnail-description">{scene.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
