import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Patient, Prescription } from '../types';
import { patientApi, prescriptionApi } from '../api';

interface MedicationForm {
  name: string;
  dosage: string;
  usage: string;
  days: number;
}

const DoctorPanel = () => {
  const [patientPhone, setPatientPhone] = useState('');
  const [patientName, setPatientName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [medications, setMedications] = useState<MedicationForm[]>([
    { name: '', dosage: '', usage: '', days: 7 },
  ]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (patientPhone.length >= 11) {
        searchPatient(patientPhone);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientPhone]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchPatient = async (phone: string) => {
    try {
      const patient = await patientApi.search(phone);
      setCurrentPatient(patient);
      setPatientName(patient.name);
      setMessage(null);
    } catch {
      setCurrentPatient(null);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    const interval = setInterval(fetchPrescriptions, 5000);
    return () => clearInterval(interval);
  }, [debouncedSearch]);

  const fetchPrescriptions = useCallback(async () => {
    try {
      const data = await prescriptionApi.getAll({ search: debouncedSearch || undefined });
      setPrescriptions(data);
    } catch (err) {
      console.error('获取处方列表失败', err);
    }
  }, [debouncedSearch]);

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', usage: '', days: 7 }]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: keyof MedicationForm, value: string | number) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const validMeds = medications.filter((m) => m.name && m.dosage && m.usage && m.days > 0);
      if (validMeds.length === 0) {
        throw new Error('请至少填写一种药品');
      }
      if (!patientPhone || !patientName || !doctorName) {
        throw new Error('请填写完整信息');
      }

      const prescription = await prescriptionApi.create({
        patientPhone,
        patientName,
        doctorName,
        medications: validMeds,
      });

      setMessage({ text: `处方创建成功！处方号：${prescription.prescriptionNo}`, type: 'success' });
      setMedications([{ name: '', dosage: '', usage: '', days: 7 }]);
      fetchPrescriptions();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setMessage({ text: error.response?.data?.error || '创建处方失败', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const isExpired = (p: Prescription) => new Date() > new Date(p.expiresAt);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        <div className="card" style={{ flex: 1, minWidth: '320px', padding: '1.5rem' }}>
          <h2 style={{ marginBottom: '1.5rem', color: '#3B82F6' }}>开具处方</h2>

          {message && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                marginBottom: '1rem',
                background: message.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                color: message.type === 'success' ? '#166534' : '#991B1B',
              }}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                  患者手机号
                </label>
                <input
                  type="tel"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="请输入11位手机号"
                  style={{ width: '100%' }}
                  maxLength={11}
                />
                {currentPatient && (
                  <div style={{ fontSize: '0.75rem', color: '#22C55E', marginTop: '0.25rem' }}>
                    ✓ 已找到患者：{currentPatient.name}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                  患者姓名
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="请输入患者姓名"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                  医生姓名
                </label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="请输入医生姓名"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontWeight: 500 }}>药品清单</label>
                <button type="button" className="btn btn-secondary" onClick={addMedication} style={{ padding: '0.25rem 0.75rem' }}>
                  + 添加药品
                </button>
              </div>

              {medications.map((med, index) => (
                <div
                  key={index}
                  className="fade-in"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: '#F9FAFB',
                    borderRadius: '6px',
                    marginBottom: '0.5rem',
                  }}
                >
                  <input
                    type="text"
                    placeholder="药品名称"
                    value={med.name}
                    onChange={(e) => updateMedication(index, 'name', e.target.value)}
                    style={{ flex: 2, minWidth: '100px' }}
                  />
                  <input
                    type="text"
                    placeholder="剂量"
                    value={med.dosage}
                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                    style={{ flex: 1, minWidth: '80px' }}
                  />
                  <input
                    type="text"
                    placeholder="用法"
                    value={med.usage}
                    onChange={(e) => updateMedication(index, 'usage', e.target.value)}
                    style={{ flex: 1, minWidth: '80px' }}
                  />
                  <input
                    type="number"
                    placeholder="天数"
                    value={med.days}
                    onChange={(e) => updateMedication(index, 'days', parseInt(e.target.value) || 0)}
                    style={{ flex: 1, minWidth: '60px' }}
                    min="1"
                  />
                  {medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      style={{
                        background: '#FEE2E2',
                        color: '#991B1B',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0 0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      删除
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: '1rem' }}
            >
              {loading ? '提交中...' : '开具处方'}
            </button>
          </form>
        </div>

        <div className="card" style={{ flex: 1, minWidth: '320px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ color: '#3B82F6' }}>近期处方</h2>
            <input
              type="text"
              placeholder="搜索处方号/手机号"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '200px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
            {prescriptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>
                暂无处方记录
              </div>
            ) : (
              prescriptions.map((prescription, index) => (
                <div
                  key={prescription.id}
                  className="card fade-in"
                  style={{
                    padding: '1rem',
                    borderLeft: '3px solid #3B82F6',
                    animationDelay: `${index * 0.05}s`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{prescription.prescriptionNo}</div>
                      <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                        {prescription.patientName} ({prescription.patientPhone})
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        background: prescription.status === 'dispensed' ? '#DCFCE7' : '#FEF3C7',
                        color: prescription.status === 'dispensed' ? '#166534' : '#92400E',
                      }}
                    >
                      {prescription.status === 'dispensed' ? '已配药' : '待配药'}
                    </span>
                  </div>
                  <div style={{ color: '#6B7280', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                    药品数：{prescription.medications.length}种 | 医生：{prescription.doctorName}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: '#6B7280' }}>
                      {format(new Date(prescription.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                    </span>
                    <span style={{ color: isExpired(prescription) ? '#EF4444' : '#22C55E' }}>
                      {isExpired(prescription) ? '已过期' : '有效期至 ' + format(new Date(prescription.expiresAt), 'MM-dd')}
                    </span>
                  </div>
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #E5E7EB' }}>
                    {prescription.medications.map((med) => (
                      <div key={med.id} style={{ fontSize: '0.75rem', color: '#4B5563' }}>
                        {med.name} - {med.dosage}，{med.usage}，共{med.days}天
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPanel;
