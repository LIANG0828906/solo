import { useState, useMemo, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { useSalesStore, SaleRecord } from '../sales';
import { useShiftsStore, SHIFT_LABELS, ShiftType, serializeDate } from '../shifts';
import { useWorkersStore, ROLE_COLORS } from '../workers';

export default function SalesPage() {
  const { records, addRecord, updateRecord, getRecord, getRecordsByDateRange, deleteRecord } = useSalesStore();
  const { getWorkersForShift } = useShiftsStore();
  const { workers, getWorker } = useWorkersStore();

  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedShift, setSelectedShift] = useState<ShiftType>('morning');
  const [totalAmount, setTotalAmount] = useState('');
  const [orderCount, setOrderCount] = useState('');
  const [filterStart, setFilterStart] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [filterEnd, setFilterEnd] = useState(today);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const avgOrderValue = useMemo(() => {
    const amount = parseFloat(totalAmount) || 0;
    const count = parseInt(orderCount) || 0;
    return count > 0 ? (amount / count).toFixed(2) : '0.00';
  }, [totalAmount, orderCount]);

  const shiftWorkers = useMemo(() => {
    return getWorkersForShift(selectedDate, selectedShift);
  }, [selectedDate, selectedShift, getWorkersForShift]);

  useEffect(() => {
    setSelectedWorkers(shiftWorkers);
  }, [shiftWorkers]);

  useEffect(() => {
    const existing = getRecord(selectedDate, selectedShift);
    if (existing) {
      setEditingId(existing.id);
      setTotalAmount(existing.totalAmount.toString());
      setOrderCount(existing.orderCount.toString());
      setSelectedWorkers(existing.workerIds.length > 0 ? existing.workerIds : shiftWorkers);
    } else {
      setEditingId(null);
      setTotalAmount('');
      setOrderCount('');
      setSelectedWorkers(shiftWorkers);
    }
  }, [selectedDate, selectedShift, getRecord, shiftWorkers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(totalAmount);
    const count = parseInt(orderCount);
    if (isNaN(amount) || amount < 0 || isNaN(count) || count < 0) return;

    const recordData = {
      date: selectedDate,
      shift: selectedShift,
      totalAmount: amount,
      orderCount: count,
      workerIds: selectedWorkers,
    };

    if (editingId) {
      updateRecord(editingId, recordData);
    } else {
      addRecord(recordData);
    }

    setTotalAmount('');
    setOrderCount('');
    setEditingId(null);
  };

  const handleEditRecord = (record: SaleRecord) => {
    setSelectedDate(record.date);
    setSelectedShift(record.shift);
    setEditingId(record.id);
    setTotalAmount(record.totalAmount.toString());
    setOrderCount(record.orderCount.toString());
    setSelectedWorkers(record.workerIds);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm('确定要删除这条销售记录吗？')) {
      deleteRecord(id);
    }
  };

  const toggleWorkerSelection = (workerId: string) => {
    setSelectedWorkers(prev =>
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  const filteredRecords = useMemo(() => {
    return getRecordsByDateRange(filterStart, filterEnd);
  }, [filterStart, filterEnd, getRecordsByDateRange, records]);

  const shifts: ShiftType[] = ['morning', 'evening', 'night'];

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ color: '#E8C56D', fontFamily: 'Cinzel, serif', fontSize: '32px', textShadow: '0 0 20px rgba(201,168,76,0.4)' }}>
          💰 销售录入
        </h1>
        <p style={{ color: '#e8d5b7', opacity: 0.8, marginTop: '6px' }}>记录每日每班次的销售数据</p>
      </div>

      <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <h2 style={{ color: '#C9A84C', fontSize: '20px', marginBottom: '20px', borderBottom: '1px solid rgba(201,168,76,0.3)', paddingBottom: '12px' }}>
          {editingId ? '✏️ 编辑销售记录' : '📝 录入销售数据'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label className="input-label">📅 选择日期</label>
              <input type="date" className="input-field" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} max={today} />
            </div>
            <div>
              <label className="input-label">🕐 选择班次</label>
              <select className="input-field" value={selectedShift} onChange={e => setSelectedShift(e.target.value as ShiftType)}>
                {shifts.map(s => (
                  <option key={s} value={s}>{SHIFT_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">💰 总销售额 (¥)</label>
              <input type="number" className="input-field" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" required />
            </div>
            <div>
              <label className="input-label">📋 订单数</label>
              <input type="number" className="input-field" value={orderCount} onChange={e => setOrderCount(e.target.value)} placeholder="0" min="0" step="1" required />
            </div>
          </div>

          {shiftWorkers.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label className="input-label">👥 当班员工 (参与业绩分配)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '12px', background: 'rgba(244,228,193,0.1)', borderRadius: '8px', border: '1px solid rgba(201,168,76,0.2)' }}>
                {shiftWorkers.map(wid => {
                  const worker = getWorker(wid);
                  if (!worker) return null;
                  const isSelected = selectedWorkers.includes(wid);
                  return (
                    <div
                      key={wid}
                      onClick={() => toggleWorkerSelection(wid)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '20px',
                        background: isSelected
                          ? `linear-gradient(135deg, ${ROLE_COLORS[worker.role]} 0%, rgba(255,255,255,0.2) 100%)`
                          : 'rgba(255,255,255,0.1)',
                        color: isSelected ? 'white' : '#e8d5b7',
                        cursor: 'pointer',
                        border: `2px solid ${isSelected ? 'rgba(255,255,255,0.4)' : 'rgba(201,168,76,0.3)'}`,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ accentColor: '#C9A84C' }} />
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden',
                        border: '2px solid rgba(255,255,255,0.5)', background: '#F4E4C1', flexShrink: 0
                      }}>
                        <img src={worker.avatar} alt={worker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{worker.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ padding: '16px 24px', background: 'linear-gradient(135deg, rgba(46,74,46,0.4) 0%, rgba(61,107,61,0.2) 100%)', borderRadius: '10px', border: '1px solid #2E4A2E' }}>
              <span style={{ color: '#e8d5b7', fontSize: '14px' }}>📊 客单价: </span>
              <span style={{ color: '#E8C56D', fontSize: '24px', fontWeight: 700, fontFamily: 'Cinzel, serif' }}>¥{avgOrderValue}</span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {editingId && (
                <button type="button" className="btn" onClick={() => {
                  setEditingId(null);
                  setTotalAmount('');
                  setOrderCount('');
                }}>
                  取消编辑
                </button>
              )}
              <button type="submit" className="btn btn-primary">
                {editingId ? '💾 更新记录' : '✅ 保存记录'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px', borderBottom: '1px solid rgba(201,168,76,0.3)', paddingBottom: '12px' }}>
          <h2 style={{ color: '#C9A84C', fontSize: '20px' }}>📜 历史销售记录</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="date" className="input-field" value={filterStart} onChange={e => setFilterStart(e.target.value)} max={filterEnd} style={{ width: '150px' }} />
            <span style={{ color: '#C9A84C' }}>至</span>
            <input type="date" className="input-field" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} min={filterStart} max={today} style={{ width: '150px' }} />
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(232,213,183,0.5)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
            <p>该日期范围内暂无销售记录</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(201,168,76,0.3)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#C9A84C' }}>日期</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#C9A84C' }}>班次</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#C9A84C' }}>销售额</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#C9A84C' }}>订单数</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#C9A84C' }}>客单价</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#C9A84C' }}>员工</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#C9A84C' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(record => (
                  <tr key={record.id} style={{ borderBottom: '1px solid rgba(201,168,76,0.15)', transition: 'background 0.2s ease' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px', color: '#e8d5b7', fontWeight: 600 }}>{record.date}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'white',
                        background: record.shift === 'morning' ? 'linear-gradient(135deg, #f0e68c, #daa520)' :
                                   record.shift === 'evening' ? 'linear-gradient(135deg, #cd853f, #8b4513)' :
                                   'linear-gradient(135deg, #4a4a6a, #1a1a3a)'
                      }}>
                        {SHIFT_LABELS[record.shift]}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#E8C56D', fontWeight: 700, fontFamily: 'Cinzel, serif' }}>¥{record.totalAmount.toFixed(2)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#e8d5b7' }}>{record.orderCount}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#2E7D32', fontWeight: 600 }}>¥{record.avgOrderValue.toFixed(2)}</td>
                    <td style={{ padding: '12px', color: '#e8d5b7', fontSize: '13px' }}>
                      {record.workerIds.map(wid => getWorker(wid)?.name).filter(Boolean).join('、') || '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button className="btn" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => handleEditRecord(record)}>编辑</button>
                        <button className="btn btn-danger" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => handleDeleteRecord(record.id)}>删除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
