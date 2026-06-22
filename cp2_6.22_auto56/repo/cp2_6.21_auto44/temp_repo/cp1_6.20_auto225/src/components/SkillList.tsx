import React, { useEffect, useState } from 'react';
import { usePetStore } from '../data/PetState';
import { getSkillById, SKILLS, type SkillId } from '../game/SkillManager';

const SkillList: React.FC = () => {
  const { learnedSkills, setAnimation, isAnimating } = usePetStore();
  const [animatingSkills, setAnimatingSkills] = useState<Set<SkillId>>(new Set());

  useEffect(() => {
    const newlyLearned = learnedSkills.filter((s) => !animatingSkills.has(s));
    if (newlyLearned.length > 0) {
      newlyLearned.forEach((id) => {
        setAnimatingSkills((prev) => new Set(prev).add(id));
      });
    }
  }, [learnedSkills, animatingSkills]);

  const handleSkillClick = (skillId: SkillId) => {
    if (isAnimating) return;
    const skill = getSkillById(skillId);
    if (skill) {
      setAnimation(skill.animationType, skill.duration);
    }
  };

  if (learnedSkills.length === 0) {
    return (
      <div className="skill-list">
        <h3 className="panel-title">技能列表</h3>
        <div className="empty-skills">
          <p>提升属性至 80 解锁新技能</p>
          <div className="skill-hints">
            {SKILLS.map((s) => (
              <div key={s.id} className="skill-hint">
                <span className="skill-hint-icon">{s.icon}</span>
                <span className="skill-hint-name">{s.name}</span>
                <span className="skill-hint-threshold">
                  {s.unlockThreshold.stat === 'hunger' && '饱食度'}
                  {s.unlockThreshold.stat === 'cleanliness' && '清洁度'}
                  {s.unlockThreshold.stat === 'happiness' && '快乐度'} ≥{s.unlockThreshold.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="skill-list">
      <h3 className="panel-title">已学技能</h3>
      <div className="skill-cards">
        {learnedSkills.map((skillId) => {
          const skill = getSkillById(skillId);
          if (!skill) return null;
          return (
            <div
              key={skillId}
              className={`skill-card ${animatingSkills.has(skillId) ? 'slide-in' : ''}`}
              onClick={() => handleSkillClick(skillId)}
            >
              <span className="skill-icon">{skill.icon}</span>
              <span className="skill-name">{skill.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillList;
