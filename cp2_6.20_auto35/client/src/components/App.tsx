import React, { useState } from 'react';
import { MoodData } from '../types';
import Sidebar from './Sidebar';
import MoodRecordForm from './MoodRecordForm';
import MoodCardGroup from './MoodCardGroup';
import CalendarView from './CalendarView';
import AnalysisView from './AnalysisView';
import ReportView from './ReportView';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('record');
  const [moods, setMoods] = useState<MoodData[]>([
    {
      id: '1',
      type: 'happy',
      intensity: 8,
      description: '今天完成了一个重要的项目，很有成就感！',
      tags: ['work'],
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '2',
      type: 'calm',
      intensity: 6,
      description: '晚上读了一本好书，感觉很放松',
      tags: ['social'],
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '3',
      type: 'excited',
      intensity: 9,
      description: '周末要去旅行啦！',
      tags: ['family'],
      timestamp: new Date().toISOString(),
    },
    {
      id: '4',
      type: 'anxious',
      intensity: 5,
      description: '会议准备有点紧张',
      tags: ['work'],
      timestamp: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: '5',
      type: 'happy',
      intensity: 7,
      description: '和朋友聚餐很开心',
      tags: ['social', 'exercise'],
      timestamp: new Date(Date.now() - 259200000).toISOString(),
    },
  ]);

  const handleNewMood = (newMood: MoodData) => {
    setMoods((prev) => [newMood, ...prev]);
  };

  const moodsByDate = moods.reduce((acc, mood) => {
    const date = mood.timestamp.slice(0, 10);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(mood);
    return acc;
  }, {} as Record<string, MoodData[]>);

  const sortedDates = Object.keys(moodsByDate).sort().reverse();

  const renderContent = () => {
    switch (activeView) {
      case 'record':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <MoodRecordForm onSubmit={handleNewMood} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sortedDates.map((date) => (
                <MoodCardGroup
                  key={date}
                  date={date}
                  moods={moodsByDate[date]}
                />
              ))}
            </div>
          </div>
        );
      case 'calendar':
        return <CalendarView moods={moods} />;
      case 'analysis':
        return <AnalysisView moods={moods} />;
      case 'report':
        return <ReportView moods={moods} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main
        style={{
          flex: 1,
          marginLeft: '240px',
          padding: '32px',
          paddingBottom: '100px',
        }}
        className="main-content"
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          {renderContent()}
        </div>
      </main>
      <style>{`
        @media (max-width: 768px) {
          main {
            margin-left: 0 !important;
            padding: 16px !important;
            padding-bottom: 100px !important;
          }
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #667eea;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
          transition: all 0.2s ease;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #667eea;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
        }
      `}</style>
    </div>
  );
};

export default App;
