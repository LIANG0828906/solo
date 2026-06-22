import React from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { Template } from '@/types/resume';

interface Props {
  template: Template;
}

const SkillsSection: React.FC<Props> = ({ template }) => {
  const { skills } = useResumeStore((state) => state.resumeData);

  if (!skills || skills.length === 0) return null;

  return (
    <div className="resume-section">
      <h2
        className="section-title"
        style={{
          color: template.colors.title,
          fontFamily: template.fonts.heading,
          borderBottomColor: template.colors.divider,
        }}
      >
        <span
          className="title-accent"
          style={{ background: template.colors.accent }}
        />
        技能标签
      </h2>
      <div className="section-content">
        <div className="skills-container">
          {skills.map((skill) => (
            <div key={skill.id} className="skill-tag-wrapper">
              <span
                className="skill-tag"
                style={{
                  background: template.colors.sectionBg,
                  color: template.colors.title,
                  borderColor: template.colors.accent,
                }}
              >
                {skill.name || '技能'}
              </span>
              <div className="skill-bar-container">
                <div
                  className="skill-bar"
                  style={{
                    width: `${skill.level}%`,
                    background: template.colors.accent,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillsSection;
