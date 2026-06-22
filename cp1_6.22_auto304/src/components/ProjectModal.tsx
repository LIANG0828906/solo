import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import type { Project } from '@/types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Project, 'id' | 'spent' | 'createdAt'>) => void;
  editProject?: Project | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = React.memo(
  ({ isOpen, onClose, onSave, editProject }) => {
    const [formData, setFormData] = useState({
      name: '',
      customerName: '',
      customerId: '',
      budget: 0,
      startDate: '',
    });

    useEffect(() => {
      if (editProject) {
        setFormData({
          name: editProject.name,
          customerName: editProject.customerName,
          customerId: editProject.customerId,
          budget: editProject.budget,
          startDate: editProject.startDate.split('T')[0],
        });
      } else {
        setFormData({
          name: '',
          customerName: '',
          customerId: crypto.randomUUID(),
          budget: 0,
          startDate: new Date().toISOString().split('T')[0],
        });
      }
    }, [editProject, isOpen]);

    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.customerName.trim() || formData.budget <= 0) {
          return;
        }
        onSave({
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
        });
        onClose();
      },
      [formData, onSave, onClose]
    );

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

    if (!isOpen) return null;

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease',
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: '#1E1E1E',
            borderRadius: '8px',
            padding: '24px',
            width: '100%',
            maxWidth: '500px',
            animation: 'slideUp 0.3s ease',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 600,
                color: '#E0E0E0',
              }}
            >
              {editProject ? '编辑项目' : '新建项目'}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#9E9E9E',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: '#E0E0E0',
                }}
              >
                项目名称
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#2A2A2A',
                  border: '1px solid #333333',
                  borderRadius: '6px',
                  color: '#E0E0E0',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#2196F3')}
                onBlur={(e) => (e.target.style.borderColor = '#333333')}
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: '#E0E0E0',
                }}
              >
                客户名称
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#2A2A2A',
                  border: '1px solid #333333',
                  borderRadius: '6px',
                  color: '#E0E0E0',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#2196F3')}
                onBlur={(e) => (e.target.style.borderColor = '#333333')}
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: '#E0E0E0',
                }}
              >
                预算金额 (元)
              </label>
              <input
                type="number"
                value={formData.budget || ''}
                onChange={(e) =>
                  setFormData({ ...formData, budget: Number(e.target.value) })
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#2A2A2A',
                  border: '1px solid #333333',
                  borderRadius: '6px',
                  color: '#E0E0E0',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#2196F3')}
                onBlur={(e) => (e.target.style.borderColor = '#333333')}
                min="0"
                step="1000"
                required
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: '#E0E0E0',
                }}
              >
                开始日期
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#2A2A2A',
                  border: '1px solid #333333',
                  borderRadius: '6px',
                  color: '#E0E0E0',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#2196F3')}
                onBlur={(e) => (e.target.style.borderColor = '#333333')}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={(e) => {
                  handleRipple(e);
                  onClose();
                }}
                style={{
                  position: 'relative',
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#2A2A2A',
                  color: '#E0E0E0',
                  border: '1px solid #333333',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  minHeight: '44px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#333333';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2A2A2A';
                }}
              >
                取消
              </button>
              <button
                type="submit"
                onClick={handleRipple}
                style={{
                  position: 'relative',
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#2196F3',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'background-color 0.2s ease',
                  minHeight: '44px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1976D2')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2196F3')}
              >
                {editProject ? '保存修改' : '创建项目'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
);

ProjectModal.displayName = 'ProjectModal';
