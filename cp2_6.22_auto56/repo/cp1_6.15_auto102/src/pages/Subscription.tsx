import { useState, useEffect } from 'react';
import Card from '../components/Card';
import './Subscription.css';

interface GuideStep {
  id: number;
  image: string;
  description: string;
}

interface Guide {
  title: string;
  thumbnail: string;
  steps: GuideStep[];
}

interface TimelineItem {
  id: string;
  month: string;
  date: string;
  title: string;
  coverImage: string;
  isSubscribed: boolean;
  guide: Guide;
}

interface TimelineResponse {
  items: TimelineItem[];
}

interface SubscriptionProps {
  onNavigate: (page: 'dashboard' | 'subscription') => void;
}

export default function Subscription({ onNavigate }: SubscriptionProps) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/materials')
      .then(res => res.json())
      .then((data: TimelineResponse) => {
        setItems(data.items);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch materials:', err);
        setLoading(false);
      });
  }, []);

  const toggleGuide = (id: string) => {
    setExpandedGuide(prev => prev === id ? null : id);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  if (loading) {
    return (
      <div className="subscription-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="subscription">
      <div className="subscription-container">
        <button 
          className="back-btn"
          onClick={() => onNavigate('dashboard')}
          data-ripple-trigger
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
          </svg>
          返回仪表盘
        </button>

        <h1 className="subscription-title">订阅管理</h1>
        <p className="subscription-subtitle">探索每月精选主题，开启你的创作之旅</p>

        <div className="timeline">
          {items.map((item, index) => (
            <div key={item.id} className="timeline-item">
              <div className="timeline-left">
                <div className={`date-dot ${item.isSubscribed ? 'subscribed' : 'unsubscribed'}`}>
                  {item.isSubscribed ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/>
                    </svg>
                  ) : (
                    <span className="dot-number">{index + 1}</span>
                  )}
                </div>
                <div className="date-text">
                  <span className="month">{item.month}</span>
                  <span className="date">{formatDate(item.date)}</span>
                </div>
                {index < items.length - 1 && (
                  <div className={`timeline-line ${item.isSubscribed ? 'active' : ''}`}></div>
                )}
              </div>

              <div className="timeline-right">
                <Card hoverable className={`timeline-card ${item.isSubscribed ? '' : 'card-locked'}`}>
                  <div className="timeline-card-content">
                    <div className="cover-image-wrapper">
                      <img 
                        src={item.coverImage} 
                        alt={item.title}
                        className="cover-image"
                      />
                      {!item.isSubscribed && (
                        <div className="lock-overlay">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="white" opacity="0.9"/>
                          </svg>
                          <span>即将解锁</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="timeline-card-body">
                      <div className="card-header">
                        <h3 className="card-title">{item.title}</h3>
                        <span className={`status-badge ${item.isSubscribed ? 'status-active' : 'status-locked'}`}>
                          {item.isSubscribed ? '已订阅' : '待解锁'}
                        </span>
                      </div>
                      <p className="card-desc">
                        {item.isSubscribed 
                          ? '探索本月份精选材料包，跟随专业指南开启创作' 
                          : '升级订阅以解锁更多精彩内容'}
                      </p>

                      {item.isSubscribed && (
                        <div className="guide-section">
                          <button
                            className="expand-btn"
                            onClick={() => toggleGuide(item.id)}
                            data-ripple-trigger
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/>
                            </svg>
                            <span>{expandedGuide === item.id ? '收起指南' : '展开创作指南'}</span>
                            <svg 
                              className={`expand-icon ${expandedGuide === item.id ? 'expanded' : ''}`}
                              width="20" 
                              height="20" 
                              viewBox="0 0 24 24" 
                              fill="none"
                            >
                              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" fill="currentColor"/>
                            </svg>
                          </button>

                          <div 
                            className={`guide-content ${expandedGuide === item.id ? 'expanded' : ''}`}
                            style={{ maxHeight: expandedGuide === item.id ? '320px' : '0' }}
                          >
                            <div className="guide-inner">
                              <div className="guide-header">
                                <img 
                                  src={item.guide.thumbnail} 
                                  alt={item.guide.title}
                                  className="guide-thumbnail"
                                />
                                <div className="guide-info">
                                  <h4 className="guide-title">{item.guide.title}</h4>
                                  <p className="guide-steps-count">{item.guide.steps.length} 个步骤</p>
                                </div>
                              </div>
                              <div className="guide-steps">
                                {item.guide.steps.map(step => (
                                  <div key={step.id} className="guide-step">
                                    <div className="step-number">{step.id}</div>
                                    <img 
                                      src={step.image} 
                                      alt={`步骤 ${step.id}`}
                                      className="step-image"
                                    />
                                    <p className="step-desc">{step.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
