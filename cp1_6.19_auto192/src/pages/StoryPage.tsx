import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { pourMethodLabels } from '../types';
import {
  formatBrewTime,
  getBestDrinkingWindow,
  formatCountdown,
} from '../utils/qrGenerator';

interface StoryPageProps {
  recordId: string;
}

export const StoryPage = ({ recordId }: StoryPageProps) => {
  const { beans, brewRecords } = useStore();
  const [countdown, setCountdown] = useState<number>(0);
  const [isActive, setIsActive] = useState(false);

  const record = brewRecords.find((r) => r.id === recordId);
  const bean = beans.find((b) => b.id === record?.beanId);

  useEffect(() => {
    if (!record) return;

    const updateCountdown = () => {
      const window = getBestDrinkingWindow(record.createdAt);
      setCountdown(window.remaining);
      setIsActive(window.isActive);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [record]);

  if (!record || !bean) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F5E6CC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6D4C41',
        }}
      >
        <p>未找到该冲煮记录</p>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5E6CC',
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: "'Source Serif Pro', serif",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0px 8px 32px rgba(0,0,0,0.08)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              color: '#4E342E',
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
            }}
          >
            {bean.name}
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#8D6E63' }}>
            {bean.origin}
          </p>
        </div>

        <div
          style={{
            padding: 20,
            borderRadius: 12,
            backgroundColor: isActive ? '#E8F5E9' : '#FFF3E0',
            marginBottom: 24,
            textAlign: 'center',
            transition: 'background-color 0.3s ease',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: isActive ? '#2E7D32' : '#E65100',
              marginBottom: 4,
            }}
          >
            {isActive ? '✨ 最佳饮用时间内' : '⏱️ 距离最佳饮用时间'}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 700,
              color: isActive ? '#2E7D32' : '#E65100',
              fontFamily: "'Playfair Display', serif",
            }}
          >
            {formatCountdown(countdown)}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#8D6E63' }}>
            冲煮于 {formatDate(record.createdAt)}
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3
            style={{
              margin: '0 0 16px 0',
              fontSize: 14,
              color: '#4E342E',
              fontWeight: 600,
              paddingBottom: 8,
              borderBottom: '1px solid #E0D5C7',
            }}
          >
            咖啡豆档案
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            <div>
              <span style={{ color: '#A1887F' }}>产地</span>
              <p style={{ margin: '2px 0 0 0', color: '#4E342E' }}>{bean.origin}</p>
            </div>
            <div>
              <span style={{ color: '#A1887F' }}>海拔</span>
              <p style={{ margin: '2px 0 0 0', color: '#4E342E' }}>{bean.altitude}m</p>
            </div>
            <div>
              <span style={{ color: '#A1887F' }}>处理法</span>
              <p style={{ margin: '2px 0 0 0', color: '#4E342E' }}>{bean.processMethod}</p>
            </div>
            <div>
              <span style={{ color: '#A1887F' }}>烘焙度</span>
              <p style={{ margin: '2px 0 0 0', color: '#4E342E' }}>{bean.roastLevel}</p>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <span style={{ color: '#A1887F', fontSize: 13 }}>风味特征</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {bean.flavorTags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    borderRadius: 12,
                    backgroundColor: '#F5E6CC',
                    color: '#6D4C41',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3
            style={{
              margin: '0 0 16px 0',
              fontSize: 14,
              color: '#4E342E',
              fontWeight: 600,
              paddingBottom: 8,
              borderBottom: '1px solid #E0D5C7',
            }}
          >
            冲煮参数
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            <div>
              <span style={{ color: '#A1887F' }}>咖啡粉量</span>
              <p style={{ margin: '2px 0 0 0', color: '#4E342E', fontWeight: 600 }}>
                {record.coffeeAmount}g
              </p>
            </div>
            <div>
              <span style={{ color: '#A1887F' }}>水量</span>
              <p style={{ margin: '2px 0 0 0', color: '#4E342E', fontWeight: 600 }}>
                {record.waterAmount}ml
              </p>
            </div>
            <div>
              <span style={{ color: '#A1887F' }}>水温</span>
              <p style={{ margin: '2px 0 0 0', color: '#4E342E', fontWeight: 600 }}>
                {record.waterTemp}°C
              </p>
            </div>
            <div>
              <span style={{ color: '#A1887F' }}>研磨度</span>
              <p style={{ margin: '2px 0 0 0', color: '#4E342E', fontWeight: 600 }}>
                {record.grindSize}
              </p>
            </div>
            <div>
              <span style={{ color: '#A1887F' }}>冲煮时间</span>
              <p style={{ margin: '2px 0 0 0', color: '#4E342E', fontWeight: 600 }}>
                {formatBrewTime(record.brewTime)}
              </p>
            </div>
            <div>
              <span style={{ color: '#A1887F' }}>注水方式</span>
              <p style={{ margin: '2px 0 0 0', color: '#4E342E', fontWeight: 600 }}>
                {pourMethodLabels[record.pourMethod]}
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3
            style={{
              margin: '0 0 16px 0',
              fontSize: 14,
              color: '#4E342E',
              fontWeight: 600,
              paddingBottom: 8,
              borderBottom: '1px solid #E0D5C7',
            }}
          >
            咖啡师评分
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#FF8F00' }}>
                ★ {record.rating.overall}
              </div>
              <div style={{ fontSize: 11, color: '#A1887F' }}>总分</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#6D4C41' }}>
                {record.rating.acidity}
              </div>
              <div style={{ fontSize: 11, color: '#A1887F' }}>酸度</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#6D4C41' }}>
                {record.rating.sweetness}
              </div>
              <div style={{ fontSize: 11, color: '#A1887F' }}>甜度</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#6D4C41' }}>
                {record.rating.aroma}
              </div>
              <div style={{ fontSize: 11, color: '#A1887F' }}>香气</div>
            </div>
          </div>
        </div>

        <div>
          <h3
            style={{
              margin: '0 0 12px 0',
              fontSize: 14,
              color: '#4E342E',
              fontWeight: 600,
              paddingBottom: 8,
              borderBottom: '1px solid #E0D5C7',
            }}
          >
            咖啡师品鉴笔记
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#5D4037', lineHeight: 1.8 }}>
            {record.notes}
          </p>
        </div>
      </div>

      <p style={{ marginTop: 24, fontSize: 11, color: '#A1887F' }}>
        Brew Journal · 用心记录每一杯咖啡的故事
      </p>
    </div>
  );
};
