import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { getUniqueSkillNames, validateSkillName } from '../modules/skillManager';
import { calculateStreak } from '../modules/progressTracker';
import type { ProficiencyLevel, TimeSlot, MatchResult } from '../types';
import { TIME_SLOT_CONFIG } from '../types';

const LEVELS: ProficiencyLevel[] = ['初级', '中级', '高级'];
const TIME_SLOTS: TimeSlot[] = ['morning', 'afternoon', 'evening'];

export default function DiscoverPage() {
  const {
    currentUser,
    skills,
    users,
    matches,
    buddies,
    checkins,
    addSkill,
    computeMatches,
    sendInvite,
    showToast,
  } = useAppStore();

  const [skillName, setSkillName] = useState('');
  const [level, setLevel] = useState<ProficiencyLevel>('初级');
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);

  const mySkills = skills.filter(s => s.userId === currentUser.id);
  const skillTags = getUniqueSkillNames(skills);

  const handleSlotToggle = (slot: TimeSlot) => {
    setSelectedSlots(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  const handleSubmit = () => {
    if (!validateSkillName(skillName)) {
      showToast('技能名称需1-20个字符', 'error');
      return;
    }
    if (selectedSlots.length === 0) {
      showToast('请至少选择一个活跃时段', 'error');
      return;
    }
    const newSkill = addSkill(skillName, level, selectedSlots);
    setSkillName('');
    setLevel('初级');
    setSelectedSlots([]);
    setShowForm(false);
    setActiveSkillId(newSkill.id);
    computeMatches(newSkill.id);
  };

  const handleSelectMySkill = (skillId: string) => {
    setActiveSkillId(skillId);
    computeMatches(skillId);
  };

  const handleInvite = (match: MatchResult) => {
    sendInvite(match);
  };

  const isAlreadyBuddy = (userId: string) =>
    buddies.some(
      b =>
        (b.userId === currentUser.id && b.buddyId === userId) ||
        (b.buddyId === currentUser.id && b.userId === userId)
    );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">发现学习伙伴</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + 发布技能
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="section-title" style={{ marginBottom: 12 }}>热门技能</h3>
        <div className="tag-cloud">
          {skillTags.map(tag => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {mySkills.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 className="section-title" style={{ marginBottom: 12 }}>我的技能</h3>
          <div className="tag-cloud">
            {mySkills.map(skill => (
              <span
                key={skill.id}
                className={`tag ${activeSkillId === skill.id ? 'active' : ''}`}
                onClick={() => handleSelectMySkill(skill.id)}
              >
                {skill.name} · {skill.level}
              </span>
            ))}
          </div>
        </div>
      )}

      {activeSkillId && matches.length > 0 ? (
        <>
          <h3 className="section-title">推荐伙伴 ({matches.length})</h3>
          <div className="grid-3">
            {matches.map(match => {
              const streak = calculateStreak(checkins, match.userId);
              const alreadyBuddy = isAlreadyBuddy(match.userId);
              return (
                <div key={match.userId} className="card buddy-card">
                  <div className="buddy-header">
                    <div className="avatar">
                      {match.user.nickname.charAt(0)}
                    </div>
                    <div className="buddy-info">
                      <div className="buddy-name">{match.user.nickname}</div>
                      <div className="buddy-meta">
                        <span className="badge badge-primary">{match.skill.level}</span>
                        {streak > 0 && (
                          <span className="badge badge-success">🔥 {streak}天连续</span>
                        )}
                      </div>
                    </div>
                    <div className="match-score">{match.score}分</div>
                  </div>
                  <div>
                    <div className="label">活跃时段</div>
                    <div className="buddy-meta">
                      {match.skill.timeSlots.map(slot => (
                        <span key={slot} className="badge badge-warning">
                          {TIME_SLOT_CONFIG[slot].label} {TIME_SLOT_CONFIG[slot].hours}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    disabled={alreadyBuddy}
                    onClick={() => handleInvite(match)}
                  >
                    {alreadyBuddy ? '已成为伙伴' : '发送邀请'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : activeSkillId ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <p>暂无匹配的学习伙伴，试试发布其他技能吧</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">👆</div>
            <p>选择或发布一个技能，开始寻找学习伙伴</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="section-title" style={{ marginBottom: 20 }}>发布技能</h2>
            <div className="form-group">
              <label className="label">技能名称 (最多20字)</label>
              <input
                type="text"
                className="input"
                placeholder="例如：JavaScript、画画、吉他"
                value={skillName}
                onChange={e => setSkillName(e.target.value)}
                maxLength={20}
              />
            </div>
            <div className="form-group">
              <label className="label">熟练度等级</label>
              <div className="checkbox-group">
                {LEVELS.map(l => (
                  <label
                    key={l}
                    className={`checkbox-item ${level === l ? 'checked' : ''}`}
                    onClick={() => setLevel(l)}
                  >
                    <input
                      type="radio"
                      checked={level === l}
                      onChange={() => setLevel(l)}
                    />
                    {l}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="label">活跃时段 (可多选)</label>
              <div className="checkbox-group">
                {TIME_SLOTS.map(slot => (
                  <label
                    key={slot}
                    className={`checkbox-item ${selectedSlots.includes(slot) ? 'checked' : ''}`}
                    onClick={() => handleSlotToggle(slot)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSlots.includes(slot)}
                      onChange={() => handleSlotToggle(slot)}
                    />
                    {TIME_SLOT_CONFIG[slot].label} {TIME_SLOT_CONFIG[slot].hours}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                发布并匹配
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
