import { useState, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { usePlantStore } from '../store/plantStore';
import type { DiaryEntry } from '../types';
import './DiaryPage.css';

const typeLabels: Record<string, string> = {
  watering: '💧 浇水',
  fertilizing: '🌱 施肥',
  pruning: '✂️ 修剪',
  repotting: '🪴 换盆'
};

function DiaryPage() {
  const plants = usePlantStore(s => s.plants);
  const diaryEntries = usePlantStore(s => s.diaryEntries);
  const addDiaryEntry = usePlantStore(s => s.addDiaryEntry);
  const currentUserId = usePlantStore(s => s.currentUserId);

  const myPlants = plants.filter(p => p.userId === currentUserId);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(
    myPlants[0]?.id || null
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [entryType, setEntryType] = useState<DiaryEntry['type']>('watering');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedPlantId && myPlants.length > 0) {
      setSelectedPlantId(myPlants[0].id);
    }
  }, [myPlants, selectedPlantId]);

  const selectedPlantEntries = useMemo(() => {
    if (!selectedPlantId) return [];
    return diaryEntries
      .filter(d => d.plantId === selectedPlantId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [diaryEntries, selectedPlantId]);

  const chartData = selectedPlantEntries.map(e => ({
    date: e.date.slice(5),
    成长值: e.growthValue,
    fullDate: e.date
  }));

  const selectedPlant = myPlants.find(p => p.id === selectedPlantId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlantId) return;
    if (note.length > 100) {
      alert('备注不能超过100字');
      return;
    }
    setSubmitting(true);
    try {
      await addDiaryEntry(selectedPlantId, entryType, note);
      setShowAddForm(false);
      setEntryType('watering');
      setNote('');
    } catch (err) {
      alert('添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="diary-page page-container">
      <div className="page-header">
        <h1>花园日记</h1>
        <button className="add-btn" onClick={() => setShowAddForm(true)} disabled={myPlants.length === 0}>
          + 记录养护
        </button>
      </div>

      {myPlants.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">📝</p>
          <p>先添加植物，才能开始记录养护日记哦~</p>
        </div>
      ) : (
        <>
          <div className="plant-selector">
            {myPlants.map(plant => (
              <button
                key={plant.id}
                className={`plant-tab ${selectedPlantId === plant.id ? 'active' : ''}`}
                onClick={() => setSelectedPlantId(plant.id)}
              >
                {plant.image ? (
                  <img src={plant.image} alt={plant.name} />
                ) : (
                  <span className="plant-tab-icon">🌿</span>
                )}
                <span>{plant.name}</span>
              </button>
            ))}
          </div>

          {selectedPlant && (
            <>
              <div className="chart-section">
                <h3 className="section-title">
                  {selectedPlant.name} 的成长曲线
                </h3>
                {chartData.length === 0 ? (
                  <div className="empty-chart">
                    <p>暂无成长记录，先添加一条养护日记吧~</p>
                  </div>
                ) : (
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EDE5D8" />
                        <XAxis dataKey="date" stroke="#7F8C8D" fontSize={12} />
                        <YAxis domain={[0, 100]} stroke="#7F8C8D" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #EDE5D8',
                            borderRadius: '8px'
                          }}
                          labelFormatter={(label) => `日期: ${chartData.find(d => d.date === label)?.fullDate || label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="成长值"
                          stroke="#6ABF69"
                          strokeWidth={3}
                          dot={{ fill: '#6ABF69', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, fill: '#E67E22' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="entries-section">
                <h3 className="section-title">养护记录</h3>
                {selectedPlantEntries.length === 0 ? (
                  <p className="empty-entries">暂无记录</p>
                ) : (
                  <div className="entries-list">
                    {[...selectedPlantEntries].reverse().map(entry => (
                      <div key={entry.id} className="diary-entry-card">
                        <div className="entry-header">
                          <span className="entry-type">{typeLabels[entry.type]}</span>
                          <span className="entry-date">{entry.date}</span>
                          <span className="entry-growth">成长值 +{entry.growthValue}</span>
                        </div>
                        {entry.note && (
                          <p className="entry-note">{entry.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>记录养护</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <label>选择植物</label>
                <select
                  value={selectedPlantId || ''}
                  onChange={e => setSelectedPlantId(e.target.value)}
                >
                  {myPlants.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label>养护类型</label>
                <div className="type-buttons">
                  {(['watering', 'fertilizing', 'pruning', 'repotting'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      className={`type-btn ${entryType === type ? 'active' : ''}`}
                      onClick={() => setEntryType(type)}
                    >
                      {typeLabels[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <label>备注（≤100字）</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="记录一下今天的养护情况..."
                  rows={3}
                  maxLength={100}
                />
                <span className="char-count">{note.length}/100</span>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setShowAddForm(false)}>
                  取消
                </button>
                <button type="submit" disabled={submitting}>
                  {submitting ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiaryPage;
