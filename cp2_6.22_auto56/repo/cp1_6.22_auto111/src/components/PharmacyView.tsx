import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Prescription, Medication } from '../types';
import { prescriptionApi } from '../api';

type FilterStatus = 'all' | 'pending' | 'dispensed';

const PharmacyView = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [dispensedMeds, setDispensedMeds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPrescriptions = useCallback(async () => {
    try {
      const params: { status?: string; search?: string } = {};
      if (filter !== 'all') params.status = filter;
      if (debouncedSearch) params.search = debouncedSearch;

      const data = await prescriptionApi.getAll(params);
      setPrescriptions(data);
    } catch (err) {
      console.error('获取处方失败', err);
    }
  }, [filter, debouncedSearch]);

  useEffect(() => {
    fetchPrescriptions();
    const interval = setInterval(fetchPrescriptions, 5000);
    return () => clearInterval(interval);
  }, [fetchPrescriptions]);

  const handleOpenModal = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setDispensedMeds(prescription.medications.filter((m) => m.dispensed).map((m) => m.id));
    setMessage(null);
  };

  const handleCloseModal = () => {
    setSelectedPrescription(null);
    setDispensedMeds([]);
    setMessage(null);
  };

  const toggleMedication = (medId: string) => {
    setDispensedMeds((prev) =>
      prev.includes(medId) ? prev.filter((id) => id !== medId) : [...prev, medId]
    );
  };

  const handleDispense = async () => {
    if (!selectedPrescription) return;

    const allMedIds = selectedPrescription.medications.map((m) => m.id);
    const allSelected = allMedIds.every((id) => dispensedMeds.includes(id));

    if (!allSelected) {
      setMessage({ text: '请确认所有药品已配药', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await prescriptionApi.updateStatus(selectedPrescription.id, {
        status: 'dispensed',
        dispensedMedications: dispensedMeds,
      });
      setMessage({ text: '配药成功！', type: 'success' });
      setTimeout(() => {
        handleCloseModal();
        fetchPrescriptions();
      }, 1000);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setMessage({ text: error.response?.data?.error || '配药失败', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filterOptions: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待配药' },
    { value: 'dispensed', label: '已配药' },
  ];

  const getFilterLabel = () => filterOptions.find((o) => o.value === filter)?.label || '全部';

  const isExpired = (p: Prescription) => new Date() > new Date(p.expiresAt);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ color: '#3B82F6' }}>药房处方管理</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary glass"
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                minWidth: '120px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {getFilterLabel()}
              <span style={{ marginLeft: '0.5rem' }}>▼</span>
            </button>
            {showDropdown && (
              <div
                className="glass"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '0.25rem',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  overflow: 'hidden',
                  zIndex: 10,
                }}
              >
                {filterOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => {
                      setFilter(option.value);
                      setShowDropdown(false);
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      background: filter === option.value ? '#E0F2FE' : 'transparent',
                      color: filter === option.value ? '#3B82F6' : '#374151',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (filter !== option.value) {
                        e.currentTarget.style.background = '#F3F4F6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (filter !== option.value) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <input
            type="text"
            placeholder="搜索处方号/手机号"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '200px' }}
          />
        </div>
      </div>

      {message && !selectedPrescription && (
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {prescriptions.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF', width: '100%' }}>
            暂无处方记录
          </div>
        ) : (
          prescriptions.map((prescription, index) => (
            <div
              key={prescription.id}
              className="card fade-in"
              onClick={() => handleOpenModal(prescription)}
              style={{
                width: '300px',
                padding: '1rem',
                cursor: 'pointer',
                animationDelay: `${index * 0.05}s`,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#DBEAFE';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{prescription.prescriptionNo}</div>
                  <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                    {prescription.patientName}
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

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                <span style={{ color: '#6B7280' }}>
                  药品数：{prescription.medications.length}种
                </span>
                <span style={{ color: isExpired(prescription) ? '#EF4444' : '#22C55E' }}>
                  {isExpired(prescription) ? '已过期' : '有效'}
                </span>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                {format(new Date(prescription.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedPrescription && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: '#3B82F6' }}>配药详情</h3>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6B7280',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 500 }}>处方号：</span>
                <span>{selectedPrescription.prescriptionNo}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 500 }}>患者：</span>
                <span>{selectedPrescription.patientName} ({selectedPrescription.patientPhone})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 500 }}>医生：</span>
                <span>{selectedPrescription.doctorName}</span>
              </div>
            </div>

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

            <h4 style={{ marginBottom: '0.75rem' }}>药品清单（请逐项勾选确认）</h4>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
              {selectedPrescription.medications.map((med: Medication) => (
                <label
                  key={med.id}
                  className="custom-checkbox"
                  style={{
                    padding: '0.75rem',
                    background: dispensedMeds.includes(med.id) ? '#DCFCE7' : '#F9FAFB',
                    borderRadius: '6px',
                    marginBottom: '0.5rem',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={dispensedMeds.includes(med.id)}
                    onChange={() => toggleMedication(med.id)}
                    disabled={selectedPrescription.status === 'dispensed'}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{med.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      {med.dosage}，{med.usage}，共{med.days}天
                    </div>
                  </div>
                  {dispensedMeds.includes(med.id) && (
                    <span style={{ color: '#22C55E', fontSize: '1.25rem' }}>✓</span>
                  )}
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                已选 {dispensedMeds.length}/{selectedPrescription.medications.length} 种药品
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={handleCloseModal}>
                  取消
                </button>
                {selectedPrescription.status !== 'dispensed' && (
                  <button
                    className="btn btn-primary"
                    onClick={handleDispense}
                    disabled={loading || dispensedMeds.length !== selectedPrescription.medications.length}
                  >
                    {loading ? '处理中...' : '确认配药'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyView;
