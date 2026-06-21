import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Prescription } from '../types';
import { prescriptionApi } from '../api';

const TIME_OPTIONS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

interface Toast {
  id: string;
  message: string;
  prescriptionNo: string;
}

const PatientView = () => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [editingReminders, setEditingReminders] = useState<string | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  const showToast = useCallback((message: string, prescriptionNo: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, prescriptionNo }]);
    playNotificationSound();

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    const checkReminders = () => {
      const now = new Date();
      const currentTime = format(now, 'HH:mm');

      prescriptions.forEach((p) => {
        if (new Date() > new Date(p.expiresAt)) return;
        if (p.reminders.includes(currentTime) && now.getSeconds() < 5) {
          const medNames = p.medications.map((m) => m.name).join('、');
          showToast(
            `用药提醒：请服用 ${medNames}`,
            p.prescriptionNo
          );
        }
      });
    };

    const interval = setInterval(checkReminders, 1000);
    return () => clearInterval(interval);
  }, [isLoggedIn, prescriptions, showToast]);

  const fetchPrescriptions = useCallback(async () => {
    if (!phone) return;
    try {
      const data = await prescriptionApi.getAll({
        patientPhone: phone,
        search: debouncedSearch || undefined,
      });
      setPrescriptions(data);
    } catch (err) {
      console.error('获取处方失败', err);
    }
  }, [phone, debouncedSearch]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchPrescriptions();
      const interval = setInterval(fetchPrescriptions, 5000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, fetchPrescriptions]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^1\d{10}$/.test(phone)) {
      setError('请输入正确的11位手机号');
      return;
    }
    if (code !== '1234') {
      setError('验证码错误，请输入1234');
      return;
    }
    setIsLoggedIn(true);
    setError('');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPhone('');
    setCode('');
    setPrescriptions([]);
  };

  const isExpired = (p: Prescription) => new Date() > new Date(p.expiresAt);

  const handleEditReminders = (prescription: Prescription) => {
    setEditingReminders(prescription.id);
    setSelectedTimes([...prescription.reminders]);
  };

  const toggleTime = (time: string) => {
    setSelectedTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const saveReminders = async () => {
    if (!editingReminders) return;
    setLoading(true);
    try {
      await prescriptionApi.updateReminders(editingReminders, {
        reminders: selectedTimes.sort(),
      });
      setEditingReminders(null);
      fetchPrescriptions();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card fade-in" style={{ padding: '2rem', width: '100%', maxWidth: '400px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#3B82F6' }}>
            患者登录
          </h2>

          {error && (
            <div style={{ padding: '0.75rem 1rem', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                手机号
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入11位手机号"
                style={{ width: '100%' }}
                maxLength={11}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                验证码（模拟：输入1234）
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="请输入验证码"
                style={{ width: '100%' }}
                maxLength={4}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              登录
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ color: '#3B82F6' }}>我的处方</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="搜索处方号"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '200px' }}
          />
          <button className="btn btn-secondary" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'flex-start' }}>
        {prescriptions.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF', width: '100%' }}>
            暂无处方记录
          </div>
        ) : (
          prescriptions.map((prescription, index) => {
            const expired = isExpired(prescription);
            const isExpanded = expandedId === prescription.id;
            const isEditing = editingReminders === prescription.id;
            const remindersEnabled = prescription.reminders.length > 0;

            return (
              <div
                key={prescription.id}
                className="card fade-in"
                style={{
                  width: '350px',
                  borderLeft: `4px solid ${expired ? '#9CA3AF' : '#22C55E'}`,
                  animationDelay: `${index * 0.05}s`,
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{ padding: '1rem', cursor: 'pointer' }}
                  onClick={() => !isEditing && setExpandedId(isExpanded ? null : prescription.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{prescription.prescriptionNo}</div>
                      <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                        医生：{prescription.doctorName}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          background: expired ? '#F3F4F6' : (prescription.status === 'dispensed' ? '#DCFCE7' : '#FEF3C7'),
                          color: expired ? '#6B7280' : (prescription.status === 'dispensed' ? '#166534' : '#92400E'),
                        }}
                      >
                        {expired ? '已过期' : prescription.status === 'dispensed' ? '已配药' : '待配药'}
                      </span>
                      <span style={{ fontSize: '1.25rem' }}>
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  <div style={{ color: '#6B7280', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                    药品数：{prescription.medications.length}种
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: '#6B7280' }}>
                      {format(new Date(prescription.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
                    </span>
                    <span style={{ color: expired ? '#EF4444' : '#22C55E' }}>
                      {expired ? '已过期' : `有效期至 ${format(new Date(prescription.expiresAt), 'MM-dd')}`}
                    </span>
                  </div>

                  {!expired && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={remindersEnabled}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (e.target.checked) {
                                handleEditReminders(prescription);
                              } else {
                                setEditingReminders(prescription.id);
                                setSelectedTimes([]);
                                setTimeout(saveReminders, 0);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <span style={{ fontSize: '0.75rem', color: '#4B5563' }}>
                          {remindersEnabled ? `已设置 (${prescription.reminders.join(', ')})` : '用药提醒'}
                        </span>
                      </div>
                      {remindersEnabled && (
                        <button
                          className="btn btn-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditReminders(prescription);
                          }}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          编辑
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isExpanded && !isEditing && (
                  <div style={{ padding: '0 1rem 1rem 1rem', borderTop: '1px solid #E5E7EB' }}>
                    <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', color: '#374151' }}>药品清单</h4>
                    {prescription.medications.map((med) => (
                      <div key={med.id} style={{ padding: '0.5rem', background: '#F9FAFB', borderRadius: '6px', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 500 }}>{med.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          {med.dosage}，{med.usage}，共{med.days}天
                        </div>
                        {med.dispensed && (
                          <div style={{ fontSize: '0.75rem', color: '#22C55E', marginTop: '0.25rem' }}>
                            ✓ 已配药
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {isEditing && (
                  <div style={{ padding: '1rem', borderTop: '1px solid #E5E7EB' }}>
                    <h4 style={{ marginBottom: '0.75rem', color: '#374151' }}>选择提醒时间</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                      {TIME_OPTIONS.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => toggleTime(time)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            border: '1px solid',
                            borderColor: selectedTimes.includes(time) ? '#3B82F6' : '#E5E7EB',
                            background: selectedTimes.includes(time) ? '#3B82F6' : '#FFFFFF',
                            color: selectedTimes.includes(time) ? '#FFFFFF' : '#374151',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-primary"
                        onClick={saveReminders}
                        disabled={loading}
                        style={{ flex: 1 }}
                      >
                        {loading ? '保存中...' : '保存'}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setEditingReminders(null)}
                        style={{ flex: 1 }}
                      >
                        取消
                      </button>
                    </div>
                    {error && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#EF4444' }}>
                        {error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
            {toast.prescriptionNo}
          </div>
          <div style={{ color: '#4B5563' }}>{toast.message}</div>
        </div>
      ))}

      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
};

export default PatientView;
