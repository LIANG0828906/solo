import { useState, useEffect } from 'react';
import {
  Plant,
  CareRecord,
  CARE_TYPE_LABELS,
  CARE_TYPE_COLORS,
} from '../types';

interface Props {
  plants: Plant[];
}

export default function CareRecords({ plants }: Props) {
  const [records, setRecords] = useState<CareRecord[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    plant_id: '',
    type: 'water' as CareRecord['type'],
    notes: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, [selectedPlantId]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const url = selectedPlantId
        ? `/api/plants/${selectedPlantId}/care-records`
        : '/api/care-records';
      const res = await fetch(url);
      const data = await res.json();
      setRecords(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.plant_id) return;
    try {
      const res = await fetch(`/api/plants/${newRecord.plant_id}/care-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      });
      if (res.ok) {
        setShowModal(false);
        setNewRecord({ plant_id: '', type: 'water', notes: '' });
        fetchRecords();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getNextCareInfo = (plant: Plant) => {
    const now = new Date();
    const info: string[] = [];

    if (plant.last_watered) {
      const next = new Date(plant.last_watered);
      next.setDate(next.getDate() + plant.water_cycle_days);
      const days = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (days <= 0) info.push(`浇水已逾期${-days}天`);
      else info.push(`距下次浇水还有${days}天`);
    } else {
      info.push('尚未浇水');
    }

    if (plant.last_fertilized) {
      const next = new Date(plant.last_fertilized);
      next.setMonth(next.getMonth() + 1);
      const days = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (days <= 0) info.push(`施肥已逾期${-days}天`);
      else info.push(`距下次施肥还有${days}天`);
    } else {
      info.push('尚未施肥');
    }

    return info;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">💧 养护记录</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 记录养护
        </button>
      </div>

      <div className="care-overview">
        <h3 className="subsection-title">植物养护状态</h3>
        <div className="care-status-grid">
          {plants.map(plant => {
            const careInfo = getNextCareInfo(plant);
            const needsAttention = careInfo.some(i => i.includes('逾期') || i.includes('还有0天') || i.includes('还有1天') || i.includes('还有2天'));
            return (
              <div key={plant.id} className={`care-status-card card ${needsAttention ? 'warning' : ''}`}>
                <div className="care-status-header">
                  <h4>{plant.name}</h4>
                  {needsAttention && <span className="badge badge-yellow">需关注</span>}
                </div>
                <div className="care-status-info">
                  {careInfo.map((info, idx) => (
                    <div key={idx} className={`care-info-item ${info.includes('逾期') ? 'overdue' : ''}`}>
                      {info.includes('浇水') ? '💧' : '🌿'} {info}
                    </div>
                  ))}
                </div>
                <div className="care-status-cycle">
                  <small>浇水周期: {plant.water_cycle_days}天 | 施肥周期: 30天</small>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="page-header" style={{ marginTop: 32 }}>
        <h3 className="subsection-title">养护时间线</h3>
        <select
          className="form-select filter-select"
          value={selectedPlantId}
          onChange={e => setSelectedPlantId(e.target.value)}
        >
          <option value="">全部植物</option>
          {plants.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <p>暂无养护记录</p>
        </div>
      ) : (
        <div className="timeline">
          {records.map(record => (
            <div key={record.id} className="timeline-item">
              <div
                className="timeline-dot"
                style={{ backgroundColor: CARE_TYPE_COLORS[record.type] }}
              ></div>
              <div className="timeline-line"></div>
              <div className="timeline-content card">
                <div className="timeline-header">
                  <span
                    className="care-type-tag"
                    style={{ backgroundColor: CARE_TYPE_COLORS[record.type] + '20', color: CARE_TYPE_COLORS[record.type] }}
                  >
                    {CARE_TYPE_LABELS[record.type]}
                  </span>
                  <span className="timeline-time">
                    {new Date(record.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="timeline-body">
                  <div className="timeline-plant">{record.plant_name || '植物'}</div>
                  {record.notes && <p className="timeline-notes">{record.notes}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>记录养护操作</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateRecord}>
              <div className="form-group">
                <label className="form-label">选择植物 *</label>
                <select
                  className="form-select"
                  value={newRecord.plant_id}
                  onChange={e => setNewRecord({ ...newRecord, plant_id: e.target.value })}
                  required
                >
                  <option value="">请选择植物</option>
                  {plants.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">养护类型 *</label>
                <div className="care-type-selector">
                  {(['water', 'fertilize', 'prune', 'repot'] as const).map(type => (
                    <button
                      type="button"
                      key={type}
                      className={`care-type-btn ${newRecord.type === type ? 'active' : ''}`}
                      style={{
                        borderColor: newRecord.type === type ? CARE_TYPE_COLORS[type] : 'var(--border)',
                        color: newRecord.type === type ? CARE_TYPE_COLORS[type] : 'var(--text)',
                      }}
                      onClick={() => setNewRecord({ ...newRecord, type })}
                    >
                      {type === 'water' && '💧 '}
                      {type === 'fertilize' && '🌿 '}
                      {type === 'prune' && '✂️ '}
                      {type === 'repot' && '🪴 '}
                      {CARE_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">备注</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={newRecord.notes}
                  onChange={e => setNewRecord({ ...newRecord, notes: e.target.value })}
                  placeholder="记录养护细节..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">保存记录</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
