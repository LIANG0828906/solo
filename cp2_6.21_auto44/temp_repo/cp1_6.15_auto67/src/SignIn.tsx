import React, { useState, useEffect, useRef } from 'react';
import { Event } from './types';

interface SignInProps {
  events: Event[];
  onSignIn: (eventId: string, participantId: string) => Promise<boolean>;
}

interface CountdownState {
  eventId: string;
  participantId: string;
  count: number;
  eventName: string;
  phase: 'counting' | 'signing';
}

const SignIn: React.FC<SignInProps> = ({ events, onSignIn }) => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [participantPhone, setParticipantPhone] = useState('');
  const [foundParticipant, setFoundParticipant] = useState<any>(null);
  const [countdown, setCountdown] = useState<CountdownState | null>(null);
  const [error, setError] = useState('');
  const signInAttemptedRef = useRef(false);

  const enrolledEvents = events.filter(e => e.participants.length > 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSearch = () => {
    setError('');
    setFoundParticipant(null);
    
    if (!selectedEvent) {
      setError('请先选择一个活动');
      return;
    }
    
    if (!participantPhone) {
      setError('请输入报名时使用的手机号');
      return;
    }

    const participant = selectedEvent.participants.find(
      p => p.phone === participantPhone
    );

    if (!participant) {
      setError('未找到该手机号的报名记录');
      return;
    }

    setFoundParticipant({ ...participant, eventId: selectedEvent.id });
  };

  const handleSignInClick = () => {
    if (!foundParticipant) return;
    if (countdown) return;

    signInAttemptedRef.current = false;
    setCountdown({
      eventId: foundParticipant.eventId,
      participantId: foundParticipant.id,
      count: 3,
      eventName: selectedEvent?.name || '',
      phase: 'counting',
    });
  };

  useEffect(() => {
    if (!countdown) return;

    if (countdown.phase === 'counting' && countdown.count > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => {
          if (!prev) return null;
          const nextCount = prev.count - 1;
          if (nextCount > 0) {
            return { ...prev, count: nextCount };
          } else {
            return { ...prev, count: 0, phase: 'signing' };
          }
        });
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (countdown.phase === 'signing' && !signInAttemptedRef.current) {
      signInAttemptedRef.current = true;
      
      const { eventId, participantId } = countdown;
      
      onSignIn(eventId, participantId).then(() => {
        setCountdown(null);
        setFoundParticipant(null);
        setParticipantPhone('');
        
        const updatedEvent = events.find(e => e.id === eventId);
        if (updatedEvent && selectedEvent?.id === eventId) {
          setSelectedEvent(updatedEvent);
        }
      });
    }
  }, [countdown, onSignIn, selectedEvent, events]);

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    setFoundParticipant(null);
    setParticipantPhone('');
    setError('');
  };

  const isToday = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  };

  const isPast = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today;
  };

  const isPulsing = countdown && countdown.eventId === foundParticipant?.eventId;

  return (
    <div>
      <div className="manage-header">
        <h2 style={{ color: '#3B4A6B' }}>活动签到</h2>
      </div>

      {!selectedEvent ? (
        <div className="manage-list">
          {enrolledEvents.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📝</div>
              <p>暂无需要签到的活动</p>
            </div>
          ) : (
            enrolledEvents.map(event => {
              const signedInCount = event.participants.filter(p => p.signedIn).length;
              const past = isPast(event.date);
              const today = isToday(event.date);

              return (
                <div
                  key={event.id}
                  className="event-manage-card"
                  onClick={() => !past && handleEventSelect(event)}
                  style={{
                    opacity: past ? 0.6 : 1,
                    cursor: past ? 'not-allowed' : 'pointer',
                  }}
                >
                  <h3 style={{ color: '#3B4A6B', marginBottom: '8px' }}>{event.name}</h3>
                  <p style={{ color: '#666', marginBottom: '4px' }}>
                    📅 {formatDate(event.date)} {today && <span style={{ color: '#FF6B6B', marginLeft: '8px' }}>今天</span>}
                    {past && <span style={{ color: '#999', marginLeft: '8px' }}>已结束</span>}
                  </p>
                  <p style={{ color: '#666' }}>
                    已签到 {signedInCount} / {event.participants.length} 人
                  </p>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div>
          <button
            className="back-btn"
            style={{ marginBottom: '20px' }}
            onClick={() => {
              setSelectedEvent(null);
              setFoundParticipant(null);
              setParticipantPhone('');
              setError('');
            }}
          >
            ← 返回活动列表
          </button>

          <div className="form-card">
            <h3 style={{ color: '#3B4A6B', marginBottom: '20px' }}>
              {selectedEvent.name} - 签到
            </h3>
            
            <div className="form-group">
              <label>请输入报名手机号</label>
              <input
                type="tel"
                placeholder="请输入手机号"
                value={participantPhone}
                onChange={(e) => setParticipantPhone(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            {error && (
              <p style={{ color: '#e74c3c', marginBottom: '16px', fontSize: '0.9rem' }}>
                {error}
              </p>
            )}

            <button
              className="btn btn-accent"
              onClick={handleSearch}
              style={{ marginBottom: '20px' }}
            >
              查询报名信息
            </button>

            {foundParticipant && (
              <div
                className={`event-card ${foundParticipant.signedIn ? 'signed-in' : ''}`}
                style={{ marginTop: '20px' }}
              >
                <h3>报名信息</h3>
                <div className="event-info">
                  <p><span className="icon">👤</span> {foundParticipant.name}</p>
                  <p><span className="icon">📱</span> {foundParticipant.phone}</p>
                  <p>
                    <span className="icon">✅</span>
                    签到状态：
                    <span
                      className={`status-badge ${foundParticipant.signedIn ? 'status-signed' : 'status-pending'}`}
                      style={{ marginLeft: '8px' }}
                    >
                      {foundParticipant.signedIn ? '已签到' : '待签到'}
                    </span>
                  </p>
                </div>
                
                {!foundParticipant.signedIn && (
                  <button
                    className={`btn btn-accent ${isPulsing ? 'btn-pulse' : ''}`}
                    onClick={handleSignInClick}
                    disabled={countdown !== null}
                  >
                    {countdown && countdown.eventId === foundParticipant.eventId
                      ? countdown.phase === 'signing'
                        ? '签到中...'
                        : `签到确认中... (${countdown.count})`
                      : '确认签到'}
                  </button>
                )}
                
                {foundParticipant.signedIn && (
                  <button className="btn btn-success" disabled>
                    ✓ 已签到
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {countdown && (
        <div className="countdown-overlay">
          <div className="countdown-content">
            <p style={{ marginBottom: '16px', color: '#666' }}>
              正在为 <strong>{countdown.eventName}</strong> 签到
            </p>
            <div
              key={countdown.phase === 'counting' ? countdown.count : 'signing'}
              className="countdown-number"
              style={{
                fontSize: countdown.phase === 'signing' ? '2rem' : '4rem',
              }}
            >
              {countdown.phase === 'counting' ? countdown.count : '签到中...'}
            </div>
            <p style={{ marginTop: '16px', color: '#888' }}>
              {countdown.phase === 'counting' ? '请稍候...' : '正在处理...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignIn;
