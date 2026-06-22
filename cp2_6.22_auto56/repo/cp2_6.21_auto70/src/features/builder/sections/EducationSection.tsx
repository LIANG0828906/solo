import React from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { Template } from '@/types/resume';

interface Props {
  template: Template;
}

const EducationSection: React.FC<Props> = ({ template }) => {
  const { education } = useResumeStore((state) => state.resumeData);

  if (!education || education.length === 0) return null;

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
        教育经历
      </h2>
      <div className="section-content">
        {education.map((edu) => (
          <div key={edu.id} className="entry-item">
            <div className="entry-header">
              <div className="entry-title-row">
                <h3
                  className="entry-title"
                  style={{ color: template.colors.title }}
                >
                  {edu.school || '学校名称'}
                </h3>
                <span
                  className="entry-date"
                  style={{ color: template.colors.accent }}
                >
                  {edu.startDate} - {edu.endDate}
                </span>
              </div>
              <p className="entry-subtitle">
                {edu.degree}
                {edu.major && ` · ${edu.major}`}
              </p>
            </div>
            {edu.description && (
              <p className="entry-description">{edu.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EducationSection;
