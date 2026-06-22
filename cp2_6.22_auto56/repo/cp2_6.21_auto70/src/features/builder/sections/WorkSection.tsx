import React from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { Template } from '@/types/resume';

interface Props {
  template: Template;
}

const WorkSection: React.FC<Props> = ({ template }) => {
  const { workExperience } = useResumeStore((state) => state.resumeData);

  if (!workExperience || workExperience.length === 0) return null;

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
        工作经历
      </h2>
      <div className="section-content">
        {workExperience.map((work) => (
          <div key={work.id} className="entry-item">
            <div className="entry-header">
              <div className="entry-title-row">
                <h3
                  className="entry-title"
                  style={{ color: template.colors.title }}
                >
                  {work.company || '公司名称'}
                </h3>
                <span
                  className="entry-date"
                  style={{ color: template.colors.accent }}
                >
                  {work.startDate} - {work.endDate}
                </span>
              </div>
              <p
                className="entry-subtitle"
                style={{ color: template.colors.accent }}
              >
                {work.position || '职位'}
              </p>
            </div>
            {work.description && (
              <p className="entry-description">{work.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkSection;
