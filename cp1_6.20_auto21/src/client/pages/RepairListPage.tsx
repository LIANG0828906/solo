import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import CardList from '../components/CardList';
import './RepairListPage.css';

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '无法修复' }
];

const sortOptions = [
  { value: 'date', label: '按时间排序' },
  { value: 'priority', label: '按优先级排序' }
];

export default function RepairListPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [isLoading, setIsLoading] = useState(true);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempRepairId, setTempRepairId] = useState<string | null>(null);
  const [inputName, setInputName] = useState('');
  
  const { repairs, setRepairs, role, repairerName, setRepairerName, addNotification } = useApp();
  const navigate = useNavigate();

  const loadRepairs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getRepairs(statusFilter !== 'all' ? statusFilter : undefined, sortBy);
      setRepairs(data);
    } catch (error) {
      addNotification('error', '加载工单列表失败');
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  }, [statusFilter, sortBy, setRepairs, addNotification]);

  useEffect(() => {
    loadRepairs();
  }, [loadRepairs]);

  const handleAccept = useCallback((id: string) => {
    if (role === 'repairer' && repairerName) {
      confirmAccept(id, repairerName);
    } else {
      setTempRepairId(id);
      setShowNameModal(true);
    }
  }, [role, repairerName]);

  const confirmAccept = async (id: string, name: string) => {
    try {
      const updated = await api.acceptRepair(id, name);
      setRepairs(prev => prev.map(r => r.id === id ? updated : r));
      setRepairerName(name);
      addNotification('success', '接单成功！');
      setShowNameModal(false);
      setTempRepairId(null);
      setInputName('');
    } catch (error) {
      addNotification('error', error instanceof Error ? error.message : '接单失败');
    }
  };

  const handleNameSubmit = () => {
    if (!inputName.trim()) {
      addNotification('error', '请输入您的姓名');
      return;
    }
    if (tempRepairId) {
      confirmAccept(tempRepairId, inputName.trim());
    }
  };

  const handleViewDetail = useCallback((id: string) => {
    navigate(`/repair/${id}`);
  }, [navigate]);

  const filteredRepairs = role === 'repairer' 
    ? repairs.filter(r => r.status === 'pending' || r.repairer === repairerName)
    : repairs;

  return (
    <div className="repair-list-page">
      <div className="page-header">
        <h1 className="page-title">工单列表</h1>
        <p className="page-subtitle">查看和管理所有报修工单</p>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">状态筛选:</label>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label className="filter-label">排序方式:</label>
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="refresh-btn" onClick={loadRepairs}>
          🔄 刷新
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>加载中...</p>
        </div>
      ) : (
        <CardList
          repairs={filteredRepairs}
          onAccept={handleAccept}
          onViewDetail={handleViewDetail}
          showAcceptButton={role === 'repairer' || true}
        />
      )}

      {showNameModal && (
        <div className="modal-overlay" onClick={() => setShowNameModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">请输入您的姓名</h3>
            <input
              type="text"
              className="modal-input"
              placeholder="维修员姓名"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowNameModal(false)}>
                取消
              </button>
              <button className="modal-btn confirm" onClick={handleNameSubmit}>
                确认接单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
