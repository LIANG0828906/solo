import React from 'react';
import type { DiffResult } from '@/types/schema';

interface DiffDetailModalProps {
  diff: DiffResult | null;
  onClose: () => void;
}

const diffTypeLabels: Record<string, string> = {
  add: '新增',
  remove: '删除',
  modify: '修改',
};

const diffTypeColors: Record<string, string> = {
  add: '#10b981',
  remove: '#ef4444',
  modify: '#f59e0b',
};

function formatValue(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export const DiffDetailModal: React.FC<DiffDetailModalProps> = ({ diff, onClose }) => {
  if (!diff) return null;

  const typeColor = diffTypeColors[diff.type] || '#6b7280';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span
            className="modal-type-badge"
            style={{
              backgroundColor: typeColor + '20',
              color: typeColor,
              borderColor: typeColor + '40',
            }}
          >
            {diffTypeLabels[diff.type]}
          </span>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <label className="modal-label">字段路径</label>
            <div className="modal-path">
              {diff.path.length > 0 ? diff.path.join(' → ') : '(根节点)'}
            </div>
          </div>

          {(diff.type === 'remove' || diff.type === 'modify') && (
            <div className="modal-section">
              <label className="modal-label" style={{ color: '#ef4444' }}>
                旧值
              </label>
              <pre className="modal-value old-value">{formatValue(diff.oldValue)}</pre>
            </div>
          )}

          {(diff.type === 'add' || diff.type === 'modify') && (
            <div className="modal-section">
              <label className="modal-label" style={{ color: '#10b981' }}>
                新值
              </label>
              <pre className="modal-value new-value">{formatValue(diff.newValue)}</pre>
            </div>
          )}
        </div>

        <style>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(4px);
          }

          .modal-content {
            background: #2a2a40;
            border-radius: 12px;
            width: 90%;
            max-width: 500px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            border: 1px solid #3a3a55;
          }

          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid #3a3a55;
          }

          .modal-type-badge {
            font-size: 13px;
            padding: 4px 12px;
            border-radius: 6px;
            border: 1px solid;
            font-weight: 600;
          }

          .modal-close {
            background: none;
            border: none;
            color: #94a3b8;
            font-size: 18px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.2s ease;
          }

          .modal-close:hover {
            color: #e2e8f0;
            background: #3a3a55;
          }

          .modal-body {
            padding: 20px;
            overflow-y: auto;
          }

          .modal-section {
            margin-bottom: 16px;
          }

          .modal-section:last-child {
            margin-bottom: 0;
          }

          .modal-label {
            display: block;
            font-size: 12px;
            color: #94a3b8;
            margin-bottom: 6px;
            font-weight: 500;
          }

          .modal-path {
            font-size: 14px;
            color: #e2e8f0;
            font-family: 'Consolas', 'Monaco', monospace;
            padding: 10px 12px;
            background: #1e1e2e;
            border-radius: 6px;
            border: 1px solid #3a3a55;
          }

          .modal-value {
            font-size: 12px;
            color: #e2e8f0;
            font-family: 'Consolas', 'Monaco', monospace;
            padding: 12px;
            background: #1e1e2e;
            border-radius: 6px;
            border: 1px solid #3a3a55;
            margin: 0;
            max-height: 200px;
            overflow: auto;
            white-space: pre-wrap;
            word-break: break-all;
          }

          .old-value {
            border-left: 3px solid #ef4444;
          }

          .new-value {
            border-left: 3px solid #10b981;
          }
        `}</style>
      </div>
    </div>
  );
};

export default DiffDetailModal;
