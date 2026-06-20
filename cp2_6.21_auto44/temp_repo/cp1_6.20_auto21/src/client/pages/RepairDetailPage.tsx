import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { Repair } from '../types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Timeline from '../components/Timeline';
import './RepairDetailPage.css';

const priorityColors: Record<string, string> = {
  high: '#E74C3C',
  medium: '#F1C40F',
  low: '#27AE60'
};

const priorityLabels: Record<string, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级'
};

const statusLabels: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  failed: '无法修复'
};

const statusColors: Record<string, string> = {
  pending: '#95A5A6',
  processing: '#3498DB',
  completed: '#27AE60',
  failed: '#E74C3C'
};

export default function RepairDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [repair, setRepair] = useState<Repair | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const { role, repairerName, addNotification, setRepairs } = useApp();

  const loadRepair = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await api.getRepair(id);
      setRepair(data);
      setStatus(data.status);
    } catch (error) {
      addNotification('error', '加载工单详情失败');
    } finally {
      setIsLoading(false);
    }
  }, [id, addNotification]);

  useEffect(() => {
    loadRepair();
  }, [loadRepair]);

  const handleStatusUpdate = async () => {
    if (!id || !repair) return;
    
    if (role === 'repairer' && !repairerName) {
      addNotification('error', '请先在工单列表页接单以设置姓名');
      return;
    }

    if (status === repair.status && !note.trim()) {
      addNotification('info', '请修改状态或添加备注');
      return;
    }

    setIsUpdating(true);
    try {
      const updated = await api.updateStatus(id, status, note.trim(), repairerName || '系统');
      setRepair(updated);
      setRepairs(prev => prev.map(r => r.id === id ? updated : r));
      setNote('');
      addNotification('success', '状态更新成功！');
    } catch (error) {
      addNotification('error', error instanceof Error ? error.message : '更新失败');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="detail-page">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!repair) {
    return (
      <div className="detail-page">
        <div className="error-state">
          <p>工单不存在</p>
          <button className="back-btn" onClick={() => navigate('/repairs')}>返回列表</button>
        </div>
      </div>
    );
  }

  const canUpdate = role === 'repairer' && (repair.status === 'processing' || repair.repairer === repairerName);

  return (
    <div className="detail-page">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/repairs')}>
          ← 返回列表
        </button>
        <h1 className="detail-title">工单详情</h1>
      </div>

      <div className="detail-content">
        <div className="detail-main">
          <div className="info-card">
            <div className="info-header">
              <div className="ticket-info">
                <span className="ticket-number">{repair.ticketNumber}</span>
                <span 
                  className="status-badge"
                  style={{ 
                    backgroundColor: statusColors[repair.status] + '20',
                    color: statusColors[repair.status]
                  }}
                >
                  {statusLabels[repair.status]}
                </span>
                <span 
                  className="priority-badge"
                  style={{ backgroundColor: priorityColors[repair.priority] }}
                >
                  {priorityLabels[repair.priority]}
                </span>
              </div>
              <span className="create-time">
                创建时间: {format(new Date(repair.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
              </span>
            </div>

            <h2 className="repair-title">{repair.title}</h2>
            <p className="repair-description">{repair.description}</p>

            {repair.images.length > 0 && (
              <div className="images-section">
                <h4 className="section-title">图片附件</h4>
                <div className="image-gallery">
                  {repair.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`附件 ${idx + 1}`}
                      className="gallery-image"
                      onClick={() => setPreviewImage(img)}
                    />
                  ))}
                </div>
              </div>
            )}

            {repair.repairer && (
              <div className="repairer-info">
                <span className="label">维修员:</span>
                <span className="value">{repair.repairer}</span>
              </div>
            )}
          </div>

          {canUpdate && (
            <div className="update-card">
              <h3 className="card-title">更新进度</h3>
              <div className="form-group">
                <label className="form-label">状态</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="processing">处理中</option>
                  <option value="completed">已完成</option>
                  <option value="failed">无法修复</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">进度备注</label>
                <textarea
                  className="form-textarea"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="请描述当前进度或解决方案..."
                  rows={4}
                />
              </div>
              <button
                className="update-btn"
                onClick={handleStatusUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? '更新中...' : '更新状态'}
              </button>
            </div>
          )}

          <div className="timeline-card">
            <h3 className="card-title">处理进度</h3>
            <Timeline history={repair.statusHistory} />
          </div>
        </div>
      </div>

      {previewImage && (
        <div className="image-preview-modal" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="预览" onClick={(e) => e.stopPropagation()} />
          <button className="close-preview" onClick={() => setPreviewImage(null)}>×</button>
        </div>
      )}
    </div>
  );
}
