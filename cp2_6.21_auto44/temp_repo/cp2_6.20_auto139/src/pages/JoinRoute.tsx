import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRouteStore } from '../stores/routeStore';
import { useTeamStore } from '../stores/teamStore';

export default function JoinRoute() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { currentRoute, fetchRouteByCode, loading } = useRouteStore();
  const { joinRoute, startPositionTracking } = useTeamStore();

  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (code) {
      fetchRouteByCode(code);
    }
  }, [code, fetchRouteByCode]);

  const handleJoin = async () => {
    if (!name.trim() || !currentRoute) return;

    setJoining(true);
    try {
      const member = await joinRoute(currentRoute.id, name.trim());
      setJoined(true);
      startPositionTracking(member.id, member.routeId, member.name);
      setTimeout(() => {
        navigate(`/tracker/${currentRoute.id}`);
      }, 1000);
    } catch (error) {
      console.error('加入失败:', error);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="join-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!currentRoute) {
    return (
      <div className="join-container">
        <div className="join-card">
          <h2>未找到路线</h2>
          <p>请检查路线代码是否正确</p>
          <button className="join-btn" onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="join-container">
      <div className="join-card">
        {joined ? (
          <>
            <h2>✅ 加入成功!</h2>
            <p>正在获取您的位置并开始追踪...</p>
            <div className="loading-spinner" style={{ margin: '20px auto' }} />
          </>
        ) : (
          <>
            <h2>加入探险队伍</h2>
            <p>路线: {currentRoute.name}</p>
            <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '10px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>路线代码</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#1a3c2e', letterSpacing: '6px', fontFamily: 'monospace', textAlign: 'center' }}>
                {currentRoute.code}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', fontSize: '13px', color: '#666' }}>
              <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: '#f0f4f1', borderRadius: '8px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#1a3c2e' }}>{currentRoute.points.length}</div>
                <div>点位</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: '#f0f4f1', borderRadius: '8px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#1a3c2e' }}>{currentRoute.totalDistance}km</div>
                <div>距离</div>
              </div>
            </div>
            <div className="join-form-group">
              <label>您的姓名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入您的姓名"
                maxLength={20}
              />
            </div>
            <button
              className="join-btn"
              onClick={handleJoin}
              disabled={joining || !name.trim()}
            >
              {joining ? '加入中...' : '开始追踪'}
            </button>
            <p style={{ marginTop: '16px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
              点击"开始追踪"后，系统将请求获取您的地理位置
            </p>
          </>
        )}
      </div>
    </div>
  );
}
