import { useState } from 'react';
import type { Plant, CareLog } from '../types';
import { plantApi } from '../api';

interface PlantDetailProps {
  plant: Plant;
  onClose: () => void;
  onUpdated: () => void;
  onEdit: () => void;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  water: { label: '浇水', color: 'water' },
  fertilize: { label: '施肥', color: 'fertilize' },
  repot: { label: '换盆', color: 'repot' },
  note: { label: '备注', color: 'note' },
};

const statusLabels: Record<string, string> = {
  seedling: '幼苗期',
  growing: '生长期',
  flowering: '开花期',
  dormant: '休眠期',
};

export default function PlantDetail({
  plant,
  onClose,
  onUpdated,
  onEdit,
}: PlantDetailProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'logs' | 'photos'>('info');
  const [exporting, setExporting] = useState(false);

  const daysPlanted = Math.floor(
    (Date.now() - plant.plantDate) / (1000 * 60 * 60 * 24)
  );

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const formatNextDate = (ts: number) => {
    const days = Math.ceil((ts - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return `已逾期 ${Math.abs(days)} 天`;
    if (days === 0) return '今天';
    return `还有 ${days} 天`;
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await plantApi.exportReport(plant.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${plant.name}-生长日记.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('导出失败', err);
      alert('导出失败，请稍后重试');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`确定要删除"${plant.name}"吗？此操作不可撤销。`)) return;
    try {
      await plantApi.delete(plant.id);
      onUpdated();
      onClose();
    } catch (err) {
      console.error('删除失败', err);
      alert('删除失败');
    }
  };

  const sortedLogs = [...plant.careLogs].sort(
    (a, b) => b.timestamp - a.timestamp
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h2 className="modal-title" style={{ margin: 0 }}>
            {plant.name}
          </h2>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '6px 14px' }}
          >
            ×
          </button>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            基本信息
          </button>
          <button
            className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            养护记录
          </button>
          <button
            className={`tab ${activeTab === 'photos' ? 'active' : ''}`}
            onClick={() => setActiveTab('photos')}
          >
            照片时间线
          </button>
        </div>

        {activeTab === 'info' && (
          <div>
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-value">{daysPlanted}</div>
                <div className="stat-label">种植天数</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{statusLabels[plant.status]}</div>
                <div className="stat-label">当前状态</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '1rem' }}>
                  {plant.species}
                </div>
                <div className="stat-label">品种</div>
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', marginBottom: 12, color: 'var(--primary-green-dark)' }}>
              养护规则
            </h3>
            <div className="rules-grid">
              <div
                style={{
                  background: 'white',
                  padding: 12,
                  borderRadius: 10,
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  浇水频率
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  每 {plant.careRules.waterFrequency} 天
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary-green)', marginTop: 4 }}>
                  {formatNextDate(plant.nextWaterDate)}
                </div>
              </div>
              <div
                style={{
                  background: 'white',
                  padding: 12,
                  borderRadius: 10,
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  施肥周期
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  每 {plant.careRules.fertilizeFrequency} 天
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary-green)', marginTop: 4 }}>
                  {formatNextDate(plant.nextFertilizeDate)}
                </div>
              </div>
              <div
                style={{
                  background: 'white',
                  padding: 12,
                  borderRadius: 10,
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  光照需求
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  {plant.careRules.lightRequirement}
                </div>
              </div>
              <div
                style={{
                  background: 'white',
                  padding: 12,
                  borderRadius: 10,
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  适宜温度
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  {plant.careRules.temperatureMin}°C ~ {plant.careRules.temperatureMax}°C
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <button
                className="btn btn-secondary"
                onClick={onEdit}
                style={{ flex: 1 }}
              >
                ✏️ 编辑
              </button>
              <button
                className="btn btn-primary"
                onClick={handleExport}
                disabled={exporting}
                style={{ flex: 1 }}
              >
                {exporting ? '导出中...' : '📄 导出报告'}
              </button>
            </div>

            <button
              onClick={handleDelete}
              style={{
                marginTop: 12,
                width: '100%',
                padding: '10px',
                border: 'none',
                background: 'none',
                color: '#d06060',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              删除此植物
            </button>
          </div>
        )}

        {activeTab === 'logs' && (
          <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
            {sortedLogs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                暂无养护记录
              </div>
            ) : (
              sortedLogs.map((log: CareLog) => (
                <div key={log.id} className="care-log-item">
                  <span
                    className={`care-log-type ${typeLabels[log.type]?.color || 'note'}`}
                  >
                    {typeLabels[log.type]?.label || log.type}
                  </span>
                  <span>{log.completed ? '已完成' : '未完成'}</span>
                  {log.note && (
                    <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
                      {log.note}
                    </div>
                  )}
                  <div className="care-log-date">{formatDate(log.timestamp)}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'photos' && (
          <div>
            {plant.photo ? (
              <div className="detail-photos">
                <img
                  src={plant.photo.url}
                  alt={plant.name}
                  className="detail-photo"
                />
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🖼️</div>
                暂无照片
              </div>
            )}
            {plant.photo && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
                拍摄于 {formatDate(plant.photo.timestamp)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
