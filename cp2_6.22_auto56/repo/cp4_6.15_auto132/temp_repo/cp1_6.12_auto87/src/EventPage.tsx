import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import VotingPanel from './VotingPanel';

interface TimeSlot {
  id: string;
  label: string;
  votes: number;
}

interface Dish {
  id: string;
  name: string;
  description: string;
  image: string;
  votes: number;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  votes: number;
}

interface EventData {
  id: string;
  code: string;
  name: string;
  dateTime: string;
  location: string;
  welcomeMessage: string;
  backgroundImage: string;
  timeSlots: TimeSlot[];
  dishes: Dish[];
  songs: Song[];
  createdAt: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  ended: boolean;
}

const Countdown: React.FC<{ targetTime: string }> = ({ targetTime }) => {
  const calculateTimeLeft = useCallback((): TimeLeft => {
    const diff = new Date(targetTime).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      ended: false,
    };
  }, [targetTime]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft);
  const [flipKey, setFlipKey] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
      setFlipKey((k) => k + 1);
    }, 500);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  const FlipNumber: React.FC<{ value: number; label: string }> = ({ value, label }) => {
    const str = String(value).padStart(2, '0');
    if (timeLeft.ended) {
      return (
        <div className="countdown-item ended">
          <div className="flip-card ended-text">活动已结束</div>
        </div>
      );
    }
    return (
      <div className="countdown-item">
        <div className="flip-wrapper" key={flipKey}>
          {str.split('').map((ch, i) => (
            <div key={i} className="flip-digit">
              <div className="flip-card">
                <span className="flip-inner">{ch}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="countdown-label">{label}</div>
      </div>
    );
  };

  if (timeLeft.ended) {
    return (
      <div className="countdown-container ended-container">
        <div className="countdown-ended-banner">
          <span className="ended-icon">🎊</span>
          <span className="ended-text">活动已结束</span>
        </div>
      </div>
    );
  }

  return (
    <div className="countdown-container">
      <div className="countdown-title">⏰ 距活动开始还有</div>
      <div className="countdown-grid">
        <FlipNumber value={timeLeft.days} label="天" />
        <FlipNumber value={timeLeft.hours} label="时" />
        <FlipNumber value={timeLeft.minutes} label="分" />
        <FlipNumber value={timeLeft.seconds} label="秒" />
      </div>
    </div>
  );
};

const EventPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [voteCompleted, setVoteCompleted] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2300);
  };

  const loadEvent = useCallback(async () => {
    if (!code) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/event/${code}`);
      const data = await res.json();
      if (res.ok) {
        setEvent(data);
      } else {
        setError(data.error || '加载失败');
      }
    } catch (e) {
      setError('网络错误，请稍后刷新');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  useEffect(() => {
    if (!event) return;
    const interval = setInterval(() => {
      fetch(`/api/event/${code}`)
        .then((r) => r.json())
        .then((d) => {
          if (d && d.id) setEvent(d);
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [code, event]);

  const handleVoted = (updatedEvent: EventData) => {
    setEvent(updatedEvent);
    setVoteCompleted(true);
    showToast('投票成功！感谢参与 🎉');
  };

  if (loading) {
    return (
      <div className="page-wrapper event-page">
        <div className="card loading-card">
          <div className="loader" />
          <p>活动加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="page-wrapper event-page">
        <div className="card error-card fade-in">
          <div className="error-icon">😢</div>
          <h2>出错啦</h2>
          <p>{error || '活动不存在'}</p>
          <button className="primary-btn" onClick={() => (window.location.href = '/create')}>
            返回首页创建活动
          </button>
        </div>
      </div>
    );
  }

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="page-wrapper event-page">
      <div
        className="hero-section"
        style={{ backgroundImage: `url(${event.backgroundImage})` }}
      >
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="event-code-badge">邀请码：<span>{event.code}</span></div>
          <h1 className="hero-title">{event.name}</h1>
          <div className="hero-meta">
            <span className="meta-item">📅 {formatDateTime(event.dateTime)}</span>
            <span className="meta-item">📍 {event.location}</span>
          </div>
          <div className="welcome-card card">
            <p className="welcome-text">{event.welcomeMessage}</p>
          </div>
        </div>
      </div>

      <div className="content-area">
        <Countdown targetTime={event.dateTime} />

        <VotingPanel
          event={event}
          onVoted={handleVoted}
          voteCompleted={voteCompleted}
          onShowResults={() => setVoteCompleted(true)}
        />
      </div>

      {toast && (
        <div className="toast toast-enter">
          ✓ {toast}
        </div>
      )}
    </div>
  );
};

export default EventPage;
