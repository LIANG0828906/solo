import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import type { Project, Invoice } from '@/types';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'status' | 'paidAmount' | 'createdAt'>) => void;
  project: Project | null;
  nextInvoiceNumber: string;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = React.memo(
  ({ isOpen, onClose, onSave, project, nextInvoiceNumber }) => {
    const [formData, setFormData] = useState({
      projectId: '',
      projectName: '',
      amount: 0,
      invoiceDate: '',
      dueDate: '',
    });

    useEffect(() => {
      if (project) {
        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(today.getDate() + 30);

        setFormData({
          projectId: project.id,
          projectName: project.name,
          amount: Math.round(project.budget * 0.3),
          invoiceDate: today.toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0],
        });
      }
    }, [project, isOpen]);

    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.amount <= 0 || !formData.invoiceDate || !formData.dueDate) {
          return;
        }
        onSave({
          ...formData,
          invoiceDate: new Date(formData.invoiceDate).toISOString(),
          dueDate: new Date(formData.dueDate).toISOString(),
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

    if (!isOpen || !project) return null;

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
              创建发票
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
                发票号 (自动生成)
              </label>
              <input
                type="text"
                value={nextInvoiceNumber}
                disabled
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#2A2A2A',
                  border: '1px solid #333333',
                  borderRadius: '6px',
                  color: '#9E9E9E',
                  fontSize: '14px',
                  cursor: 'not-allowed',
                  boxSizing: 'border-box',
                }}
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
                关联项目
              </label>
              <input
                type="text"
                value={`${project.name} (${project.customerName})`}
                disabled
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#2A2A2A',
                  border: '1px solid #333333',
                  borderRadius: '6px',
                  color: '#9E9E9E',
                  fontSize: '14px',
                  cursor: 'not-allowed',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px