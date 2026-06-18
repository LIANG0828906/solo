import { useState, useEffect } from 'react';
import { MdClose, MdCheck } from 'react-icons/md';
import { MOOD_CONFIGS, MoodLevel, MoodRecord, getMoodConfig } from '../types';
import { getRecordByDate, upsertRecord, deleteRecord, formatDateKey } from '../data';

interface PanelProps {
  date: Date;
  onClose: () => void;
  onSaved: () => void;
}

export default function Panel({ date, onClose, onSaved }: PanelProps) {
  const dateKey = formatDateKey(date);
  const existing: MoodRecord | undefined = getRecordByDate(date);
  const [selectedLevel, setSelectedLevel] = useState<MoodLevel>(
    existing ? existing.level : MoodLevel.Cloudy
  );
  const [text, setText] = useState<string>(
    existing ? existing.text : getMoodConfig(MoodLevel.Cloudy).autoText
  );
  const [closing, setClosing] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (existing) {
      setSelectedLevel(existing.level);
      setText(existing.text);
    } else {
      setSelectedLevel(MoodLevel.Cloudy);
      setText(getMoodConfig(MoodLevel.Cloudy).autoText);
    }
    setDirty(false);
  }, [dateKey]);

  const currentCfg = getMoodConfig(selectedLevel);

  const handleSelect = (level: MoodLevel) => {
    setSelectedLevel(level);
    setText(getMoodConfig(level).autoText);
    setDirty(true);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setDirty(true);
  };

  const handleConfirm = () => {
    upsertRecord(date, selectedLevel, text);
    onSaved();
    doClose();
  };

  const handleDelete = () => {
    deleteRecord(date);
    onSaved();
    doClose();
  };

  const doClose = () => {
    setClosing(true);
    setTimeout(onClose, 380);
  };

  const formatFullDate = () => {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日  ${weekdays[date.getDay()]}`;
  };

  return (
    <>
      <div
        onClick={doClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(2px)',
          zIndex: 50,
          animation: closing ? 'fade-in-up 0.3s reverse' : 'fade-in-up 0.3s both',
          opacity: closing ? 0 : 1,
          transition: 'opacity 0.3s',
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(440px, 92vw)',
          background: '#fff',
          zIndex: 60,
          boxShadow: '-10px 0 40px rgba(0,0,0,0.12)',
          animation: closing
            ? 'panel-slide-out 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards'
            : 'panel-slide-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: currentCfg.gradient,
            padding: '24px 22px',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -30,
              top: -30,
              fontSize: 180,
              opacity: 0.18,
              lineHeight: 1,
            }}
          >
            {currentCfg.emoji}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
            <div>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{currentCfg.emoji} {currentCfg.name}</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>{formatFullDate()}</div>
            </div>
            <button
              onClick={doClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255,255,255,0.25)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.4)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
            >
              <MdClose size={18} />
            </button>
          </div>
        </div>

        <div style={{ padding: '22px 22px 12px', flex: 1, overflowY: 'auto' }}>
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 10 }}>选择今日情绪天气</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {MOOD_CONFIGS.map((cfg) => {
                const active = cfg.level === selectedLevel;
                return (
                  <button
                    key={cfg.level}
                    onClick={() => handleSelect(cfg.level)}
                    style={{
                      padding: '14px 8px',
                      borderRadius: 14,
                      border: active ? `2px solid ${cfg.color}` : '2px solid transparent',
                      background: active ? cfg.gradient : 'rgba(100,100,100,0.05)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'transform 0.15s, background 0.2s',
                      transform: active ? 'scale(1.02)' : 'scale(1)',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = 'rgba(100,100,100,0.09)';
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = 'rgba(100,100,100,0.05)';
                    }}
                  >
                    <span style={{ fontSize: 26 }}>{cfg.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: active ? '#fff' : '#444' }}>
                      {cfg.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>心情记录</div>
              <span style={{ fontSize: 11, color: '#aaa' }}>{text.length}/200</span>
            </div>
            <textarea
              value={text}
              onChange={handleTextChange}
              maxLength={200}
              style={{
                width: '100%',
                minHeight: 120,
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid rgba(100,100,100,0.15)',
                outline: 'none',
                resize: 'vertical',
                fontSize: 14,
                lineHeight: 1.6,
                fontFamily: 'inherit',
                color: '#333',
                background: 'rgba(100,100,100,0.03)',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = currentCfg.color;
                e.currentTarget.style.background = '#fff';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(100,100,100,0.15)';
                e.currentTarget.style.background = 'rgba(100,100,100,0.03)';
              }}
            />
            <div
              style={{
                marginTop: 10,
                padding: '10px 12px',
                borderRadius: 10,
                background: `${currentCfg.color}12`,
                borderLeft: `3px solid ${currentCfg.color}`,
                fontSize: 12,
                color: '#666',
                lineHeight: 1.6,
              }}
            >
              💡 小贴士：{currentCfg.autoText}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 22px 22px',
            borderTop: '1px solid rgba(100,100,100,0.08)',
            display: 'flex',
            gap: 10,
          }}
        >
          {existing && (
            <button
              onClick={handleDelete}
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid rgba(220,60,60,0.2)',
                background: 'rgba(220,60,60,0.05)',
                color: '#c0392b',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(220,60,60,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(220,60,60,0.05)')}
            >
              删除记录
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={doClose}
            style={{
              padding: '12px 20px',
              borderRadius: 12,
              border: '1px solid rgba(100,100,100,0.15)',
              background: '#fff',
              color: '#666',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(100,100,100,0.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '12px 22px',
              borderRadius: 12,
              border: 'none',
              background: currentCfg.gradient,
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: `0 4px 14px ${currentCfg.color}55`,
              transition: 'transform 0.15s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = `0 6px 18px ${currentCfg.color}70`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 14px ${currentCfg.color}55`;
            }}
          >
            <MdCheck size={16} /> 确认
          </button>
          <div style={{ display: 'none' }}>{dirty}</div>
        </div>
      </div>
    </>
  );
}
