import React, { useState } from 'react';
import { Material } from '@/types';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';

interface MaterialCardProps {
  material: Material;
  onSupported: () => void;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ material, onSupported }) => {
  const { request } = useApi();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const progress = Math.min((material.current_quantity / material.target_quantity) * 100, 100);
  const gradientStart = '#E74C3C';
  const gradientEnd = '#27AE60';

  const handleSupport = async () => {
    if (!user) {
      setMessage('请先登录后再支持');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await request(`/api/materials/${material.id}/support`, {
        method: 'POST',
        body: JSON.stringify({ quantity }),
      });
      setMessage('支持成功！感谢您的贡献');
      onSupported();
    } catch (err: any) {
      setMessage(err.message || '支持失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '20px',
      border: '2px solid #E8DCC8',
      marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>{material.name}</h4>
          <p style={{ fontSize: '14px', color: '#666' }}>规格：{material.specs}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', color: '#8B5E3C', marginBottom: '4px' }}>截止日期</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
            {new Date(material.deadline).toLocaleDateString('zh-CN')}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            当前进度：<span style={{ fontWeight: '600', color: '#E67E22' }}>{material.current_quantity}</span> / {material.target_quantity}
          </span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#E67E22' }}>{progress.toFixed(1)}%</span>
        </div>
        <div style={{
          height: '12px',
          background: '#F0EDE8',
          borderRadius: '6px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            background: `linear-gradient(to right, ${gradientStart}, ${gradientEnd})`,
            borderRadius: '6px',
            width: `${progress}%`,
            transition: 'width 0.5s ease-out',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[1, 2, 5].map((num) => (
            <button
              key={num}
              onClick={() => setQuantity(num)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                border: quantity === num ? '2px solid #E67E22' : '2px solid #E8DCC8',
                background: quantity === num ? '#FFF5E6' : '#fff',
                color: quantity === num ? '#E67E22' : '#666',
                fontWeight: quantity === num ? '600' : 'normal',
              }}
            >
              {num} 份
            </button>
          ))}
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            style={{
              width: '80px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '2px solid #E8DCC8',
              fontSize: '14px',
              textAlign: 'center',
            }}
          />
        </div>
        <button
          onClick={handleSupport}
          disabled={loading}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            background: loading ? '#F5B77A' : '#E67E22',
            color: '#fff',
            fontSize: '15px',
            fontWeight: '600',
          }}
        >
          {loading ? '处理中...' : '支持众筹'}
        </button>
      </div>
      {message && (
        <p style={{
          marginTop: '12px',
          fontSize: '14px',
          color: message.includes('成功') ? '#27AE60' : '#E74C3C',
        }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default MaterialCard;
