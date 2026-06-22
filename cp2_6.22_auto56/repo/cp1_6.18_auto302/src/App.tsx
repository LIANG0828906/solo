import { useEffect, useState } from 'react';
import { useAppStore } from './store';
import { socketClient } from './socketClient';
import MapView from './mapView';
import Sidebar from './sidebar';
import './App.css';

function App() {
  const {
    role,
    tourGroup,
    sidebarCollapsed,
    setRole,
    setTourGroup,
    setCurrentMemberId,
    updateMember,
    setMemberPulse,
    setRollCallActive,
    setMemberMissing,
    clearMissingWarnings,
    setMembersOnlineStatus,
  } = useAppStore();

  const [groupName, setGroupName] = useState('');
  const [groupDate, setGroupDate] = useState('');
  const [memberCount, setMemberCount] = useState(10);
  const [joinCode, setJoinCode] = useState('');
  const [memberName, setMemberName] = useState('');
  const [error, setError] = useState('');
  const [showRollCallAlert, setShowRollCallAlert] = useState(false);

  useEffect(() => {
    socketClient.connect();

    const handleMemberUpdate = (member: any) => {
      updateMember(member);
    };

    const handleRollCallStarted = (endTime: number) => {
      setRollCallActive(true, endTime);
      if (role === 'member') {
        setShowRollCallAlert(true);
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        }
      }
    };

    const handleRollCallResponse = (memberId: string) => {
      setMemberPulse(memberId, true);
      setTimeout(() => {
        setMemberPulse(memberId, false);
      }, 3000);
    };

    const handleRollCallEnded = (missingMemberIds: string[]) => {
      setRollCallActive(false);
      missingMemberIds.forEach((id) => {
        setMemberMissing(id, true);
      });
    };

    const handleMissingWarningsCleared = () => {
      clearMissingWarnings();
    };

    const handleOnlineMembersUpdate = (onlineMemberIds: string[]) => {
      setMembersOnlineStatus(onlineMemberIds);
    };

    socketClient.onMemberUpdate(handleMemberUpdate);
    socketClient.onRollCallStarted(handleRollCallStarted);
    socketClient.onRollCallResponse(handleRollCallResponse);
    socketClient.onRollCallEnded(handleRollCallEnded);
    socketClient.onMissingWarningsCleared(handleMissingWarningsCleared);
    socketClient.onOnlineMembersUpdate(handleOnlineMembersUpdate);

    return () => {
      socketClient.offMemberUpdate(handleMemberUpdate);
      socketClient.offRollCallStarted(handleRollCallStarted);
      socketClient.offRollCallResponse(handleRollCallResponse);
      socketClient.offRollCallEnded(handleRollCallEnded);
      socketClient.offMissingWarningsCleared(handleMissingWarningsCleared);
      socketClient.offOnlineMembersUpdate(handleOnlineMembersUpdate);
      socketClient.disconnect();
    };
  }, [role, updateMember, setMemberPulse, setRollCallActive, setMemberMissing, clearMissingWarnings, setMembersOnlineStatus]);

  const handleCreateGroup = async () => {
    setError('');
    try {
      const group = await socketClient.createTourGroup({
        name: groupName,
        date: groupDate,
        memberCount,
      });
      setTourGroup(group);
      setRole('leader');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleJoinGroup = async () => {
    setError('');
    try {
      const result = await socketClient.joinGroup({
        joinCode: joinCode.toUpperCase(),
        memberName,
      });
      setTourGroup(result.group);
      setCurrentMemberId(result.member.id);
      setRole('member');
      startLocationTracking(result.member.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startLocationTracking = (memberId: string) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    const sendPosition = (position: GeolocationPosition) => {
      socketClient.updatePosition({
        memberId,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    };

    const watchId = navigator.geolocation.watchPosition(
      sendPosition,
      (err) => console.error('Geolocation error:', err),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
    );

    navigator.geolocation.getCurrentPosition(sendPosition);

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  };

  const handleRollCallConfirm = () => {
    const memberId = useAppStore.getState().currentMemberId;
    const group = useAppStore.getState().tourGroup;
    if (memberId && group) {
      socketClient.respondRollCall(memberId, group.id);
    }
    setShowRollCallAlert(false);
  };

  const renderLanding = () => (
    <div className="landing-container">
      <div className="landing-card">
        <h1 className="landing-title">旅行团实时定位系统</h1>
        <p className="landing-subtitle">实时追踪团友位置，点名更高效</p>

        {error && <div className="error-message">{error}</div>}

        <div className="role-tabs">
          <button
            className={`role-tab ${!role || role === 'leader' ? 'active' : ''}`}
            onClick={() => { setRole('leader'); setError(''); }}
          >
            我是领队
          </button>
          <button
            className={`role-tab ${role === 'member' ? 'active' : ''}`}
            onClick={() => { setRole('member'); setError(''); }}
          >
            我是团员
          </button>
        </div>

        {(!role || role === 'leader') && (
          <div className="form-section">
            <h2 className="form-title">创建旅行团</h2>
            <div className="form-group">
              <label>团名</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="请输入旅行团名称"
              />
            </div>
            <div className="form-group">
              <label>日期</label>
              <input
                type="date"
                value={groupDate}
                onChange={(e) => setGroupDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>人数 (5-30人)</label>
              <input
                type="number"
                min="5"
                max="30"
                value={memberCount}
                onChange={(e) => setMemberCount(Math.min(30, Math.max(5, parseInt(e.target.value) || 5)))}
              />
            </div>
            <button className="primary-btn" onClick={handleCreateGroup}>
              创建旅行团
            </button>
          </div>
        )}

        {role === 'member' && (
          <div className="form-section">
            <h2 className="form-title">加入旅行团</h2>
            <div className="form-group">
              <label>加入码</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="请输入6位加入码"
                maxLength={6}
              />
            </div>
            <div className="form-group">
              <label>您的姓名</label>
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="请输入您的姓名"
              />
            </div>
            <button className="primary-btn" onClick={handleJoinGroup}>
              加入旅行团
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderApp = () => (
    <div className="app-container">
      {role === 'leader' && <Sidebar />}
      <div
        className="map-container"
        style={{
          marginLeft: role === 'leader' ? (sidebarCollapsed ? '0px' : '260px') : '0',
          transition: 'margin-left 0.3s ease-in-out',
        }}
      >
        <MapView />
      </div>

      {showRollCallAlert && (
        <div className="rollcall-modal-overlay">
          <div className="rollcall-modal">
            <h2>📢 领队点名</h2>
            <p>领队正在点名，请点击确认</p>
            <button className="primary-btn" onClick={handleRollCallConfirm}>
              确认收到
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (!tourGroup) {
    return renderLanding();
  }

  return renderApp();
}

export default App;
