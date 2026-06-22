import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useOrderConfirmStore } from './store';

export default function OrderConfirm() {
  const { orderNo, items } = useOrderConfirmStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!orderNo || !items) {
      navigate('/');
    }
  }, [orderNo, items, navigate]);

  if (!orderNo || !items) {
    return null;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '64px auto', textAlign: 'center' }}>
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#C8E6C9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '40px',
          color: '#4CAF50',
        }}
      >
        ✓
      </div>
      <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
        订单提交成功！
      </h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>感谢您的信任，我们会尽快为您确认订单</p>

      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          textAlign: 'left',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '16px',
            borderBottom: '1px solid #F0F0F0',
            marginBottom: '16px',
          }}
        >
          <span style={{ color: '#666' }}>订单编号</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#8B5E3C' }}>{orderNo}</span>
        </div>

        {items.map((item, i) => (
          <div key={i} style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
              {item.productName}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
              <div style={{ color: '#666' }}>皮革：{item.leatherType}</div>
              <div style={{ color: '#666' }}>厚度：{item.thickness}mm</div>
              <div style={{ color: '#666' }}>五金：{item.hardware}</div>
              <div style={{ color: '#666' }}>
                面积：{item.estimatedArea[0]}-{item.estimatedArea[1]} dm²
              </div>
            </div>
            {item.sketchImages.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>参考草图：</span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  {item.sketchImages.map((img, j) => (
                    <img
                      key={j}
                      src={img}
                      alt=""
                      style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover' }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div
              style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px dashed #E0E0E0',
                textAlign: 'right',
              }}
            >
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#D4A574' }}>¥{item.price}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <Link
          to="/"
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            color: '#8B5E3C',
            borderRadius: '6px',
            border: '1px solid #D4A574',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s ease-out',
          }}
        >
          继续浏览
        </Link>
      </div>
    </div>
  );
}
