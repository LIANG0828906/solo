import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div className="not-found-container" style={{ animation: 'fadeIn 0.5s ease' }}>
      <div className="not-found-code">404</div>
      <div className="not-found-message">误入桃源深处</div>
      <p className="not-found-description">
        此页面已迷失在水墨丹青之间，不知身在何处。
        <br />
        不如归去，重返雅集。
      </p>
      <div style={{ display: 'flex', gap: '16px' }}>
        <button className="btn btn-primary" onClick={handleBack}>
          返回雅集
        </button>
        <button className="btn" onClick={() => window.history.back()}>
          返回上页
        </button>
      </div>
      <div style={{ marginTop: '60px', fontSize: '5rem', opacity: 0.1 }}>
        🎨
      </div>
    </div>
  );
};

export default NotFound;
