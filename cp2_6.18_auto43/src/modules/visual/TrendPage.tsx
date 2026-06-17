import { useEffect, useMemo, useState } from 'react';
import { useHealthStore } from '../../store/useHealthStore';
import { HealthLineChart, MedicationBarChart } from './Charts';
import { RangeOption, HealthRecord } from '../data/types';
import { AddRecordModal } from '../../components/AddRecordModal';
import { isAbnormalBP } from '../data';

const RANGES: RangeOption[] = [7, 30, 90];

export const TrendPage = () => {
  const records = useHealthStore((s) => s.records);
  const loading = useHealthStore((s) => s.loading);
  const range = useHealthStore((s) => s.range);
  const setRange = useHealthStore((s) => s.setRange);
  const lineData = useHealthStore((s) => s.lineData);
  const barData = useHealthStore((s) => s.barData);
  const load = useHealthStore((s) => s.load);
  const removeRecord = useHealthStore((s) => s.removeRecord);

  const [editRecord, setEditRecord] = useState<HealthRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { load(); }, [load]);

  const tableRecords = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - (range - 1));
    const startISO = start.toISOString().slice(0, 10);
    return records.filter((r) => r.date >= startISO);
  }, [records, range]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.pageTitle}>趋势分析</div>
          <div style={styles.pageSub}>
            观察血压与血糖变化趋势，掌握用药频率分布
          </div>
        </div>
        <div style={styles.rangeGroup}>
          {RANGES.map((r) => {
            const active = r === range;
            return (
              <button
                key={r}
                style={{
                  ...styles.rangeBtn,
                  background: active
                    ? 'linear-gradient(135deg,#6366F1,#818CF8)'
                    : '#E5E7EB',
                  color: active ? '#fff' : '#4B5563',
                  boxShadow: active ? '0 4px 12px rgba(99,102,241,0.3)' : 'none'
                }}
                onClick={() => setRange(r)}
              >
                {r} 天
              </button>
            );
          })}
        </div>
      </div>

      <div style={styles.chartRow}>
        {loading ? (
          <>
            <div className="skeleton-block" style={{ width: '65%', height: 300, borderRadius: 12 }} />
            <div className="skeleton-block" style={{ width: 'calc(35% - 16px)', height: 300, borderRadius: 12 }} />
          </>
        ) : (
          <>
            <HealthLineChart data={lineData} />
            <MedicationBarChart data={barData} />
          </>
        )}
      </div>

      <div style={styles.tableWrap}>
        <div style={styles.tableHeader}>
          <span style={styles.tableTitle}>全部记录</span>
          <span style={styles.tableHint}>共 {tableRecords.length} 条 · 最近 {range} 天</span>
        </div>
        {loading ? (
          <div style={{ padding: 16 }}>
            {[0,1,2,3,4,5,6,7].map((i) => (
              <div key={i} className="skeleton-block" style={{ height: 44, borderRadius: 4, marginBottom: 8 }} />
            ))}
          </div>
        ) : tableRecords.length === 0 ? (
          <div style={styles.empty}>该时间范围内暂无记录</div>
        ) : (
          <div style={styles.tableScroll}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: 120 }}>日期时间</th>
                  <th style={{ ...styles.th, width: 140 }}>药物名称</th>
                  <th style={{ ...styles.th, width: 80 }}>剂量</th>
                  <th style={{ ...styles.th, width: 80 }}>血压</th>
                  <th style={{ ...styles.th, width: 80 }}>血糖</th>
                  <th style={{ ...styles.th, width: 80 }}>状态</th>
                  <th style={styles.th}>备注</th>
                  <th style={{ ...styles.th, width: 90, textAlign: 'right' as const }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {tableRecords.map((r, idx) => {
                  const bpAbn = isAbnormalBP(r.metrics.systolic, r.metrics.diastolic);
                  return (
                    <tr
                      key={r.id}
                      style={{
                        background: idx % 2 === 0 ? '#F9FAFB' : '#fff',
                        transition: 'background 0.18s ease'
                      }}
                      className="record-row"
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = '#EEF2FF';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background =
                          idx % 2 === 0 ? '#F9FAFB' : '#fff';
                      }}
                    >
                      <td style={styles.td}>
                        <div style={{ fontWeight: 600, color: '#374151', fontSize: 12 }}>{r.date}</div>
                        <div style={{ color: '#9CA3AF', fontSize: 11 }}>{r.medication.time}</div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.medName}>{r.medication.name}</span>
                      </td>
                      <td style={styles.td}>{r.medication.dosage}</td>
                      <td style={styles.td}>
                        {r.metrics.systolic !== undefined ? (
                          <span style={{ color: bpAbn ? '#DC2626' : '#059669', fontWeight: 600, fontSize: 12 }}>
                            {r.metrics.systolic}/{r.metrics.diastolic}
                          </span>
                        ) : <span style={{ color: '#D1D5DB' }}>—</span>}
                      </td>
                      <td style={styles.td}>
                        {r.metrics.bloodSugar !== undefined ? (
                          <span style={{
                            color: r.metrics.bloodSugar > 7 ? '#DC2626' : '#059669',
                            fontWeight: 600, fontSize: 12
                          }}>
                            {r.metrics.bloodSugar}
                          </span>
                        ) : <span style={{ color: '#D1D5DB' }}>—</span>}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: r.medication.taken ? '#D1FAE5' : '#FEE2E2',
                          color: r.medication.taken ? '#065F46' : '#991B1B'
                        }}>
                          {r.medication.taken ? '已服' : '漏服'}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: '#6B7280', fontSize: 12, maxWidth: 160 }}>
                        {r.note ? (r.note.length > 16 ? r.note.slice(0, 16) + '…' : r.note) : <span style={{ color: '#D1D5DB' }}>—</span>}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' as const }}>
                        <button
                          style={styles.iconBtn}
                          title="编辑"
                          onClick={() => { setEditRecord(r); setModalOpen(true); }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          </svg>
                        </button>
                        <button
                          style={styles.iconBtn}
                          title="删除"
                          onClick={() => {
                            if (confirm('确定删除这条记录？')) removeRecord(r.id);
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddRecordModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditRecord(null); }}
        editRecord={editRecord}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '28px 32px 60px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20
  },
  pageTitle: { fontSize: 22, fontWeight: 800, color: '#1F2937' },
  pageSub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  rangeGroup: {
    display: 'inline-flex',
    gap: 4,
    padding: 4,
    background: '#F3F4F6',
    borderRadius: 10
  },
  rangeBtn: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  chartRow: {
    display: 'flex',
    gap: 16,
    marginBottom: 24
  },
  tableWrap: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    overflow: 'hidden'
  },
  tableHeader: {
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #F3F4F6'
  },
  tableTitle: { fontSize: 14, fontWeight: 700, color: '#1F2937' },
  tableHint: { fontSize: 12, color: '#9CA3AF' },
  tableScroll: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 600,
    color: '#6B7280',
    fontSize: 11,
    background: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
    letterSpacing: 0.3,
    position: 'sticky' as const,
    top: 0
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #F3F4F6',
    verticalAlign: 'middle',
    fontSize: 12,
    color: '#374151'
  },
  medName: {
    fontWeight: 600,
    color: '#1F2937',
    fontSize: 12
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: '1px solid #F3F4F6',
    background: '#fff',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    transition: 'all 0.2s'
  },
  empty: {
    padding: '48px 0',
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 13
  }
};
