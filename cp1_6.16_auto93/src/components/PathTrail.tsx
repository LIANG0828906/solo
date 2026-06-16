import React from 'react';
import { useSceneStore } from '../store/sceneStore';

const PathTrail: React.FC = () => {
  const scenes = useSceneStore((s) => s.scenes);
  const path = useSceneStore((s) => s.path);
  const currentSceneIndex = useSceneStore((s) => s.currentSceneIndex);
  const jumpToScene = useSceneStore((s) => s.jumpToScene);

  return (
    <div className="path-trail">
      <div className="path-trail__inner">
        {scenes.map((scene, index) => {
          const entry = path[index];
          const isSelected = entry?.selectedChoice !== null && entry?.selectedChoice !== undefined;
          const isCurrent = index === currentSceneIndex;

          return (
            <React.Fragment key={scene.id}>
              {index > 0 && (
                <div
                  className={`path-trail__connector ${
                    path[index - 1]?.selectedChoice ? 'path-trail__connector--active' : ''
                  }`}
                />
              )}
              <button
                className={`path-trail__dot ${
                  isSelected ? 'path-trail__dot--selected' : ''
                } ${isCurrent ? 'path-trail__dot--current' : ''}`}
                onClick={() => jumpToScene(index)}
                title={scene.title}
              >
                <span className="path-trail__dot-inner">
                  {isSelected && entry?.selectedChoice ? entry.selectedChoice : index + 1}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default PathTrail;
