import React, { useState, useMemo, useEffect } from 'react';
import { MoodData, MOOD_CONFIGS, MoodType } from '../types';

interface WeekdayInsight {
  type: 'weekday';
  title: string;
  description: string;
  mood: MoodType;
  count: number;
}

interface Suggestion {
  type: 'suggestion';
  title: string;
  description: string;
  icon: string;
}

type Insight = WeekdayInsight | Suggestion;

interface ReportViewProps {
  moods?: MoodData[];
}

const ReportView: React.FC<ReportViewProps> = ({ moods = [] }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFlying, setIsFlying] = useState(false);

  const insights = useMemo<Insight[]>(() => {
    if (moods.length === 0) return [];

    const weekdayMoods: Record<number, Record<string, number>> = {};
    for (let i = 0; i < 7; i++) {
      weekdayMoods[i] = {};
    }

    moods.forEach((mood) => {
      const day = new Date(mood.timestamp).getDay();
      weekdayMoods[day][mood.type] = (weekdayMoods[day][mood.type] || 0) + 1;
    });

    const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const insightsList: WeekdayInsight[] = [];

    for (let day = 0; day < 7; day++) {
      const dayMoods = weekdayMoods[day];
      const entries = Object.entries(dayMoods).sort((a, b) => b[1] - a[1]);
      if (entries.length > 0) {
        const [topMood, count] = entries[0];
        if (count >= 2) {
          insightsList.push({
            type: 'weekday',
            title: `${weekdayNames[day]}的你`,
            description: `${weekdayNames[day]}常感到${MOOD_CONFIGS[topMood as keyof typeof MOOD_CONFIGS].label}`,
            mood: topMood as MoodType,
            count,
          });
        }
      }
    }

    const suggestions: Suggestion[] = [
      { type: 'suggestion', title: '放松练习', description: '每天花10分钟做深呼吸练习，帮助缓解焦虑情绪', icon: '🧘' },
      { type: 'suggestion', title: '运动建议', description: '每周3次有氧运动可以显著提升愉悦感', icon: '🏃' },
      { type: 'suggestion', title: '睡眠改善', description: '保持规律作息，睡前1小时远离电子设备', icon: '😴' },
      { type: 'suggestion', title: '社交互动', description: '多与朋友家人交流，分享你的感受', icon: '👥' },
    ];

    return [...insightsList.slice(0, 4), ...suggestions];
  }, [moods]);

  const totalPages = insights.length;

  const handleNext = () => {
    if (isAnimating || currentPage >= totalPages - 1) return;
    setIsAnimating(true);
    setFlipDirection('next');
    setTimeout(() => {
      setCurrentPage((prev) => prev + 1);
      setFlipDirection(null);
      setIsAnimating(false);
    }, 700);
  };

  const handlePrev = () => {
    if (isAnimating || currentPage <= 0) return;
    setIsAnimating(true);
    setFlipDirection('prev');
    setTimeout(() => {
      setCurrentPage((prev) => prev - 1);
      setFlipDirection(null);
      setIsAnimating(false);
    }, 700);
  };

  const handleShare = () => {
    setIsFlying(true);
    setTimeout(() => {
      alert('分享功能开发中...');
      setIsFlying(false);
    }, 800);
  };

  useEffect(() => {
    setCurrentPage(0);
  }, [moods]);

  if (insights.length === 0) {
    return (
      <div
        style={{
          background: 'white',
          borderRadius: '24px',
          padding: '60px',
          textAlign: 'center',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.08)',
          animation: 'fadeIn 0.5s ease',
        }}
      >
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
        <h3 style={{ fontSize: '20px', color: '#333', marginBottom: '8px' }}>暂无数据</h3>
        <p style={{ color: '#999' }}>记录更多情绪后即可生成个性化洞察报告</p>
      </div>
    );
  }

  const currentInsight = insights[currentPage];
  const nextInsight = insights[currentPage + 1] || insights[0];
  const prevInsight = insights[currentPage - 1] || insights[insights.length - 1];
  const isWeekdayInsight = currentInsight.type === 'weekday';
  const config = isWeekdayInsight ? MOOD_CONFIGS[currentInsight.mood] : null;
  const gradientColor = config?.color || '#667eea';

  const getMoodEmoji = (type: string) => {
    switch (type) {
      case 'happy': return '😊';
      case 'calm': return '😌';
      case 'excited': return '🤩';
      case 'sad': return '😢';
      case 'angry': return '😠';
      case 'anxious': return '😰';
      default: return '😊';
    }
  };

  const PageContent = ({ insight }: { insight: Insight }) => {
    const isWeekday = insight.type === 'weekday';
    const cfg = isWeekday ? MOOD_CONFIGS[insight.mood] : null;
    const color = cfg?.color || '#667eea';

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '24px',
          background: 'white',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          backfaceVisibility: 'hidden',
        }}
      >
        <div style={{ fontSize: '80px', marginBottom: '24px' }}>
          {isWeekday ? getMoodEmoji(insight.mood) : insight.icon}
        </div>

        <div
          style={{
            fontSize: '12px',
            letterSpacing: '4px',
            color: '#999',
            marginBottom: '12px',
            textTransform: 'uppercase',
          }}
        >
          {insight.type === 'weekday' ? 'WEEKDAY INSIGHT' : 'RECOMMENDATION'}
        </div>

        <h3
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color,
            marginBottom: '16px',
          }}
        >
          {insight.title}
        </h3>

        <p
          style={{
            fontSize: '18px',
            color: '#555',
            lineHeight: 1.8,
            marginBottom: '24px',
          }}
        >
          {insight.description}
        </p>

        {isWeekday && (
          <div
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              background: `${color}15`,
              color,
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            基于 {insight.count} 次记录
          </div>
        )}
      </div>
    );
  };

  const PageBack = ({ color }: { color: string }) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '24px',
        background: `linear-gradient(135deg, ${color}, #764ba2)`,
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '60px',
          opacity: 0.3,
        }}
      >
        ✦
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}
      >
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>
          情绪洞察报告
        </h2>
        <button
          onClick={handleShare}
          disabled={isFlying}
          style={{
            padding: '12px 24px',
            borderRadius: '20px',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isFlying ? 'default' : 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            opacity: isFlying ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isFlying) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          📤 分享报告
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          perspective: '1500px',
        }}
      >
        <button
          onClick={handlePrev}
          disabled={isAnimating || currentPage === 0}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            background: isAnimating || currentPage === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontSize: '20px',
            cursor: isAnimating || currentPage === 0 ? 'not-allowed' : 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            opacity: currentPage === 0 ? 0.4 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isAnimating && currentPage > 0) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ◀
        </button>

        <div
          style={{
            width: '100%',
            maxWidth: '450px',
            height: '550px',
            position: 'relative',
            transformStyle: 'preserve-3d',
            animation: isFlying ? 'flyAway 0.8s ease forwards' : 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformStyle: 'preserve-3d',
              transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
              transformOrigin: flipDirection === 'next' ? 'left center' : 'right center',
              transform:
                flipDirection === 'next'
                  ? 'rotateY(-180deg)'
                  : flipDirection === 'prev'
                  ? 'rotateY(180deg)'
                  : 'rotateY(0deg)',
              zIndex: flipDirection ? 10 : 1,
            }}
          >
            <PageContent insight={currentInsight} />
            <PageBack color={gradientColor} />
          </div>

          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformStyle: 'preserve-3d',
              zIndex: 1,
            }}
          >
            <PageContent insight={flipDirection === 'next' ? nextInsight : flipDirection === 'prev' ? prevInsight : currentInsight} />
            <PageBack color={flipDirection === 'next' 
              ? (nextInsight.type === 'weekday' ? MOOD_CONFIGS[nextInsight.mood].color : '#667eea')
              : flipDirection === 'prev'
              ? (prevInsight.type === 'weekday' ? MOOD_CONFIGS[prevInsight.mood].color : '#667eea')
              : gradientColor
            } />
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '-40px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            {insights.map((_, index) => (
              <div
                key={index}
                style={{
                  width: index === currentPage ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: index === currentPage ? 'white' : 'rgba(255, 255, 255, 0.4)',
                  transition: 'all 0.3s ease',
                  cursor: isAnimating ? 'default' : 'pointer',
                }}
                onClick={() => {
                  if (!isAnimating && index !== currentPage) {
                    if (index > currentPage) {
                      handleNext();
                    } else {
                      handlePrev();
                    }
                  }
                }}
              />
            ))}
            <span style={{ marginLeft: '12px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
              {currentPage + 1} / {totalPages}
            </span>
          </div>
        </div>

        <button
          onClick={handleNext}
          disabled={isAnimating || currentPage === totalPages - 1}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            background: isAnimating || currentPage === totalPages - 1 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontSize: '20px',
            cursor: isAnimating || currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            opacity: currentPage === totalPages - 1 ? 0.4 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isAnimating && currentPage < totalPages - 1) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ▶
        </button>
      </div>

      <div
        style={{
          marginTop: '60px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '24px',
          color: 'white',
          textAlign: 'center',
          animation: 'slideInUp 0.5s ease 0.3s both',
        }}
      >
        <p style={{ fontSize: '14px', opacity: 0.9 }}>
          💡 小提示：持续记录21天可以获得更精准的个性化洞察
        </p>
      </div>
    </div>
  );
};

export default ReportView;
