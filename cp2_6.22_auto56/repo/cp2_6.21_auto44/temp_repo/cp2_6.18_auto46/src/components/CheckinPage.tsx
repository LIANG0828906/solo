import { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import {
  formatDateKey,
  getMonthDays,
  validateCheckinDuration,
  validateCheckinNotes,
} from '../modules/progressTracker';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function CheckinPage() {
  const { currentUser, skills, checkins, addCheckin, plans, showToast } = useAppStore();

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');

  const mySkills = skills.filter(s => s.userId === currentUser.id);

  const checkedDates = useMemo(() => {
    const set = new Set<string>();
    checkins
      .filter(c => c.userId === currentUser.id)
      .forEach(c => set.add(c.date));
    return set;
  }, [checkins, currentUser.id]);

  const monthDays = useMemo(
    () => getMonthDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) {
      showToast('不能对未来日期打卡', 'error');
      return;
    }
    setSelectedDate(date);
    if (mySkills.length > 0) {
      setSelectedSkillId(mySkills[0].id);
    }
    setDuration(60);
    setNotes('');
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!selectedSkillId) {
      showToast('请先发布一个技能', 'error');
      return;
    }
    if (!validateCheckinDuration(duration)) {
      showToast('学习时长需1-480分钟整数', 'error');
      return;
    }
    if (!validateCheckinNotes(notes)) {
      showToast('学习笔记最多200字', 'error');
      return;
    }
    if (!selectedDate) return;
    addCheckin(
      selectedSkillId,
      formatDateKey(selectedDate),
      duration,
      notes
    );
    setShowModal(false);
  };

  const todayKey = formatDateKey(new Date());

  const currentPlan = mySkills.length > 0
    ? plans.find(p => p.skillId === mySkills[0].id)
    : null;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">每日打卡</h1>
      </div>

      <div className="card" style={{ display: 'inline-block', marginRight: 24, verticalAlign: 'top' }}>
        <div className="calendar-header">
          <button className="btn btn-secondary" onClick={handlePrevMonth}>
            ◀
          </button>
          <span style={{ fontWeight: 600, fontSize: 16 }}>
            {currentYear}年{currentMonth + 1}月
          </span>
          <button className="btn btn-secondary" onClick={handleNextMonth}>
            ▶
          </button>
        </div>
        <div className="calendar-weekdays">
          {WEEKDAYS.map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-grid">
          {monthDays.map((date, idx) => {
            const key = formatDateKey(date);
            const isCurrentMonth = date.getMonth() === currentMonth;
            const isChecked = checkedDates.has(key);
            const isToday = key === todayKey;
            const isCurrentMonthClass = isCurrentMonth ? '' : 'other-month';
            return (
              <div
                key={idx}
                className={`calendar-day ${isChecked ? 'checked' : ''} ${isToday ? 'today' : ''} ${isCurrentMonthClass}`}
                onClick={() => isCurrentMonth && handleDateClick(date)}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>
      </div>

      {currentPlan && (
        <div className="card" style={{ display: 'inline-block', verticalAlign: 'top', minWidth: 300 }}>
          <h3 className="section-title" style={{ marginBottom: 12 }}>
            本周计划 - {currentPlan.skillName}
          </h3>
          <div className="plan-week">
            {Object.entries(currentPlan.dailyTargets).map(([day, target]) => (
              <div key={day} className="plan-day">
                <div className="plan-day-name">{day}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#3B82F6' }}>
                  {target}
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>分钟</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && selectedDate && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="section-title" style={{ marginBottom: 20 }}>
              打卡 - {formatDateKey(selectedDate)}
            </h2>
            {mySkills.length > 0 ? (
              <>
                <div className="form-group">
                  <label className="label">学习技能</label>
                  <select
                    className="select"
                    value={selectedSkillId}
                    onChange={e => setSelectedSkillId(e.target.value)}
                  >
                    {mySkills.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {s.level}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">学习时长（分钟，1-480）</label>
                  <input
                    type="range"
                    className="slider"
                    min={10}
                    max={480}
                    value={duration}
                    onChange={e => setDuration(parseInt(e.target.value))}
                  />
                  <div style={{ textAlign: 'center', marginTop: 8, fontWeight: 600, fontSize: 18 }}>
                    {duration} 分钟
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">学习笔记（最多200字）</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    placeholder="今天学到了什么？"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    maxLength={200}
                  />
                  <div style={{ textAlign: 'right', fontSize: 12, color: '#64748B', marginTop: 4 }}>
                    {notes.length}/200
                  </div>
                </div>
              </>
            ) : (
              <p style={{ color: '#64748B', marginBottom: 16 }}>
                请先在"发现"页面发布一个技能
              </p>
            )}
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={mySkills.length === 0}
              >
                确认打卡
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
