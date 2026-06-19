import React, { useState, useMemo } from 'react';
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
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
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

  const handleNext = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentCard((prev) => (prev + 1) % insights.length);
      setIsFlipping(false);
    }, 300);
  };

  const handlePrev = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentCard((prev) => (prev - 1 + insights.length) % insights.length);
      setIsFlipping(false);
    }, 300);
  };

  const handleShare = () => {
    setIsFlying(true);
    setTimeout(() => {
      alert('分享功能开发中...');
      setIsFlying(false);
    }, 800);
  };

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

  const currentInsight = insights[currentCard];
  const isWeekdayInsight = currentInsight.type === 'weekday';
  const config = isWeekdayInsight ? MOOD_CONFIGS[currentInsight.mood] : null;

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
          style={{
            padding: '12px 24px',
            borderRadius: '20px',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
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
          disabled={isFlipping}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
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
            transition: 'transform 0.6s ease',
            animation: isFlying ? 'flyAway 0.8s ease forwards' : 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '24px',
              background: config
                ? `linear-gradient(135deg, ${config.color}, #764ba2)`
                : 'linear-gradient(135deg, #667eea, #764ba2)',
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          />

          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '24px',
              background: 'white',
              backfaceVisibility: 'hidden',
              transform: isFlipping ? 'rotateY(-180deg)' : 'rotateY(0deg)',
              transition: 'transform 0.6s ease',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              padding: '40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '80px', marginBottom: '24px' }}>
              {isWeekdayInsight
                ? (currentInsight.mood === 'happy' ? '😊' :
                   currentInsight.mood === 'calm' ? '😌' :
                   currentInsight.mood === 'excited' ? '🤩' :
                   currentInsight.mood === 'sad' ? '😢' :
                   currentInsight.mood === 'angry' ? '😠' : '😰')
                : currentInsight.icon}
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
              {currentInsight.type === 'weekday' ? 'WEEKDAY INSIGHT' : 'RECOMMENDATION'}
            </div>

            <h3
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: config?.color || '#667eea',
                marginBottom: '16px',
              }}
            >
              {currentInsight.title}
            </h3>

            <p
              style={{
                fontSize: '18px',
                color: '#555',
                lineHeight: 1.8,
                marginBottom: '24px',
              }}
            >
              {currentInsight.description}
            </p>

            {isWeekdayInsight && (
              <div
                style={{
                  padding: '8px 20px',
                  borderRadius: '20px',
                  background: `${config?.color || '#667eea'}15`,
                  color: config?.color || '#667eea',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                基于 {currentInsight.count} 次记录
              </div>
            )}

            <div
              style={{
                position: 'absolute',
                bottom: '32px',
                display: 'flex',
                gap: '8px',
              }}
            >
              {insights.map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: index === currentCard ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: index === currentCard ? (config?.color || '#667eea') : '#ddd',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleNext}
          disabled={isFlipping}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ▶
        </button>
      </div>

      <div
        style={{
          marginTop: '40px',
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
