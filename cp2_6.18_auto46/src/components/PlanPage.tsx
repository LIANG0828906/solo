import { useState } from 'react';
import { useAppStore } from '../store/appStore';

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function PlanPage() {
  const { currentUser, skills, plans, addPlan } = useAppStore();
  const mySkills = skills.filter(s => s.userId === currentUser.id);

  const [selectedSkillId, setSelectedSkillId] = useState(
    mySkills.length > 0 ? mySkills[0].id : ''
  );
  const [dailyTargets, setDailyTargets] = useState<Record<string, number>>(
    WEEKDAYS.reduce((acc, day) => ({ ...acc, [day]: 60 }), {})
  );

  const handleTargetChange = (day: string, value: number) => {
    setDailyTargets(prev => ({ ...prev, [day]: value }));
  };

  const selectedSkill = mySkills.find(s => s.id === selectedSkillId);
  const existingPlan = selectedSkillId
    ? plans.find(p => p.skillId === selectedSkillId)
    : null;

  const handleSave = () => {
    if (!selectedSkillId) return;
    const skill = mySkills.find(s => s.id === selectedSkillId);
    if (!skill) return;
    addPlan(selectedSkillId, skill.name, dailyTargets);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">学习计划</h1>
      </div>

      {mySkills.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>请先在"发现"页面发布一个技能，再制定学习计划</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="form-group">
            <label className="label">目标技能</label>
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

          {existingPlan && (
            <div style={{ marginBottom: 24, padding: 16, background: '#F1F5F9', borderRadius: 8 }}>
              <span style={{ fontWeight: 600, color: '#64748B' }}>提示：</span>
              已有该技能的计划，保存后将覆盖原计划
            </div>
          )}

          <h3 className="section-title" style={{ marginBottom: 16 }}>本周每日目标学习时长</h3>

          <div className="plan-week">
            {WEEKDAYS.map(day => (
              <div key={day} className="plan-day">
                <div className="plan-day-name">{day}</div>
                <input
                  type="range"
                  className="slider"
                  min={10}
                  max={480}
                  value={dailyTargets[day]}
                  onChange={e => handleTargetChange(day, parseInt(e.target.value))}
                  style={{ marginBottom: 8 }}
                />
                <div style={{ fontSize: 18, fontWeight: 700, color: '#3B82F6' }}>
                  {dailyTargets[day]}
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>分钟</div>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleSave}>
              保存计划
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
