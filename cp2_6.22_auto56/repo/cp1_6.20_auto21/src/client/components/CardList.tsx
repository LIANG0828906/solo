import React from 'react';
import { Repair } from '../types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import './CardList.css';

interface CardListProps {
  repairs: Repair[];
  onAccept?: (id: string) => void;
  onViewDetail?: (id: string) => void;
  showAcceptButton?: boolean;
}

const priorityColors: Record<string, string> = {
  high: '#E74C3C',
  medium: '#F1C40F',
  low: '#27AE60'
};

const priorityLabels: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低'
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

export default function CardList({ repairs, onAccept, onViewDetail, showAcceptButton }: CardListProps) {
  if (repairs.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <p className="empty-text">暂无工单</p>
      </div>
    );
  }

  return (
    <div className="card-list">
      {repairs.map((repair) => (
        <div key={repair.id} className="repair-card" onClick={() => onViewDetail?.(repair.id)}>
          <div className="card-header">
            <span className="ticket-number">{repair.ticketNumber}</span>
            <span 
              className="priority-badge"
              style={{ backgroundColor: priorityColors[repair.priority] }}
            >
              {priorityLabels[repair.priority]}
            </span>
          </div>
          
          <h3 className="card-title">{repair.title}</h3>
          <p className="card-description">{repair.description}</p>
          
          {repair.images.length > 0 && (
            <div className="card-images">
              {repair.images.slice(0, 3).map((img, idx) => (
                <img key={idx} src={img} alt={`附件${idx + 1}`} />
              ))}
              {repair.images.length > 3 && (
                <span className="more-images">+{repair.images.length - 3}</span>
              )}
            </div>
          )}
          
          <div className="card-footer">
            <div className="card-info">
              <span 
                className="status-tag"
                style={{ 
                  backgroundColor: statusColors[repair.status] + '20',
                  color: statusColors[repair.status]
                }}
              >
                {statusLabels[repair.status]}
              </span>
              <span className="create-time">
                {format(new Date(repair.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
              </span>
            </div>
            
            {showAcceptButton && repair.status === 'pending' && (
              <button
                className="accept-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept?.(repair.id);
                }}
              >
                接单
              </button>
            )}
            
            {repair.repairer && (
              <span className="repairer">维修员: {repair.repairer}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
