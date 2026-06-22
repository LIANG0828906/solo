import React, { useState, useEffect } from 'react';
import type { Schedule, SmartSuggestion } from '../types';
import { getSmartSuggest } from '../api';

interface SidebarProps {
  todaySchedules: Schedule[];
  onQuickAdd: (data: Partial<Schedule>) => void;
  onSmartSuggestClick: (suggestion: { date: string; startTime: string; endTime: string }) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  todaySchedules,
  onQuickAdd,
  onSmartSuggestClick
}) => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  
  const completedCount = todaySchedules.filter(s => s.completed).length;
  const totalCount = todaySchedules.length;

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (duration <= 0) return;
      setLoading(true);
      try {
        const data = await getSmartSuggest(todayStr, duration);
        setSuggestions(data);
      } catch (error) {
        console.error('获取智能建议失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [duration, todayStr]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('请输入日程标题');
      return;
    }
    
    onQuickAdd({
      title: title.trim(),
      date: todayStr,
      startTime: '09:00',
      endTime: '10:00',
      duration
    });
    
    setTitle('');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateStr === today.toISOString().split('T')[0]) {
      return '今天';
    }
    if (dateStr === tomorrow.toISOString().split('T')[0]) {
      return '明天';
    }
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const handleSuggestionClick = (suggestion: SmartSuggestion, slot: { startTime: string; endTime: string }) => {
    onSmartSuggestClick({
      date: suggestion.date,
      startTime: slot.startTime,
      endTime: slot.endTime
    });
  };

  const todayDateStr = () => {
    const d = new Date();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
  };

  return (
    <aside className="sidebar">
      <h2>今日摘要</h2>
      <div className="today-summary">
        <div className="date">{todayDateStr()}</div>
        <div className="stats">
          <div>
            {completedCount}/{totalCount}
            <div className="label">已完成</div>
          </div>
          <div>
            {totalCount}
            <div className="label">全部</div>
          </div>
        </div>
      </div>

      <h2>快速添加</h2>
      <form className="quick-add-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入日程标题..."
        />
        <label style={{ fontSize: '12px', color: '#6B7280' }}>
          预计时长（分钟）
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min={15}
            step={15}
            style={{ width: '100%' }}
          />
        </label>
        <button type="submit" className="btn-primary">
          + 添加到今天
        </button>
      </form>

      <h2>智能推荐时段</h2>
      {loading ? (
        <div className="loading" style={{ padding: '20px' }}>加载中...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {suggestions.slice(0, 3).map((suggestion, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>
                {formatDate(suggestion.date)}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {suggestion.slots.map((slot, slotIdx) => (
                  <span
                    key={slotIdx}
                    className="smart-tag"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSuggestionClick(suggestion, slot)}
                    title={`点击添加 ${slot.startTime} - ${slot.endTime}`}
                  >
                    {slot.startTime} - {slot.endTime}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {suggestions.length === 0 && (
            <div style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', padding: '10px' }}>
              暂无推荐
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
