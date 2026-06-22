import React, { useState, useCallback } from 'react';
import { Edit2, Trash2, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { ProgressBar } from './common/ProgressBar';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  progressColor: string;
  budgetRate: number;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onAddInvoice: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = React.memo(
  ({ project, progressColor, budgetRate, onEdit, onDelete, onAddInvoice }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.4);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      `;

      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    };

    return (
      <div
        style={{
          backgroundColor: '#1E1E1E',
          borderRadius: '8px',
          padding: '20px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          position: 'relative',
          overflow: 'visible',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.5)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: '0 0 8px 0',
                fontSize: '16px',
                fontWeight: 600,
                color: '#E0E0E0',
              }}
            >
              {project.name}
            </h3>
            <p
              style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                color: '#9E9E9E',
              }}
            >
              客户: {project.customerName}
            </p>
          </div>
          {isExpanded ? (
            <ChevronUp size={20} style={{ color: '#9E9E9E' }} />
          ) : (
            <ChevronDown size={20} style={{ color: '#9E9E9E' }} />
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <div>
            <span style={{ fontSize: '12px', color: '#9E9E9E' }}>预算</span>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '18px',
                fontWeight: 600,
                color: '#E0E0E0',
              }}
            >
              {formatCurrency(project.budget)}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: '#9E9E9E' }}>已花费</span>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '18px',
                fontWeight: 600,
                color: progressColor,
              }}
            >
              {formatCurrency(project.spent)}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <span style={{ fontSize: '12px', color: '#9E9E9E' }}>预算执行率</span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: progressColor,
              }}
            >
              {budgetRate.toFixed(1)}%
            </span>
          </div>
          <ProgressBar value={project.spent} max={project.budget} color={progressColor} />
        </div>

        <div
          style={{
            fontSize: '12px',
            color: '#9E9E9E',
            marginTop: '8px',
          }}
        >
          开始日期: {new Date(project.startDate).toLocaleDateString('zh-CN')}
        </div>

        <div
          style={{
            maxHeight: isExpanded ? '200px' : '0',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease, opacity 0.3s ease',
            opacity: isExpanded ? 1 : 0,
            marginTop: isExpanded ? '16px' : '0',
            paddingTop: isExpanded ? '16px' : '0',
            borderTop: isExpanded ? '1px solid #2A2A2A' : 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={(e) => {
                handleRipple(e);
                onEdit(project);
              }}
              style={{
                position: 'relative',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px',
                backgroundColor: '#2A2A2A',
                color: '#E0E0E0',
                border: '1px solid #333333',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                minHeight: '44px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#333333';
                e.currentTarget.style.borderColor = '#2196F3';
                e.currentTarget.style.color = '#2196F3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2A2A2A';
                e.currentTarget.style.borderColor = '#333333';
                e.currentTarget.style.color = '#E0E0E0';
              }}
            >
              <Edit2 size={16} />
              编辑
            </button>
            <button
              onClick={(e) => {
                handleRipple(e);
                onAddInvoice(project);
              }}
              style={{
                position: 'relative',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px',
                backgroundColor: '#2196F3',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'background-color 0.2s ease',
                minHeight: '44px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1976D2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2196F3')}
            >
              <FileText size={16} />
              开发票
            </button>
            <button
              onClick={(e) => {
                handleRipple(e);
                onDelete(project.id);
              }}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 16px',
                backgroundColor: '#2A2A2A',
                color: '#F44336',
                border: '1px solid #333333',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                minHeight: '44px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F4433620';
                e.currentTarget.style.borderColor = '#F4433640';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2A2A2A';
                e.currentTarget.style.borderColor = '#333333';
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }
);

ProjectCard.displayName = 'ProjectCard';
