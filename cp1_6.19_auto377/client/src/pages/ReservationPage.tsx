import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isBefore, isAfter, parseISO, startOfDay } from 'date-fns';
import { useStore } from '../store/useStore';
import { TimeSlot } from '../types';

const ReservationPage = () => {
  const { selectedDevice, devices, submitReservation, reservations, checkStockAvailability } = useStore();

  const [formData, setFormData] = useState({
    deviceId: selectedDevice?.id || '',
    userName: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    timeSlots: [] as TimeSlot[],
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stockAvailable, setStockAvailable] = useState(true);
  const [dateError, setDateError] = useState('');

  const timeSlots: TimeSlot[] = ['上午', '下午', '晚上'];

  useEffect(() => {
    if (selectedDevice) {
      setFormData((prev) => ({ ...prev, deviceId: selectedDevice.id }));
    }
  }, [selectedDevice]);

  useEffect(() => {
    const checkAvailability = async () => {
      if (formData.deviceId && formData.startDate && formData.endDate && formData.timeSlots.length > 0) {
        const available = await checkStockAvailability(
          formData.deviceId,
          formData.startDate,
          formData.endDate,
          formData.timeSlots
        );
        setStockAvailable(available);
      }
    };
    checkAvailability();
  }, [formData.deviceId, formData.startDate, formData.endDate, formData.timeSlots, checkStockAvailability]);

  const validateDates = () => {
    const today = startOfDay(new Date());
    const start = startOfDay(parseISO(formData.startDate));
    const end = startOfDay(parseISO(formData.endDate));

    if (isBefore(start, today)) {
      setDateError('开始日期不能早于今天');
      return false;
    }
    if (isAfter(start, end)) {
      setDateError('结束日期不能早于开始日期');
      return false;
    }
    setDateError('');
    return true;
  };

  useEffect(() => {
    validateDates();
  }, [formData.startDate, formData.endDate]);

  const handleTimeSlotToggle = (slot: TimeSlot) => {
    setFormData((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.includes(slot)
        ? prev.timeSlots.filter((s) => s !== slot)
        : [...prev.timeSlots, slot],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateDates()) return;
    if (!formData.deviceId) {
      setMessage({ type: 'error', text: '请选择设备' });
      return;
    }
    if (!formData.userName.trim()) {
      setMessage({ type: 'error', text: '请输入借用人姓名' });
      return;
    }
    if (formData.timeSlots.length === 0) {
      setMessage({ type: 'error', text: '请选择至少一个时段' });
      return;
    }
    if (!stockAvailable) {
      setMessage({ type: 'error', text: '当前时段该设备已满' });
      return;
    }

    const result = await submitReservation(formData);
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setFormData({
        deviceId: '',
        userName: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        timeSlots: [],
      });
    } else {
      setMessage({ type: 'error', text: result.message });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const selectedDeviceInfo = devices.find((d) => d.id === formData.deviceId);

  return (
    <div style={{ backgroundColor: '#F5F5F5', borderRadius: '12px', padding: '2rem' }}>
      <h2 style={{ color: '#0B3C5D', fontSize: '1.75rem', marginBottom: '2rem' }}>设备预约</h2>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              color: 'white',
              backgroundColor: message.type === 'success' ? '#43A047' : '#E53935',
            }}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: 500 }}>
              选择设备
            </label>
            <select
              value={formData.deviceId}
              onChange={(e) => setFormData((prev) => ({ ...prev, deviceId: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#0B3C5D')}
              onBlur={(e) => (e.target.style.borderColor = '#ddd')}
            >
              <option value="">请选择设备</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name} - {device.model}
                </option>
              ))}
            </select>
            {selectedDeviceInfo && (
              <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>
                库存: {selectedDeviceInfo.stock}台
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: 500 }}>
              借用人姓名
            </label>
            <input
              type="text"
              value={formData.userName}
              onChange={(e) => setFormData((prev) => ({ ...prev, userName: e.target.value }))}
              placeholder="请输入姓名"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#0B3C5D')}
              onBlur={(e) => (e.target.style.borderColor = '#ddd')}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: 500 }}>
                开始日期
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0B3C5D')}
                onBlur={(e) => (e.target.style.borderColor = '#ddd')}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: 500 }}>
                结束日期
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0B3C5D')}
                onBlur={(e) => (e.target.style.borderColor = '#ddd')}
              />
            </div>
          </div>

          {dateError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ color: '#E53935', marginBottom: '1rem', fontSize: '0.875rem' }}
            >
              {dateError}
            </motion.p>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: 500 }}>
              借用时段
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => handleTimeSlotToggle(slot)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: formData.timeSlots.includes(slot) ? '#0B3C5D' : 'white',
                    color: formData.timeSlots.includes(slot) ? 'white' : '#0B3C5D',
                    border: '2px solid #0B3C5D',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!formData.timeSlots.includes(slot)) {
                      e.currentTarget.style.backgroundColor = '#1A5A8C';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!formData.timeSlots.includes(slot)) {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = '#0B3C5D';
                    }
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {!stockAvailable && formData.timeSlots.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ color: '#E53935', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}
            >
              当前时段该设备已满
            </motion.p>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: '#0B3C5D',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 500,
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1A5A8C')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0B3C5D')}
          >
            提交预约
          </button>
        </form>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ color: '#0B3C5D', fontSize: '1.5rem', marginBottom: '1rem' }}>我的预约记录</h3>
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#0B3C5D', color: 'white' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>设备名称</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>借用人</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>开始日期</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>结束日期</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>时段</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>状态</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    暂无预约记录
                  </td>
                </tr>
              ) : (
                reservations.map((reservation, index) => (
                  <tr
                    key={reservation.id}
                    style={{
                      backgroundColor: reservation.isOverdue ? '#FFEBEE' : index % 2 === 0 ? '#FFFFFF' : '#F0F4F8',
                      transition: 'background-color 0.3s ease',
                    }}
                  >
                    <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>{reservation.deviceName}</td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>{reservation.userName}</td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>{reservation.startDate}</td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>{reservation.endDate}</td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                      {reservation.timeSlots.join(', ')}
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                      {reservation.isOverdue ? (
                        <span
                          style={{
                            backgroundColor: '#E53935',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                          }}
                        >
                          已逾期
                        </span>
                      ) : (
                        <span
                          style={{
                            backgroundColor: '#43A047',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                          }}
                        >
                          有效
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReservationPage;
