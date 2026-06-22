import React, { useState } from 'react';
import type { MaterialMeta } from '../types';
import { deleteMetadata } from '../api';

interface DetailModalProps {
  item: MaterialMeta;
  onClose: () => void;
  onDeleted: () => void;
}

const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
};

const DetailModal: React.FC<DetailModalProps> = ({ item, onClose, onDeleted }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMetadata(item.id);
      onDeleted();
    } catch (err) {
      console.error('删除失败:', err);
    } finally {
      setDeleting(false);
    }
  };

  const fields = [
    { label: 'ID', value: item.id },
    { label: '标题', value: item.title },
    { label: '场景名', value: item.scene || '-' },
    { label: '演员', value: item.actor || '-' },
    { label: '灯光设置', value: item.lighting || '-' },
    { label: '时长', value: `${item.duration}秒` },
    { label: '创建时间', value: formatTime(item.createTime) }
  ];

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">素材详情</span>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            {item.thumbnailUrl && (
              <div className="detail-thumbnail">
                <img src={item.thumbnailUrl} alt={item.title} />
              </div>
            )}
            {fields.map(field => (
              <div className="detail-row" key={field.label}>
                <span className="detail-label">{field.label}</span>
                <span className="detail-value">{field.value}</span>
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button
              className="btn-danger"
              onClick={() => setShowConfirm(true)}
            >
              删除
            </button>
            <button className="btn-secondary" onClick={onClose}>关闭</button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-title">确认删除</div>
            <div className="confirm-message">
              确定要删除素材「{item.title}」吗？此操作不可撤销。
            </div>
            <div className="confirm-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
              >
                取消
              </button>
              <button
                className="btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DetailModal;
