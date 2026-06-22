import React from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { Template } from '@/types/resume';

interface Props {
  template: Template;
}

const CustomSection: React.FC<Props> = ({ template }) => {
  const { customSections } = useResumeStore((state) => state.resumeData);

  if (!customSections || customSections.length === 0) return null;

  return (
    <>
      {customSections.map((section) => (
        <div key={section.id} className="resume-section">
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
            {section.title || '自定义区块'}
          </h2>
          <div className="section-content">
            {section.content &&
              section.content.split('\n').map((line, idx) => (
                <p key={idx} className="custom-content-line">
                  {line}
                </p>
              ))}
          </div>
        </div>
      ))}
    </>
  );
};

export default CustomSection;
