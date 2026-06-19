import React, { useState } from 'react';
import { motion } from 'framer-motion';
import useCabinetStore from '../store/useCabinetStore';

const sizeLabels = { small: '小格 (30x30cm)', medium: '中格 (45x45cm)', large: '大格 (60x60cm)' };

const durationOptions = [
  { label: '60分钟', value: 60 },
  { label: '120分钟', value: 120 },
  { label: '240分钟', value: 240 },
];

export default function CabinetDetail() {
  const { selectedCompartment, claimCompartment, openCompartment, deselectCompartment, doorOpen } = useCabinetStore();
  const [recipientPhone, setRecipientPhone] = useState('');
  const [maxDuration, setMaxDuration] = useState(60);
  const [pickupCode, setPickupCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (!selectedCompartment) return null;

  const comp = selectedCompartment;

  const handleClaim = async () => {
    if (!recipientPhone.trim()) {
      useCabinetStore.getState().addNotification('请输入收件人电话', 'warning');
      return;
    }
    setLoading(true);
    try {
      await claimCompartment(comp.cabinetId, comp.id, {
        size: comp.size,
        recipientPhone: recipientPhone.trim(),
        maxDuration,
      });
      console.log(`[短信通知] 已向收件人 ${recipientPhone} 发送取件通知`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async () => {
    if (!pickupCode.trim()) {
      useCabinetStore.getState().addNotification('请输入取件码', 'warning');
      return;
    }
    if (comp.lockedUntil && new Date(comp.lockedUntil) > new Date()) {
      useCabinetStore.getState().addNotification('格口已被锁定，请稍后再试', 'error');
      return;
    }
    setLoading(true);
    try {
      await openCompartment(comp.cabinetId, comp.id, pickupCode.trim());
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = comp.status === 'available'
    ? '空闲'
    : comp.status === 'occupied'
    ? '已占用'
    : comp.status === 'overdue'
    ? '超时'
    : '已锁定';

  const statusColor = comp.status === 'available'
    ? '#27AE60'
    : comp.status === 'overdue'
    ? '#E74C3C'
    : '#666';

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: 24,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        height: 'fit-content',
        position: 'sticky',
        top: 80,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>
          {comp.cabinetName} · 格口详情
        </h3>
        <button
          onClick={deselectCompartment}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            color: '#999',
            padding: 4,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 500,
        marginBottom: 16,
        background: comp.status === 'available' ? '#E8F8F0' : comp.status === 'overdue' ? '#FDEDEC' : '#F2F3F4',
        color: statusColor,
      }}>
        {statusLabel}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 12, background: '#F8F9FA', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>格口编号</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{comp.id}</div>
        </div>
        <div style={{ padding: 12, background: '#F8F9FA', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>尺寸</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{sizeLabels[comp.size]}</div>
        </div>
      </div>

      <div style={{
        position: 'relative',
        height: 100,
        marginBottom: 20,
        borderRadius: 8,
        overflow: 'hidden',
        background: '#2C3E50',
      }}>
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          width: 30,
          height: 80,
          background: '#34495E',
          borderRadius: 4,
          transition: 'transform 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
          transform: doorOpen ? 'perspective(200px) rotateY(-70deg)' : 'perspective(200px) rotateY(0deg)',
          transformOrigin: 'left center',
          boxShadow: doorOpen ? '4px 0 12px rgba(0,0,0,0.3)' : 'none',
        }}>
          <div style={{
            position: 'absolute',
            right: 4,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#E67E22',
          }} />
        </div>
        <div style={{
          position: 'absolute',
          top: 10,
          left: 50,
          right: 10,
          height: 80,
          background: '#1A252F',
          borderRadius: '0 4px 4px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: doorOpen ? '#27AE60' : '#555',
          fontSize: 13,
          fontWeight: 500,
        }}>
          {doorOpen ? '请取走包裹' : '柜门关闭'}
        </div>
      </div>

      {comp.status === 'available' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#333', marginBottom: 8 }}>
              最长寄存时间
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {durationOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMaxDuration(opt.value)}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    border: `2px solid ${maxDuration === opt.value ? '#3498DB' : '#DDD'}`,
                    borderRadius: 8,
                    background: maxDuration === opt.value ? '#EBF5FB' : '#fff',
                    color: maxDuration === opt.value ? '#3498DB' : '#666',
                    fontWeight: maxDuration === opt.value ? 600 : 400,
                    cursor: 'pointer',
                    fontSize: 13,
                    transition: 'all 0.2s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#333', marginBottom: 8 }}>
              收件人电话
            </label>
            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="请输入收件人手机号"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '2px solid #DDD',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#3498DB'; }}
              onBlur={(e) => { e.target.style.borderColor = '#DDD'; }}
            />
          </div>

          <button
            onClick={handleClaim}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 0',
              background: loading ? '#AED6F1' : '#3498DB',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? '处理中...' : '确认寄存'}
          </button>
        </div>
      )}

      {(comp.status === 'occupied' || comp.status === 'overdue') && (
        <div>
          {comp.pickupCode && (
            <div style={{
              padding: 16,
              background: '#FEF9E7',
              borderRadius: 8,
              marginBottom: 16,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>取件码</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#E67E22', letterSpacing: 8 }}>
                {comp.pickupCode}
              </div>
            </div>
          )}

          {comp.storedAt && (
            <div style={{ padding: 12, background: '#F8F9FA', borderRadius: 8, marginBottom: 12, fontSize: 13, color: '#666' }}>
              寄存时间: {new Date(comp.storedAt).toLocaleString('zh-CN')}
              {comp.maxDuration ? ` · 最长${comp.maxDuration}分钟` : ''}
            </div>
          )}

          {comp.lockedUntil && new Date(comp.lockedUntil) > new Date() && (
            <div style={{
              padding: 12,
              background: '#FDEDEC',
              borderRadius: 8,
              marginBottom: 12,
              fontSize: 13,
              color: '#E74C3C',
            }}>
              格口已被锁定，解锁时间: {new Date(comp.lockedUntil).toLocaleTimeString('zh-CN')}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#333', marginBottom: 8 }}>
              输入取件码
            </label>
            <input
              type="text"
              maxLength={4}
              value={pickupCode}
              onChange={(e) => setPickupCode(e.target.value.replace(/\D/g, ''))}
              placeholder="请输入4位数字取件码"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '2px solid #DDD',
                borderRadius: 8,
                fontSize: 18,
                textAlign: 'center',
                letterSpacing: 8,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#E67E22'; }}
              onBlur={(e) => { e.target.style.borderColor = '#DDD'; }}
            />
          </div>

          <button
            onClick={handleOpen}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 0',
              background: loading ? '#F5CBA7' : '#E67E22',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? '验证中...' : '取件开箱'}
          </button>
        </div>
      )}
    </motion.div>
  );
}
