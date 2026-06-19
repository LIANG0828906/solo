import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { STATUS_COLORS, STATUS_LABELS, ChargingGun } from '../types';

const STEP = 15;
const MAX_DURATION = 120;

function roundToStep(ts: number): number {
  const d = new Date(ts);
  const m = d.getMinutes();
  const rounded = Math.ceil(m / STEP) * STEP;
  d.setMinutes(rounded, 0, 0);
  if (rounded >= 60) {
    d.setHours(d.getHours() + 1);
    d.setMinutes(rounded - 60);
  }
  return d.getTime();
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

export default function BookingPage() {
  const { stationId } = useParams<{ stationId: string }>();
  const navigate = useNavigate();
  const { stations, addBooking, fetchData } = useStore();

  const [selectedStationId, setSelectedStationId] = useState(stationId || '');
  const [selectedGunId, setSelectedGunId] = useState<string>('');
  const [startMinutes, setStartMinutes] = useState(0);
  const [endMinutes, setEndMinutes] = useState(60);
  const [hasConflict, setHasConflict] = useState(false);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const dayStart = useMemo(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return d.getTime();
  }, []);

  useEffect(() => {
    if (stations.length > 0 && !selectedStationId) {
      setSelectedStationId(stations[0].id);
    }
  }, [stations, selectedStationId]);

  useEffect(() => {
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const roundedStart = Math.ceil(currentMin / STEP) * STEP;
    setStartMinutes(roundedStart);
    setEndMinutes(Math.min(roundedStart + 60, 24 * 60 - STEP));
  }, []);

  const selectedStation = stations.find((s) => s.id === selectedStationId);
  const availableGuns: ChargingGun[] = selectedStation?.guns.filter(
    (g) => g.status === 'available' || g.status === 'reserved'
  ) || [];

  useEffect(() => {
    if (availableGuns.length > 0 && !selectedGunId) {
      setSelectedGunId(availableGuns[0].id);
    }
    if (availableGuns.length > 0 && !availableGuns.find((g) => g.id === selectedGunId)) {
      setSelectedGunId(availableGuns[0].id);
    }
  }, [availableGuns, selectedGunId]);

  const startTime = dayStart + startMinutes * 60 * 1000;
  const endTime = dayStart + endMinutes * 60 * 1000;
  const duration = endMinutes - startMinutes;

  useEffect(() => {
    if (!selectedStationId || startMinutes >= endMinutes) {
      setHasConflict(false);
      return;
    }
    const t1 = performance.now();
    fetch('/api/bookings/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stationId: selectedStationId,
        gunId: selectedGunId || undefined,
        startTime: dayStart + startMinutes * 60 * 1000,
        endTime: dayStart + endMinutes * 60 * 1000,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const t2 = performance.now();
        console.log(`Conflict check took ${(t2 - t1).toFixed(1)}ms`);
        if (data.conflict) {
          setHasConflict(true);
          setShake(true);
          setTimeout(() => setShake(false), 300);
        } else {
          setHasConflict(false);
        }
      })
      .catch(() => setHasConflict(false));
  }, [selectedStationId, selectedGunId, startMinutes, endMinutes, dayStart]);

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setStartMinutes(val);
    if (val >= endMinutes) {
      setEndMinutes(Math.min(val + 15, 24 * 60 - STEP));
    }
    if (endMinutes - val > MAX_DURATION) {
      setEndMinutes(val + MAX_DURATION);
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setEndMinutes(val);
    if (val - startMinutes > MAX_DURATION) {
      setStartMinutes(Math.max(0, val - MAX_DURATION));
    }
  };

  const handleSubmit = async () => {
    if (!selectedStationId) {
      setError('请选择充电桩');
      return;
    }
    if (hasConflict) {
      setError('所选时间段与其他预约冲突');
      setShake(true);
      setTimeout(() => setShake(false), 300);
      return;
    }
    if (duration > MAX_DURATION) {
      setError('预约时长不能超过120分钟');
      return;
    }
    if (duration <= 0) {
      setError('请选择有效的时间范围');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: selectedStationId,
          gunId: selectedGunId || undefined,
          startTime,
          endTime,
        }),
      });
      if (res.ok) {
        const booking = await res.json();
        addBooking(booking);
        await fetchData();
        navigate('/');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || '预约失败');
        setShake(true);
        setTimeout(() => setShake(false), 300);
      }
    } catch (e) {
      setError('网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const cost = duration * 0.5;

  const renderTimeSlider = (
    value: number,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    label: string,
    min: number,
    max: number
  ) => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ color: '#CCCCCC', fontSize: 13 }}>{label}</span>
        <span style={{ color: '#4CAF50', fontSize: 14, fontWeight: 600 }}>
          {formatTime(dayStart + value * 60 * 1000)}
        </span>
      </div>
      <div style={{ position: 'relative', height: 40 }}>
        <input
          type="range"
          min={min}
          max={max}
          step={STEP}
          value={value}
          onChange={onChange}
          style={{
            position: 'absolute',
            width: '100%',
            height: 6,
            top: 17,
            pointerEvents: 'none',
            appearance: 'none',
            background: 'transparent',
            zIndex: 3,
            WebkitAppearance: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 17,
            height: 6,
            backgroundColor: '#333333',
            borderRadius: 3,
          }}
        />
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            pointer-events: auto;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2196F3 0%, #4CAF50 100%);
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          }
          input[type="range"]::-moz-range-thumb {
            pointer-events: auto;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2196F3 0%, #4CAF50 100%);
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          }
        `}</style>
      </div>
    </div>
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        padding: 24,
        backgroundColor: '#121212',
      }}
    >
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h2 style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
          预约充电
        </h2>
        <p style={{ color: '#888888', fontSize: 13, marginBottom: 24 }}>
          {formatDate(Date.now())} 选择充电桩和时间段
        </p>

        <motion.div
          animate={shake ? { x: [-8, 8, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div>
            <label style={{ color: '#CCCCCC', fontSize: 13, marginBottom: 8, display: 'block' }}>
              选择充电桩
            </label>
            <select
              value={selectedStationId}
              onChange={(e) => {
                setSelectedStationId(e.target.value);
                setSelectedGunId('');
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: hasConflict ? '2px solid #F44336' : '2px solid #333333',
                backgroundColor: '#1E1E2E',
                color: '#FFFFFF',
                fontSize: 14,
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                if (!hasConflict) {
                  e.currentTarget.style.borderColor = '#4CAF50';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(76, 175, 80, 0.2)';
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = hasConflict ? '#F44336' : '#333333';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.availableGuns}/{s.totalGuns} 空闲)
                </option>
              ))}
            </select>
          </div>

          {selectedStation && (
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: '#1E1E2E',
                border: `2px solid ${hasConflict ? '#F44336' : '#333333'}`,
                transition: 'all 0.3s ease-in-out',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 500 }}>
                    {selectedStation.name}
                  </div>
                  <div style={{ color: '#888888', fontSize: 12, marginTop: 2 }}>
                    {selectedStation.address}
                  </div>
                </div>
                <div
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    backgroundColor: `${STATUS_COLORS[selectedStation.overallStatus]}20`,
                    color: STATUS_COLORS[selectedStation.overallStatus],
                    fontSize: 12,
                    alignSelf: 'flex-start',
                  }}
                >
                  {STATUS_LABELS[selectedStation.overallStatus]}
                </div>
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={{ color: '#CCCCCC', fontSize: 12, marginBottom: 8 }}>
                  选择充电枪：
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedStation.guns.map((gun, idx) => {
                    const available = gun.status === 'available' || gun.status === 'reserved';
                    const selected = selectedGunId === gun.id;
                    return (
                      <motion.button
                        key={gun.id}
                        whileHover={available ? { scale: 1.05 } : {}}
                        whileTap={available ? { scale: 0.95 } : {}}
                        onClick={() => available && setSelectedGunId(gun.id)}
                        disabled={!available}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 8,
                          border: selected
                            ? `2px solid #4CAF50`
                            : `2px solid ${available ? '#333333' : '#444444'}`,
                          backgroundColor: selected ? '#4CAF5020' : '#121212',
                          color: available
                            ? selected
                              ? '#4CAF50'
                              : '#FFFFFF'
                            : '#666666',
                          cursor: available ? 'pointer' : 'not-allowed',
                          fontSize: 12,
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 2,
                          minWidth: 60,
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>枪 {idx + 1}</span>
                        <span style={{ fontSize: 10, opacity: 0.8 }}>{gun.power}kW</span>
                        <span
                          style={{
                            fontSize: 9,
                            padding: '1px 6px',
                            borderRadius: 4,
                            backgroundColor: `${STATUS_COLORS[gun.status]}30`,
                            color: STATUS_COLORS[gun.status],
                          }}
                        >
                          {STATUS_LABELS[gun.status]}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              padding: 16,
              borderRadius: 12,
              backgroundColor: '#1E1E2E',
              border: `2px solid ${hasConflict ? '#F44336' : '#333333'}`,
              transition: 'all 0.3s ease-in-out',
            }}
          >
            <div style={{ marginBottom: 20 }}>
              {renderTimeSlider(
                startMinutes,
                handleStartChange,
                '开始时间',
                Math.ceil((new Date().getHours() * 60 + new Date().getMinutes()) / STEP) * STEP,
                24 * 60 - STEP * 2
              )}
            </div>
            <div style={{ marginBottom: 16 }}>
              {renderTimeSlider(
                endMinutes,
                handleEndChange,
                '结束时间',
                startMinutes + STEP,
                24 * 60 - STEP
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderTop: '1px solid #333333',
              }}
            >
              <span style={{ color: '#888888', fontSize: 13 }}>预约时长</span>
              <span style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 500 }}>
                {Math.floor(duration / 60) > 0 ? `${Math.floor(duration / 60)}小时` : ''}
                {duration % 60 > 0 ? ` ${duration % 60}分钟` : ''}
                {duration > MAX_DURATION && (
                  <span style={{ color: '#F44336', marginLeft: 8, fontSize: 11 }}>
                    超出最大120分钟
                  </span>
                )}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderTop: '1px solid #333333',
              }}
            >
              <span style={{ color: '#888888', fontSize: 13 }}>预计费用</span>
              <span style={{ color: '#FF9800', fontSize: 18, fontWeight: 600 }}>
                ¥{cost.toFixed(2)}
              </span>
            </div>

            {hasConflict && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    marginTop: 12,
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: '#F4433620',
                    border: '1px solid #F44336',
                    color: '#F44336',
                    fontSize: 12,
                  }}
                >
                  ⚠ 所选时间段与其他预约冲突，请重新选择
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: '#F4433620',
                  border: '1px solid #F44336',
                  color: '#F44336',
                  fontSize: 13,
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: 'flex', gap: 12 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              style={{
                flex: 1,
                padding: '14px 20px',
                borderRadius: 10,
                border: '2px solid #333333',
                backgroundColor: 'transparent',
                color: '#FFFFFF',
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              返回地图
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={submitting || hasConflict || duration > MAX_DURATION || duration <= 0}
              style={{
                flex: 2,
                padding: '14px 20px',
                borderRadius: 10,
                border: 'none',
                background:
                  submitting || hasConflict || duration > MAX_DURATION || duration <= 0
                    ? '#555555'
                    : 'linear-gradient(135deg, #2196F3 0%, #4CAF50 100%)',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 600,
                cursor:
                  submitting || hasConflict || duration > MAX_DURATION || duration <= 0
                    ? 'not-allowed'
                    : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {submitting ? '提交中...' : '确认预约'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
