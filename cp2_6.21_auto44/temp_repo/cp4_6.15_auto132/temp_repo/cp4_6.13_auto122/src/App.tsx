import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MemberCard, { Member, MemberStatus } from './MemberCard';
import RestTimer, { WorkPeriod } from './RestTimer';

interface WSMessage {
  type: 'join' | 'status_change' | 'user_list' | 'notification' | 'user_left';
  payload: {
    userId?: string;
    nickname?: string;
    status?: MemberStatus;
    users?: Member[];
    message?: string;
  };
}

interface LocalUser {
  userId: string;
  nickname: string;
  status: MemberStatus;
}

const STORAGE_KEY = 'rest_reminder_user';
const PERIODS_KEY = 'rest_reminder_periods';

const DEFAULT_PERIODS: WorkPeriod[] = [
  { start: '09:00', end: '12:00' },
  { start: '14:00', end: '18:00' },
];

const App: React.FC = () => {
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [nicknameInput, setNicknameInput] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [workPeriods, setWorkPeriods] = useState<WorkPeriod[]>(DEFAULT_PERIODS);
  const [tempPeriods, setTempPeriods] = useState<WorkPeriod[]>(DEFAULT_PERIODS);
  const [showRestModal, setShowRestModal] = useState(false);
  const [notification, setNotification] = useState<string>('');
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const wsReadyRef = useRef(false);
  const pendingMessageRef = useRef<WSMessage[]>([]);

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    notificationTimerRef.current = setTimeout(() => {
      setNotification('');
    }, 3200);
  }, []);

  const sendWS = useCallback((msg: WSMessage) => {
    if (wsRef.current && wsReadyRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      pendingMessageRef.current.push(msg);
    }
  }, []);

  useEffect(() => {
    const rawUser = localStorage.getItem(STORAGE_KEY);
    const rawPeriods = localStorage.getItem(PERIODS_KEY);

    if (rawPeriods) {
      try {
        const parsed = JSON.parse(rawPeriods) as WorkPeriod[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWorkPeriods(parsed);
          setTempPeriods(parsed);
        }
      } catch {
        // ignore
      }
    }

    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser) as LocalUser;
        if (parsed && parsed.nickname) {
          setLocalUser(parsed);
          return;
        }
      } catch {
        // ignore
      }
    }
    setShowNameModal(true);
  }, []);

  useEffect(() => {
    if (!localUser) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const wsUrl = `${protocol}//${host}:3000/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        wsReadyRef.current = true;
        sendWS({ type: 'join', payload: { nickname: localUser.nickname } });
        pendingMessageRef.current.forEach((m) => ws.send(JSON.stringify(m)));
        pendingMessageRef.current = [];
      };

      ws.onmessage = (event) => {
        try {
          const data: WSMessage = JSON.parse(event.data);

          if (data.type === 'join' && data.payload.userId) {
            const updated: LocalUser = {
              userId: data.payload.userId,
              nickname: data.payload.nickname || localUser.nickname,
              status: data.payload.status || 'working',
            };
            setLocalUser(updated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          }

          if (data.type === 'user_list' && data.payload.users) {
            const list = data.payload.users.slice(0, 8);
            setMembers(list);
            if (localUser.userId) {
              const me = list.find((u) => u.userId === localUser.userId);
              if (me) {
                setLocalUser((prev) => (prev ? { ...prev, status: me.status } : prev));
              }
            }
          }

          if (data.type === 'notification' && data.payload.message) {
            showNotification(data.payload.message);
          }
        } catch (err) {
          console.error('WS parse error:', err);
        }
      };

      ws.onclose = () => {
        wsReadyRef.current = false;
      };

      ws.onerror = () => {
        wsReadyRef.current = false;
      };
    } catch (err) {
      console.error('WS connection error:', err);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [localUser?.nickname, sendWS, showNotification]);

  const handleConfirmNickname = () => {
    const name = nicknameInput.trim();
    if (!name) return;
    const user: LocalUser = {
      userId: '',
      nickname: name,
      status: 'working',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setLocalUser(user);
    setShowNameModal(false);
    setShowSettings(true);
  };

  const handleStatusChange = (status: MemberStatus) => {
    if (!localUser) return;
    setLocalUser({ ...localUser, status });
    sendWS({ type: 'status_change', payload: { status } });
  };

  const handleShowReminder = useCallback(() => {
    setShowRestModal(true);
  }, []);

  const handleStartRest = () => {
    setShowRestModal(false);
    handleStatusChange('resting');
    const api = (window as unknown as { __restTimer?: { startRest: () => void } }).__restTimer;
    api?.startRest();
  };

  const handleSkipRest = () => {
    setShowRestModal(false);
    const api = (window as unknown as { __restTimer?: { skip: () => void } }).__restTimer;
    api?.skip();
  };

  const updateTempPeriod = (index: number, field: 'start' | 'end', value: string) => {
    setTempPeriods((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addPeriod = () => {
    setTempPeriods((prev) => [...prev, { start: '10:00', end: '11:00' }]);
  };

  const removePeriod = (index: number) => {
    setTempPeriods((prev) => prev.filter((_, i) => i !== index));
  };

  const savePeriods = () => {
    const valid = tempPeriods.filter((p) => p.start && p.end);
    if (valid.length === 0) return;
    setWorkPeriods(valid);
    localStorage.setItem(PERIODS_KEY, JSON.stringify(valid));
    setShowSettings(false);
  };

  const displayMembers = useMemo(() => {
    if (!localUser?.userId) return members;
    const others = members.filter((m) => m.userId !== localUser.userId);
    const self: Member = {
      userId: localUser.userId,
      nickname: localUser.nickname,
      status: localUser.status,
    };
    return [self, ...others].slice(0, 8);
  }, [members, localUser]);

  return (
    <div className="app">
      {notification && (
        <div className="notification-bar show">{notification}</div>
      )}

      <header className="app-header">
        <h1 className="app-title">团队休息提醒协同面板</h1>
        <p className="app-subtitle">
          {localUser
            ? `你好，${localUser.nickname} · 保持专注，记得休息`
            : '欢迎加入，先设置你的昵称吧'}
        </p>
      </header>

      {localUser && (
        <>
          <RestTimer workPeriods={workPeriods} onShowReminder={handleShowReminder} />

          {showSettings && (
            <div className="modal-overlay" onClick={() => setShowSettings(false)}>
              <div className="name-modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="name-modal-title">设置工作时间段</h2>
                <p className="name-modal-desc">
                  只在设置的时间段内触发45分钟休息提醒
                </p>
                {tempPeriods.map((period, idx) => (
                  <div className="period-row" key={idx}>
                    <input
                      type="time"
                      value={period.start}
                      onChange={(e) => updateTempPeriod(idx, 'start', e.target.value)}
                    />
                    <span className="period-sep">—</span>
                    <input
                      type="time"
                      value={period.end}
                      onChange={(e) => updateTempPeriod(idx, 'end', e.target.value)}
                    />
                    {tempPeriods.length > 1 && (
                      <button
                        className="period-remove"
                        onClick={() => removePeriod(idx)}
                        title="删除时段"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button className="btn btn-add" onClick={addPeriod}>
                  + 添加时段
                </button>
                <button className="btn btn-primary btn-save" onClick={savePeriods}>
                  保存设置
                </button>
              </div>
            </div>
          )}

          <div className="settings-section">
            <div className="settings-title">
              <span>🕘</span>
              <span>工作时间段</span>
              <button
                className="btn btn-secondary"
                style={{ marginLeft: 'auto', minHeight: '32px', padding: '4px 14px', fontSize: '12px' }}
                onClick={() => {
                  setTempPeriods(workPeriods);
                  setShowSettings(true);
                }}
              >
                修改
              </button>
            </div>
            {workPeriods.map((p, i) => (
              <div key={i} style={{ fontSize: '13px', color: 'var(--color-text-muted)', padding: '2px 0' }}>
                {p.start} — {p.end}
              </div>
            ))}
          </div>

          <div className="members-grid">
            {displayMembers.map((member) => (
              <MemberCard
                key={member.userId}
                member={member}
                isSelf={member.userId === localUser.userId}
                onStatusChange={member.userId === localUser.userId ? handleStatusChange : undefined}
              />
            ))}
          </div>

          {showRestModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="hourglass" aria-hidden="true" />
                <h2 className="modal-title">该休息啦</h2>
                <p className="modal-text">已经工作了45分钟，起身活动一下吧</p>
                <div className="modal-actions">
                  <button className="btn btn-primary" onClick={handleStartRest}>
                    休息5分钟
                  </button>
                  <button className="btn btn-secondary" onClick={handleSkipRest}>
                    跳过
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {showNameModal && (
        <div className="modal-overlay">
          <div className="name-modal-content">
            <h2 className="name-modal-title">欢迎加入 👋</h2>
            <p className="name-modal-desc">输入你的昵称，让团队知道是你</p>
            <input
              className="name-input"
              placeholder="例如：张三"
              value={nicknameInput}
              maxLength={20}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmNickname();
              }}
              autoFocus
            />
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={handleConfirmNickname}
              disabled={!nicknameInput.trim()}
            >
              进入面板
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
