import React from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import './editors.css';

const SkillsEditor: React.FC = () => {
  const { resumeData, addSkill, updateSkill, removeSkill } = useResumeStore();
  const { skills } = resumeData;

  return (
    <div className="editor-form">
      {skills.map((skill) => (
        <div key={skill.id} className="skill-item">
          <div className="skill-input">
            <input
              type="text"
              value={skill.name}
              onChange={(e) => updateSkill(skill.id, { name: e.target.value })}
              placeholder="技能名称"
            />
          </div>
          <div className="skill-level">
            <input
              type="range"
              min="0"
              max="100"
              value={skill.level}
              onChange={(e) =>
                updateSkill(skill.id, { level: Number(e.target.value) })
              }
            />
            <span className="level-value">{skill.level}%</span>
          </div>
          {skills.length > 1 && (
            <button
              className="remove-skill-btn"
              onClick={() => removeSkill(skill.id)}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button className="add-btn" onClick={addSkill}>
        + 添加技能
      </button>
    </div>
  );
};

export default SkillsEditor;
