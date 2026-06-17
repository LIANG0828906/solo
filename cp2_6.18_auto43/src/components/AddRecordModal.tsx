import { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { HealthRecord, COMMON_MEDICATIONS } from '../modules/data/types';
import { formatDate } from '../modules/data';
import { useHealthStore } from '../store/useHealthStore';

interface Props {
  open: boolean;
  onClose: () => void;
  editRecord?: HealthRecord | null;
}

interface FormState {
  medicationName: string;
  customMed: string;
  dosage: string;
  date: string;
  time: string;
  taken: boolean;
  systolic: string;
  diastolic: string;
  bloodSugar: string;
  note: string;
}

const initForm = (): FormState => {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  return {
    medicationName: COMMON_MEDICATIONS[0],
    customMed: '',
    dosage: '1片',
    date: formatDate(now),
    time: `${hh}:${mm}`,
    taken: true,
    systolic: '',
    diastolic: '',
    bloodSugar: '',
    note: ''
  };
};

export const AddRecordModal = ({ open, onClose, editRecord }: Props) => {
  const addRecord = useHealthStore((s) => s.addRecord);
  const updateRecord = useHealthStore((s) => s.updateRecord);

  const [form, setForm] = useState<FormState>(initForm());
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState<'form' | 'fadeOut' | 'success'>('form');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isEdit = !!editRecord;

  useEffect(() => {
    if (open) {
      setStage('form');
      if (editRecord) {
        const inList = COMMON_MEDICATIONS.includes(editRecord.medication.name);
        setForm({
          medicationName: inList ? editRecord.medication.name : '__custom__',
          customMed: inList ? '' : editRecord.medication.name,
          dosage: editRecord.medication.dosage,
          date: editRecord.date,
          time: editRecord.medication.time,
          taken: editRecord.medication.taken,
          systolic: editRecord.metrics.systolic?.toString() || '',
          diastolic: editRecord.metrics.diastolic?.toString() || '',
          bloodSugar: editRecord.metrics.bloodSugar?.toString() || '',
          note: editRecord.note || ''
        });
        setSearch('');
      } else {
        setForm(initForm());
        setSearch('');
      }
    }
  }, [open, editRecord]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredMeds = useMemo(() => {
    const s = search.trim().toLowerCase();
    const list = s ? COMMON_MEDICATIONS.filter((m) => m.toLowerCase().includes(s)) : COMMON_MEDICATIONS;
    return list;
  }, [search]);

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    const finalName = form.medicationName === '__custom__' ? form.customMed.trim() : form.medicationName;
    if (!finalName) e.medicationName = '请选择或输入药物名称';
    if (!form.dosage.trim()) e.dosage = '请输入剂量';
    const sys = form.systolic ? Number(form.systolic) : undefined;
    const dia = form.diastolic ? Number(form.diastolic) : undefined;
    if ((sys !== undefined && isNaN(sys)) || (sys !== undefined && (sys < 50 || sys > 250))) e.systolic = '收缩压异常';
    if ((dia !== undefined && isNaN(dia)) || (dia !== undefined && (dia < 30 || dia > 150))) e.diastolic = '舒张压异常';
    if ((sys !== undefined && dia === undefined) || (sys === undefined && dia !== undefined)) {
      e.systolic = '血压需同时填写';
    }
    const bs = form.bloodSugar ? Number(form.bloodSugar) : undefined;
    if (bs !== undefined && (isNaN(bs) || bs < 1 || bs > 30)) e.bloodSugar = '血糖值异常';
    if (form.note.length > 100) e.note = '最多100字';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setStage('fadeOut');
    setTimeout(() => {
      const finalName = form.medicationName === '__custom__' ? form.customMed.trim() : form.medicationName;
      const sys = form.systolic ? Number(form.systolic) : undefined;
      const dia = form.diastolic ? Number(form.diastolic) : undefined;
      const bs = form.bloodSugar ? Number(form.bloodSugar) : undefined;
      const id = editRecord?.id || uuid();
      const ts = new Date(`${form.date}T${form.time}:00`).getTime();
      const record: HealthRecord = {
        id,
        date: form.date,
        timestamp: isNaN(ts) ? Date.now() : ts,
        medication: {
          id: editRecord?.medication.id || uuid(),
          name: finalName,
          dosage: form.dosage.trim(),
          time: form.time,
          taken: form.taken
        },
        metrics: { systolic: sys, diastolic: dia, bloodSugar: bs },
        note: form.note.trim() || undefined
      };
      if (isEdit) updateRecord(record);
      else addRecord(record);
      setStage('success');
      setTimeout(() => { onClose(); }, 900);
    }, 280);
  };

  if (!open) return null;

  const field = (label: string, err?: string, extra?: React.ReactNode) => (
    <div style={styles.field}>
      <div style={styles.fieldTop}>
        <label style={styles.label}>{label}</label>
        {extra}
      </div>
      {err && <div style={styles.err}>{err}</div>}
    </div>
  );

  return (
    <div style={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        ...styles.panel,
        transform: stage !== 'form' ? 'translateY(0) scale(0.98)' : 'translateY(0)',
        opacity: stage === 'fadeOut' ? 0 : 1,
        transition: stage === 'fadeOut' ? 'opacity 0.28s ease, transform 0.28s ease' : 'none'
      }}>
        {stage === 'success' ? (
          <div style={styles.successWrap}>
            <div style={styles.checkCircle}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div style={styles.successText}>{isEdit ? '记录已更新' : '记录已保存'}</div>
          </div>
        ) : (
          <>
            <div style={styles.panelHeader}>
              <div style={styles.panelTitle}>{isEdit ? '编辑记录' : '添加健康记录'}</div>
              <button style={styles.closeBtn} onClick={onClose}>×</button>
            </div>
            <div style={styles.panelBody}>
              {field('药物名称', errors.medicationName)}
              <div ref={dropdownRef} style={styles.selectWrap}>
                <div
                  style={{ ...styles.select, ...(errors.medicationName ? styles.inputErr : {}) }}
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <span style={{
                    color: form.medicationName === '__custom__' && !form.customMed ? '#9CA3AF' : '#1F2937',
                    flex: 1
                  }}>
                    {form.medicationName === '__custom__'
                      ? (form.customMed || '自定义药物名称...')
                      : form.medicationName}
                  </span>
                  <span style={{ color: '#9CA3AF' }}>▾</span>
                </div>
                {showDropdown && (
                  <div style={styles.dropdown}>
                    <div style={styles.searchWrap}>
                      <input
                        style={styles.searchInput}
                        placeholder="搜索药物..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div style={styles.dropdownList}>
                      {filteredMeds.map((m) => (
                        <div
                          key={m}
                          style={{
                            ...styles.dropdownItem,
                            background: form.medicationName === m ? '#EEF2FF' : 'transparent',
                            color: form.medicationName === m ? '#4338CA' : '#1F2937'
                          }}
                          onClick={() => {
                            setForm({ ...form, medicationName: m });
                            setShowDropdown(false);
                            setSearch('');
                          }}
                        >{m}</div>
                      ))}
                      <div
                        style={{ ...styles.dropdownItem, borderTop: '1px solid #F3F4F6' }}
                        onClick={() => {
                          setForm({ ...form, medicationName: '__custom__' });
                          setShowDropdown(false);
                        }}
                      >✏️ 自定义输入</div>
                    </div>
                  </div>
                )}
              </div>

              {form.medicationName === '__custom__' && (
                <input
                  style={styles.input}
                  placeholder="请输入药物名称"
                  value={form.customMed}
                  onChange={(e) => setForm({ ...form, customMed: e.target.value })}
                  maxLength={30}
                />
              )}

              <div style={styles.row}>
                <div style={{ flex: 1 }}>
                  {field('剂量', errors.dosage)}
                  <input
                    style={{ ...styles.input, ...(errors.dosage ? styles.inputErr : {}) }}
                    placeholder="如 1片 / 5mg"
                    value={form.dosage}
                    onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                    maxLength={20}
                  />
                </div>
                <div style={{ width: 12 }} />
                <div style={{ width: 110 }}>
                  {field('时间')}
                  <input
                    type="time"
                    style={styles.input}
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                </div>
                <div style={{ width: 12 }} />
                <div style={{ width: 140 }}>
                  {field('日期')}
                  <input
                    type="date"
                    style={styles.input}
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
              </div>

              <div style={styles.row}>
                <div style={{ flex: 1 }}>
                  {field('收缩压 (高压)', errors.systolic)}
                  <div style={styles.unitWrap}>
                    <input
                      style={{ ...styles.input, ...(errors.systolic ? styles.inputErr : {}) }}
                      placeholder="90-140"
                      value={form.systolic}
                      onChange={(e) => setForm({ ...form, systolic: e.target.value.replace(/[^\d]/g, '') })}
                    />
                    <span style={styles.unitTag}>mmHg</span>
                  </div>
                </div>
                <div style={{ width: 12 }} />
                <div style={{ flex: 1 }}>
                  {field('舒张压 (低压)', errors.diastolic)}
                  <div style={styles.unitWrap}>
                    <input
                      style={{ ...styles.input, ...(errors.diastolic ? styles.inputErr : {}) }}
                      placeholder="60-90"
                      value={form.diastolic}
                      onChange={(e) => setForm({ ...form, diastolic: e.target.value.replace(/[^\d]/g, '') })}
                    />
                    <span style={styles.unitTag}>mmHg</span>
                  </div>
                </div>
                <div style={{ width: 12 }} />
                <div style={{ flex: 1 }}>
                  {field('血糖', errors.bloodSugar)}
                  <div style={styles.unitWrap}>
                    <input
                      style={{ ...styles.input, ...(errors.bloodSugar ? styles.inputErr : {}) }}
                      placeholder="如 5.6"
                      value={form.bloodSugar}
                      onChange={(e) => setForm({ ...form, bloodSugar: e.target.value.replace(/[^\d.]/g, '') })}
                    />
                    <span style={styles.unitTag}>mmol/L</span>
                  </div>
                </div>
              </div>

              {field(`备注 (${form.note.length}/100)`, errors.note)}
              <textarea
                style={{ ...styles.textarea, ...(errors.note ? styles.inputErr : {}) }}
                placeholder="可选，最多100字..."
                value={form.note}
                maxLength={100}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />

              <label style={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={form.taken}
                  onChange={(e) => setForm({ ...form, taken: e.target.checked })}
                  style={styles.checkbox}
                />
                <span>我已按时服药</span>
              </label>
            </div>
            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={onClose}>取消</button>
              <button style={styles.submitBtn} onClick={handleSubmit}>
                {isEdit ? '保存修改' : '提交记录'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.38)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    animation: 'fadeIn 0.2s ease'
  },
  panel: {
    width: 500, background: '#fff', borderRadius: 16,
    boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
    overflow: 'hidden',
    animation: 'slideUp 0.4s cubic-bezier(0.22,1,0.36,1)'
  },
  panelHeader: {
    padding: '18px 24px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6'
  },
  panelTitle: { fontSize: 18, fontWeight: 700, color: '#1F2937' },
  closeBtn: {
    border: 'none', background: 'transparent', fontSize: 24, color: '#9CA3AF',
    cursor: 'pointer', lineHeight: 1, padding: 0, width: 28, height: 28
  },
  panelBody: { padding: '20px 24px 8px', maxHeight: '62vh', overflowY: 'auto' },
  field: { marginBottom: 6 },
  fieldTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'inline-block' },
  err: { fontSize: 11, color: '#DC2626', marginTop: 2 },
  input: {
    width: '100%', height: 38, border: '1px solid #E5E7EB', borderRadius: 8,
    padding: '0 12px', fontSize: 13, color: '#1F2937', background: '#fff',
    transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none',
    marginBottom: 14, fontFamily: 'inherit'
  },
  inputErr: { borderColor: '#F87171', boxShadow: '0 0 0 3px rgba(248,113,113,0.15)' },
  textarea: {
    width: '100%', minHeight: 64, maxHeight: 110, resize: 'vertical',
    border: '1px solid #E5E7EB', borderRadius: 8,
    padding: '8px 12px', fontSize: 13, color: '#1F2937', background: '#fff',
    transition: 'border-color 0.2s', outline: 'none', marginBottom: 14, fontFamily: 'inherit'
  },
  row: { display: 'flex', alignItems: 'flex-start' },
  selectWrap: { position: 'relative', marginBottom: 10, zIndex: 10 },
  select: {
    height: 38, border: '1px solid #E5E7EB', borderRadius: 8,
    padding: '0 12px', fontSize: 13, background: '#fff',
    display: 'flex', alignItems: 'center', cursor: 'pointer',
    transition: 'border-color 0.2s', marginBottom: 14
  },
  dropdown: {
    position: 'absolute', top: 40, left: 0, right: 0, background: '#fff',
    borderRadius: 10, boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
    border: '1px solid #F3F4F6', overflow: 'hidden', zIndex: 20
  },
  searchWrap: { padding: 8, borderBottom: '1px solid #F3F4F6' },
  searchInput: {
    width: '100%', height: 32, borderRadius: 6, border: '1px solid #E5E7EB',
    padding: '0 10px', fontSize: 12, outline: 'none', fontFamily: 'inherit'
  },
  dropdownList: { maxHeight: 200, overflowY: 'auto' },
  dropdownItem: {
    padding: '9px 12px', fontSize: 13, cursor: 'pointer',
    transition: 'background 0.15s', color: '#1F2937'
  },
  unitWrap: { position: 'relative' },
  unitTag: {
    position: 'absolute', right: 10, top: 10, fontSize: 11, color: '#9CA3AF', fontWeight: 500,
    pointerEvents: 'none'
  },
  checkLabel: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontSize: 13, color: '#374151', marginBottom: 8, cursor: 'pointer', userSelect: 'none'
  },
  checkbox: { width: 16, height: 16, cursor: 'pointer', accentColor: '#6366F1' },
  footer: {
    padding: '14px 24px 20px', display: 'flex', gap: 12, justifyContent: 'flex-end',
    borderTop: '1px solid #F3F4F6', background: '#FAFBFC'
  },
  cancelBtn: {
    height: 40, padding: '0 18px', borderRadius: 8, border: '1px solid #E5E7EB',
    background: '#fff', color: '#4B5563', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s'
  },
  submitBtn: {
    height: 40, padding: '0 20px', borderRadius: 8, border: 'none',
    background: 'linear-gradient(135deg,#6366F1,#818CF8)', color: '#fff',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
    transition: 'filter 0.2s, transform 0.2s',
    display: 'flex', alignItems: 'center', gap: 6
  },
  successWrap: {
    padding: '60px 40px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 18
  },
  checkCircle: {
    width: 64, height: 64, borderRadius: '50%',
    background: 'linear-gradient(135deg,#10B981,#059669)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(16,185,129,0.4)',
    animation: 'scaleIn 0.3s cubic-bezier(0.22,1,0.36,1)'
  },
  successText: { fontSize: 16, fontWeight: 600, color: '#059669' }
};
