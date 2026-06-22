import { useState, useEffect } from 'react';
import { animalApi } from '../api/animalApi';
import type { AnimalDetail, FeedingRecord, HealthStatus } from '../types';

interface AnimalDetailProps {
  animalId: string;
  onClose: () => void;
  onUpdate: () => void;
}

const healthColors: Record<HealthStatus, string> = {
  healthy: 'var(--health-healthy)',
  observation: 'var(--health-observation)',
  treatment: 'var(--health-treatment)'
};

const healthLabels: Record<HealthStatus, string> = {
  healthy: '健康',
  observation: '需观察',
  treatment: '需治疗'
};

const SHIFT_CYCLE: (HealthStatus | null)[] = ['healthy', 'observation', 'treatment', null];

export default function AnimalDetail({ animalId, onClose, onUpdate }: AnimalDetailProps) {
  const [data, setData] = useState<AnimalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFeeding, setEditingFeeding] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FeedingRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showHealthForm, setShowHealthForm] = useState(false);
  const [healthForm, setHealthForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: '常规体检',
    handler: '',
    notes: '',
    status: 'healthy' as HealthStatus
  });

  useEffect(() => {
    loadData();
  }, [animalId]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const detail = await animalApi.getAnimalDetail(animalId);
      setData(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(record: FeedingRecord) {
    setEditingFeeding(record.id);
    setEditForm({ ...record });
  }

  function cancelEdit() {
    setEditingFeeding(null);
    setEditForm(null);
  }

  async function saveEdit() {
    if (!editForm) return;
    try {
      await animalApi.updateFeedingRecord(animalId, editForm.id, {
        foodType: editForm.foodType,
        quantity: editForm.quantity,
        notes: editForm.notes
      });
      await loadData();
      cancelEdit();
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败');
    }
  }

  async function deleteFeeding(id: string) {
    setDeletingId(id);
    try {
      await animalApi.deleteFeedingRecord(animalId, id);
      setTimeout(async () => {
        await loadData();
        setDeletingId(null);
        onUpdate();
      }, 300);
    } catch (err) {
      setDeletingId(null);
      alert(err instanceof Error ? err.message : '删除失败');
    }
  }

  async function submitHealthCheck() {
    if (!healthForm.handler.trim()) {
      alert('请填写处理人');
      return;
    }
    try {
      const result = await animalApi.createHealthRecord(animalId, healthForm);
      alert(`📧 Email通知模拟发送:\n\n主题: ${result.notification.subject}\n\n内容: ${result.notification.body}`);
      setShowHealthForm(false);
      setHealthForm({
        date: new Date().toISOString().split('T')[0],
        type: '常规体检',
        handler: '',
        notes: '',
        status: 'healthy'
      });
      await loadData();
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : '提交失败');
    }
  }

  if (loading) {
    return (
      <div style={overlayStyle}>
        <div style={panelStyle} className="slide-in">
          <div style={{ padding: '24px' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton" style={{ height: '60px', marginBottom: '16px' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={overlayStyle}>
        <div style={panelStyle} className="slide-in">
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>😢</div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{error || '加载失败'}</p>
            <button onClick={onClose} style={closeBtnStyle}>关闭</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={{ ...panelStyle, maxHeight: '100vh', overflowY: 'auto' }}
        className="slide-in"
        onClick={e => e.stopPropagation()}
      >
        <div style={headerStyle}>
          <div style={{ width: '48px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>{data.name}的档案</h2>
          <button onClick={onClose} style={closeIconBtn}>✕</button>
        </div>

        <div style={{ position: 'relative', height: '280px', backgroundColor: '#f5f5f5' }}>
          <img
            src={data.photoUrl}
            alt={data.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=800&h=400&fit=crop';
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              right: '16px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: 'white',
              padding: '16px',
              borderRadius: 'var(--radius)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 700 }}>{data.name}</h3>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  fontSize: '14px'
                }}
              >
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: healthColors[data.healthStatus]
                  }}
                />
                {healthLabels[data.healthStatus]}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '24px', marginTop: '8px', fontSize: '14px', opacity: 0.9 }}>
              <span>🐾 {data.species}</span>
              <span>🎂 {data.age}岁</span>
              <span>⚥ {data.gender}</span>
              <span>📅 入园 {data.entryDate}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>
              💉 健康记录 <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 400 }}>({data.healthRecords.length}条)</span>
            </h3>
            <button
              onClick={() => setShowHealthForm(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                borderRadius: 'var(--radius)',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              + 新增检查
            </button>
          </div>

          {showHealthForm && (
            <div style={formCardStyle} className="fade-in">
              <h4 style={{ marginBottom: '16px', fontSize: '16px' }}>新增健康检查记录</h4>
              <div style={gridStyle}>
                <label>
                  <span style={labelStyle}>检查日期</span>
                  <input
                    type="date"
                    value={healthForm.date}
                    onChange={e => setHealthForm({ ...healthForm, date: e.target.value })}
                    style={inputStyle}
                  />
                </label>
                <label>
                  <span style={labelStyle}>检查类型</span>
                  <select
                    value={healthForm.type}
                    onChange={e => setHealthForm({ ...healthForm, type: e.target.value })}
                    style={inputStyle}
                  >
                    <option>常规体检</option>
                    <option>疫苗接种</option>
                    <option>跟进检查</option>
                    <option>治疗</option>
                    <option>其他</option>
                  </select>
                </label>
                <label>
                  <span style={labelStyle}>处理人</span>
                  <input
                    type="text"
                    value={healthForm.handler}
                    onChange={e => setHealthForm({ ...healthForm, handler: e.target.value })}
                    placeholder="请输入处理人姓名"
                    style={inputStyle}
                  />
                </label>
                <label>
                  <span style={labelStyle}>健康状态</span>
                  <select
                    value={healthForm.status}
                    onChange={e => setHealthForm({ ...healthForm, status: e.target.value as HealthStatus })}
                    style={inputStyle}
                  >
                    <option value="healthy">🟢 健康</option>
                    <option value="observation">🟡 需观察</option>
                    <option value="treatment">🔴 需治疗</option>
                  </select>
                </label>
              </div>
              <label style={{ display: 'block', marginTop: '12px' }}>
                <span style={labelStyle}>检查结果/建议处理措施</span>
                <textarea
                  value={healthForm.notes}
                  onChange={e => setHealthForm({ ...healthForm, notes: e.target.value })}
                  placeholder="请输入体检结果和建议处理措施..."
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                />
              </label>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button onClick={() => setShowHealthForm(false)} style={cancelBtnStyle}>取消</button>
                <button onClick={submitHealthCheck} style={submitBtnStyle}>提交并通知</button>
              </div>
            </div>
          )}

          {data.healthRecords.length === 0 ? (
            <div style={emptyStyle}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
              <p style={{ color: 'var(--text-secondary)' }}>暂无健康记录</p>
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: '24px' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '8px',
                  bottom: '8px',
                  width: '2px',
                  backgroundColor: 'var(--primary-light)'
                }}
              />
              {data.healthRecords.map((record, index) => (
                <div
                  key={record.id}
                  className="fade-in"
                  style={{
                    position: 'relative',
                    marginBottom: '20px',
                    animationDelay: `${index * 0.05}s`
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '-24px',
                      top: '6px',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: healthColors[record.status],
                      border: '3px solid white',
                      boxShadow: '0 0 0 2px var(--primary-light)'
                    }}
                  />
                  <div style={timelineCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '15px' }}>{record.type}</span>
                        <span style={{ margin: '0 8px', color: 'var(--text-secondary)' }}>·</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>📅 {record.date}</span>
                      </div>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          backgroundColor: healthColors[record.status] + '20',
                          color: healthColors[record.status],
                          fontWeight: 500
                        }}
                      >
                        {healthLabels[record.status]}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      👨‍⚕️ 处理人: <strong style={{ color: 'var(--text-primary)' }}>{record.handler}</strong>
                    </p>
                    {record.notes && (
                      <div
                        style={{
                          padding: '10px 12px',
                          backgroundColor: '#fafafa',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: 'var(--text-primary)'
                        }}
                      >
                        {record.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ fontSize: '18px', fontWeight: 600, marginTop: '32px', marginBottom: '16px' }}>
            🍖 投喂记录 <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 400 }}>({data.feedingRecords.length}条)</span>
          </h3>

          {data.feedingRecords.length === 0 ? (
            <div style={emptyStyle}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🍽️</div>
              <p style={{ color: 'var(--text-secondary)' }}>暂无投喂记录</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.feedingRecords.map((record) => (
                <div
                  key={record.id}
                  className={deletingId === record.id ? 'shrink-fade' : 'fade-in'}
                  style={feedingCardStyle}
                >
                  {editingFeeding === record.id ? (
                    <div>
                      <div style={gridStyle}>
                        <label>
                          <span style={labelStyle}>食物类型</span>
                          <input
                            type="text"
                            value={editForm?.foodType || ''}
                            onChange={e => editForm && setEditForm({ ...editForm, foodType: e.target.value })}
                            style={inputStyle}
                          />
                        </label>
                        <label>
                          <span style={labelStyle}>份量</span>
                          <input
                            type="text"
                            value={editForm?.quantity || ''}
                            onChange={e => editForm && setEditForm({ ...editForm, quantity: e.target.value })}
                            style={inputStyle}
                          />
                        </label>
                      </div>
                      <label style={{ display: 'block', marginTop: '12px' }}>
                        <span style={labelStyle}>备注</span>
                        <input
                          type="text"
                          value={editForm?.notes || ''}
                          onChange={e => editForm && setEditForm({ ...editForm, notes: e.target.value })}
                          style={inputStyle}
                        />
                      </label>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                        <button onClick={cancelEdit} style={cancelBtnStyle}>取消</button>
                        <button onClick={saveEdit} style={submitBtnStyle}>保存</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                              🕐 {record.date} {record.time}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ fontWeight: 600, fontSize: '16px' }}>🥣 {record.foodType}</span>
                            <span style={{ padding: '2px 10px', backgroundColor: '#FFF3E0', color: '#E65100', borderRadius: '10px', fontSize: '13px', fontWeight: 500 }}>
                              {record.quantity}
                            </span>
                          </div>
                          {record.notes && (
                            <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                              💬 {record.notes}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => startEdit(record)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: 'transparent',
                              color: 'var(--primary-color)',
                              border: '1px solid var(--primary-light)',
                              borderRadius: '6px',
                              fontSize: '13px'
                            }}
                          >
                            ✏️ 编辑
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('确定要删除这条投喂记录吗？')) {
                                deleteFeeding(record.id);
                              }
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: 'transparent',
                              color: '#F44336',
                              border: '1px solid #FFCDD2',
                              borderRadius: '6px',
                              fontSize: '13px'
                            }}
                          >
                            🗑️ 删除
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 1000,
  display: 'flex',
  justifyContent: 'flex-end'
};

const panelStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '640px',
  backgroundColor: 'white',
  boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)'
};

const headerStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 24px',
  backgroundColor: 'white',
  borderBottom: '1px solid var(--border-color)',
  zIndex: 10
};

const closeIconBtn: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: '#f5f5f5',
  fontSize: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-secondary)'
};

const closeBtnStyle: React.CSSProperties = {
  padding: '10px 24px',
  backgroundColor: 'var(--primary-color)',
  color: 'white',
  borderRadius: 'var(--radius)',
  fontSize: '14px',
  fontWeight: 500
};

const timelineCardStyle: React.CSSProperties = {
  padding: '14px 16px',
  backgroundColor: '#fafafa',
  borderRadius: 'var(--radius)',
  border: '1px solid #f0f0f0'
};

const feedingCardStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: 'white',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border-color)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
};

const emptyStyle: React.CSSProperties = {
  padding: '40px 20px',
  textAlign: 'center',
  backgroundColor: '#fafafa',
  borderRadius: 'var(--radius)'
};

const formCardStyle: React.CSSProperties = {
  padding: '20px',
  backgroundColor: '#f5fff5',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--primary-light)',
  marginBottom: '20px'
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '12px'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  color: 'var(--text-secondary)',
  marginBottom: '4px',
  fontWeight: 500
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontSize: '14px'
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#f5f5f5',
  color: 'var(--text-primary)',
  borderRadius: '6px',
  fontSize: '14px'
};

const submitBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: 'var(--primary-color)',
  color: 'white',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 500
};
