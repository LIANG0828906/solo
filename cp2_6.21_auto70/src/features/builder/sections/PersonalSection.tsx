import React from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { Template } from '@/types/resume';

interface Props {
  template: Template;
}

const PersonalSection: React.FC<Props> = ({ template }) => {
  const { personalInfo } = useResumeStore((state) => state.resumeData);

  return (
    <div className="resume-section personal-section">
      <div className="personal-header">
        {personalInfo.avatar && (
          <img
            src={personalInfo.avatar}
            alt="avatar"
            className="avatar"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <div className="personal-text">
          <h1
            className="name"
            style={{
              color: template.colors.title,
              fontFamily: template.fonts.heading,
            }}
          >
            {personalInfo.name || '姓名'}
          </h1>
          <div className="contact-info">
            {personalInfo.email && (
              <span className="contact-item">
                <span className="contact-icon">📧</span>
                {personalInfo.email}
              </span>
            )}
            {personalInfo.phone && (
              <span className="contact-item">
                <span className="contact-icon">📱</span>
                {personalInfo.phone}
              </span>
            )}
          </div>
        </div>
      </div>
      {personalInfo.summary && (
        <div
          className="summary"
          style={{
            borderLeftColor: template.colors.accent,
            background: template.colors.sectionBg,
          }}
        >
          {personalInfo.summary}
        </div>
      )}
      <div
        className="section-divider"
        style={{ background: template.colors.divider }}
      />
    </div>
  );
};

export default PersonalSection;
