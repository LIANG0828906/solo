import { useEffect, useState } from 'react';
import { Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HomeOutlined, PlusOutlined } from '@ant-design/icons';

function ThankYou() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="qv-thanks-wrap anim-fade-simple">
      <div className="qv-thanks-card">
        <div className="qv-check-circle">
          <svg
            className="anim-check qv-check-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 12px', color: 'var(--color-text-primary)' }}>
          提交成功，感谢您的参与！
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: '0 0 28px' }}>
          您的回答已匿名记录，
          <br />
          创建者将在仪表盘上实时看到统计结果。
        </p>
        <Space size="middle" direction="vertical" style={{ width: '100%' }}>
          <Button
            type="primary"
            size="large"
            icon={<HomeOutlined />}
            onClick={() => navigate('/')}
            style={{ borderRadius: 20, width: '100%', height: 44, fontWeight: 500 }}
          >
            返回首页
          </Button>
          <Button
            icon={<PlusOutlined />}
            onClick={() => navigate('/create')}
            style={{ borderRadius: 20, width: '100%', height: 44 }}
          >
            创建自己的投票
          </Button>
        </Space>
        <div style={{ marginTop: 24, fontSize: 12, color: 'var(--color-text-hint)' }}>
          {countdown > 0 ? `${countdown} 秒后自动返回首页` : ''}
        </div>
      </div>
    </div>
  );
}

export default ThankYou;
