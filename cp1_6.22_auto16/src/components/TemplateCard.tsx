import React from 'react';
import { Link } from 'react-router-dom';
import type { Template } from '../types';
import { dataService } from '../DataService';
import '../styles/TemplateCard.css';

interface TemplateCardProps {
  template: Template;
  onDelete?: (id: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onDelete }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete && confirm(`确定删除模板 "${template.name}" 吗？`)) {
      onDelete(template.id);
    }
  };

  return (
    <Link to={`/template/${template.id}/feedback`} className="template-card-link">
      <div className="template-card glass-card">
        <div className="template-card__header">
          <h3 className="template-card__title">{template.name}</h3>
          {onDelete && (
            <button
              className="template-card__delete"
              onClick={handleDelete}
              title="删除模板"
            >
              ×
            </button>
          )}
        </div>

        <div className="template-card__dimensions">
          <span className="dim-count">
            {template.dimensions.length} 个维度
          </span>
        </div>

        <div className="template-card__tags">
          {template.dimensions.slice(0, 3).map(dim => (
            <span key={dim.id} className="dim-tag">
              {dim.name}
            </span>
          ))}
          {template.dimensions.length > 3 && (
            <span className="dim-tag dim-tag--more">
              +{template.dimensions.length - 3}
            </span>
          )}
        </div>

        <div className="template-card__footer">
          <span className="template-date">
            {dataService.formatDate(template.createdAt)}
          </span>
          <span className="template-arrow">→</span>
        </div>
      </div>
    </Link>
  );
};

export default TemplateCard;
