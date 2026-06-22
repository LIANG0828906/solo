import { ModelData } from '../types';
import './ModelList.css';

interface ModelListProps {
  models: ModelData[];
  currentModelId: string;
  onSelectModel: (modelId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
}

export function ModelList({
  models,
  currentModelId,
  onSelectModel,
  isCollapsed,
  onToggleCollapse,
}: ModelListProps) {
  if (isCollapsed) {
    return (
      <div className="model-list-dropdown">
        <button className="dropdown-toggle" onClick={onToggleCollapse}>
          <span className="dropdown-icon">☰</span>
          <span>模型列表</span>
        </button>
      </div>
    );
  }

  return (
    <div className="model-list-container">
      <div className="model-list-header">
        <h3 className="model-list-title">模型库</h3>
        <span className="model-count">{models.length} 个模型</span>
      </div>
      
      <div className="model-grid">
        {models.map((model) => (
          <div
            key={model.id}
            className={`model-card ${currentModelId === model.id ? 'active' : ''}`}
            onClick={() => onSelectModel(model.id)}
          >
            <div className="model-thumbnail">
              <img src={model.thumbnail} alt={model.name} />
            </div>
            <div className="model-name">{model.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
