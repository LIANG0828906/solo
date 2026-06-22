import React, { useState } from 'react';
import {
  faceComponents,
  componentCategories,
  renderComponentSVG
} from '../utils/componentRenderer';
import './ComponentPanel.css';

interface ComponentPanelProps {
  onSelectComponent: (type: string, componentId: string, baseColor: string) => void;
}

const ComponentPanel: React.FC<ComponentPanelProps> = ({ onSelectComponent }) => {
  const [expandedType, setExpandedType] = useState<string>('eyes');

  const toggleCategory = (type: string) => {
    setExpandedType((prev) => (prev === type ? '' : type));
  };

  return (
    <div className="component-panel">
      <h3 className="component-panel-title">组件库</h3>
      {componentCategories.map((cat) => {
        const components = faceComponents.filter((c) => c.type === cat.type);
        const isExpanded = expandedType === cat.type;

        return (
          <div key={cat.type} className="component-category">
            <button
              className="component-category-header"
              onClick={() => toggleCategory(cat.type)}
            >
              <span>{cat.label}</span>
              <span className={`category-arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
            </button>
            {isExpanded && (
              <div className="component-options">
                {components.map((comp) => {
                  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
                    renderComponentSVG(comp)
                  )}`;
                  return (
                    <button
                      key={comp.id}
                      className="component-option"
                      onClick={() => onSelectComponent(comp.type, comp.id, comp.baseColor)}
                      style={{ color: comp.baseColor }}
                      dangerouslySetInnerHTML={{ __html: renderComponentSVG(comp).replace('viewBox="0 0 100 100"', 'viewBox="0 0 100 100" width="40" height="40"') }}
                      title={comp.name}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ComponentPanel;
