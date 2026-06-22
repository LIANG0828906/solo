import React from 'react';
import { useApp } from '../context/AppContext';
import type { Template } from '../types';
import './TemplateSelector.css';

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onClick: () => void;
}

function TemplateThumbnail({ template }: { template: Template }) {
  const scale = Math.min(280 / template.canvasWidth, 200 / template.canvasHeight);
  const scaledWidth = template.canvasWidth * scale;
  const scaledHeight = template.canvasHeight * scale;

  return (
    <div
      className="template-thumbnail"
      style={{
        width: scaledWidth,
        height: scaledHeight,
      }}
    >
      {template.elements.map((el) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          left: `${el.x * scale}px`,
          top: `${el.y * scale}px`,
          width: `${el.width * scale}px`,
          height: `${el.height * scale}px`,
          boxSizing: 'border-box',
          overflow: 'hidden',
        };

        switch (el.type) {
          case 'image':
            return (
              <div
                key={el.id}
                style={{
                  ...style,
                  backgroundColor: el.backgroundColor || '#e0e0e0',
                  borderRadius: `${(el as any).borderRadius || 0 * scale}px`,
                  backgroundImage: `radial-gradient(circle, #ccc 1px, transparent 1px)`,
                  backgroundSize: '6px 6px',
                }}
              />
            );
          case 'text':
            return (
              <div
                key={el.id}
                style={{
                  ...style,
                  fontSize: `${(el as any).fontSize * scale * 0.6}px`,
                  color: (el as any).color,
                  fontWeight: (el as any).fontWeight,
                  textAlign: (el as any).textAlign,
                  border: '1px dashed #ccc',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: (el as any).textAlign === 'center' ? 'center' : 'flex-start',
                  padding: '2px',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                {(el as any).content}
              </div>
            );
          case 'button':
            return (
              <div
                key={el.id}
                style={{
                  ...style,
                  backgroundColor: (el as any).backgroundColor,
                  color: (el as any).textColor,
                  fontSize: `${(el as any).fontSize * scale}px`,
                  borderRadius: `${(el as any).borderRadius * scale}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 500,
                }}
              >
                {(el as any).text}
              </div>
            );
          case 'divider':
            return (
              <div
                key={el.id}
                style={{
                  ...style,
                  borderTop: `${Math.max(1, (el as any).thickness * scale)}px ${(el as any).style} ${(el as any).color}`,
                  height: 'auto',
                  top: `${(el.y + el.height / 2) * scale}px`,
                }}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

function TemplateCard({ template, isSelected, onClick }: TemplateCardProps) {
  return (
    <div
      className={`template-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="template-preview">
        <TemplateThumbnail template={template} />
      </div>
      <div className="template-info">
        <h3 className="template-name">{template.name}</h3>
        <p className="template-desc">{template.description}</p>
      </div>
    </div>
  );
}

export default function TemplateSelector() {
  const { templates, selectTemplate, selectedTemplate } = useApp();

  return (
    <div className="template-selector">
      <div className="selector-header">
        <h1>选择模板</h1>
        <p>选择一个模板开始创建你的作品集</p>
      </div>
      <div className="template-grid">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplate?.id === template.id}
            onClick={() => selectTemplate(template)}
          />
        ))}
      </div>
    </div>
  );
}
