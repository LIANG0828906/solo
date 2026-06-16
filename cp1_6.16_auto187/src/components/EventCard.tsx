import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClockCircleOutlined, CheckCircleOutlined, TagOutlined } from '@ant-design/icons';
import { Tag, Badge } from 'antd';
import type { SportEvent } from '@/types';
import { useAppStore } from '@/store';

interface EventCardProps {
  event: SportEvent;
}

const formatCountdown = (ms: number): string => {
  if (ms <= 0) return '已开赛';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}时${m}分${s}秒`;
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
};

export default function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate();
  const getBetForEvent = useAppStore(s => s.getBetForEvent);
  const markEventLive = useAppStore(s => s.markEventLive);
  const processEventSettlement = useAppStore(s => s.processEventSettlement);
  const [now, setNow] = useState(Date.now());
  const [bounce, setBounce] = useState(false);

  const bet = getBetForEvent(event.id);
  const timeLeft = event.startTime - now;

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (event.status === 'upcoming' && timeLeft <= 0) {
      markEventLive(event.id);
      setTimeout(() => {
        void processEventSettlement(event.id);
      }, 5000);
    }
  }, [timeLeft, event.status, event.id, markEventLive, processEventSettlement]);

  const handleClick = () => {
    if (event.status === 'upcoming') {
      setBounce(true);
      setTimeout(() => setBounce(false), 500);
      setTimeout(() => navigate(`/event/${event.id}`), 250);
    } else if (event.status === 'live') {
      navigate(`/event/${event.id}`);
    } else {
      navigate(`/event/${event.id}`);
    }
  };

  const statusConfig = {
    upcoming: { text: '即将开始', color: '#1677ff' },
    live: { text: '进行中', color: '#52c41a' },
    finished: { text: '已结束', color: '#8c8c8c' },
  };

  const status = statusConfig[event.status];
  const selectedOption = bet ? event.options.find(o => o.id === bet.optionId) : null;

  return (
    <div
      className={`event-card ${bounce ? 'bounce-animation' : ''}`}
      onClick={handleClick}
      style={{
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ color: '#fff', fontSize: 18, marginBottom: 6, fontWeight: 600 }}>
            {event.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#d9d9d9', fontSize: 13 }}>
            <ClockCircleOutlined />
            <span style={{ color: timeLeft > 0 && timeLeft < 60000 ? '#ff4d4f' : '#d9d9d9' }}>
              {formatCountdown(timeLeft)}
            </span>
          </div>
        </div>
        <Badge
          status={event.status === 'upcoming' ? 'default' : event.status === 'live' ? 'processing' : 'success'}
          text={<span style={{ color: status.color }}>{status.text}</span>}
        />
      </div>

      {bet && selectedOption && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          background: bet.status === 'won' ? 'rgba(82, 196, 26, 0.15)' : bet.status === 'lost' ? 'rgba(255, 77, 79, 0.15)' : 'rgba(22, 119, 255, 0.15)',
          borderRadius: 6,
          width: 'fit-content',
        }}>
          <TagOutlined style={{
            color: bet.status === 'won' ? '#52c41a' : bet.status === 'lost' ? '#ff4d4f' : '#1677ff',
            fontSize: 12,
          }} />
          <span style={{
            fontSize: 13,
            color: bet.status === 'won' ? '#52c41a' : bet.status === 'lost' ? '#ff4d4f' : '#1677ff',
          }}>
            已投注: {selectedOption.name} ({bet.amount}分)
            {bet.status === 'won' && ' ✅'}
            {bet.status === 'lost' && ' ❌'}
          </span>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
      }}>
        {event.options.map(opt => {
          const isSelected = bet?.optionId === opt.id;
          return (
            <div
              key={opt.id}
              style={{
                padding: '10px 12px',
                background: isSelected ? 'rgba(250, 173, 20, 0.15)' : 'rgba(255,255,255,0.03)',
                border: isSelected ? '1px solid #faad14' : '1px solid #333',
                borderRadius: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 12, color: '#d9d9d9', textAlign: 'center' }}>
                {opt.name}
              </span>
              <span className="odds-gradient" style={{ fontSize: 18 }}>
                {opt.odds.toFixed(2)}
              </span>
              {isSelected && (
                <CheckCircleOutlined style={{ color: '#faad14', fontSize: 12 }} />
              )}
            </div>
          );
        })}
      </div>

      {event.status === 'finished' && event.result && (() => {
        const winning = event.options.find(o => o.id === event.result);
        return (
          <Tag color="gold" style={{ margin: 0 }}>
            结果: {winning?.name}
          </Tag>
        );
      })()}
    </div>
  );
}
