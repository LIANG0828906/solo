import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceNumber: string;
  reminderText: string;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  invoiceNumber,
  reminderText
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reminderText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '600px',
          maxWidth: '90vw',
          backgroundColor: '#fff',
          borderRadius: '16px',
          boxShadow: '2px 4px 12px rgba(0,0,0,0.15)',
          padding: '32px',
          animation: 'slideUp 0.3s ease',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: '#1F2937' }}>
            催款通知 - {invoiceNumber}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              color: '#6B7280',
              transition: 'background-color 0.2s ease, color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F3F4F6';
              e.currentTarget.style.color = '#1F2937';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6B7280';
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '16px', fontSize: '13px', color: '#6B7280' }}>
          以下是催款邮件预览，您可以复制后发送给客户：
        </div>

        <div
          style={{
            backgroundColor: '#F9FAFB',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #E5E7EB'
          }}
        >
          <pre
            style={{
              margin: 0,
              fontFamily: 'inherit',
              fontSize: '14px',
              lineHeight: 1.8,
              color: '#374151',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word'
            }}
          >
            {reminderText}
          </pre>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              backgroundColor: '#fff',
              color: '#374151',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
            }}
          >
            关闭
          </button>
          <button
            onClick={handleCopy}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: copied ? '#10B981' : '#1E3A5F',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!copied) {
                e.currentTarget.style.backgroundColor = '#162D4A';
              }
            }}
            onMouseLeave={(e) => {
              if (!copied) {
                e.currentTarget.style.backgroundColor = '#1E3A5F';
              }
            }}
          >
            {copied ? (
              <>
                <Check size={16} />
                已复制
              </>
            ) : (
              <>
                <Copy size={16} />
                复制文本
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
