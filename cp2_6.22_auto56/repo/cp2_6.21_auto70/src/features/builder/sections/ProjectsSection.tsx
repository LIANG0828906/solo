import React from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { Template } from '@/types/resume';

interface Props {
  template: Template;
}

const ProjectsSection: React.FC<Props> = ({ template }) => {
  const { projects } = useResumeStore((state) => state.resumeData);

  if (!projects || projects.length === 0) return null;

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
        项目展示
      </h2>
      <div className="section-content">
        {projects.map((project) => (
          <div key={project.id} className="entry-item">
            <div className="entry-header">
              <div className="entry-title-row">
                <h3
                  className="entry-title"
                  style={{ color: template.colors.title }}
                >
                  {project.name || '项目名称'}
                </h3>
                <span
                  className="entry-date"
                  style={{ color: template.colors.accent }}
                >
                  {project.startDate} - {project.endDate}
                </span>
              </div>
              <p
                className="entry-subtitle"
                style={{ color: template.colors.accent }}
              >
                {project.role || '角色'}
              </p>
            </div>
            {project.description && (
              <p className="entry-description">{project.description}</p>
            )}
            {project.technologies && project.technologies.length > 0 && (
              <div className="tech-tags">
                {project.technologies.map((tech, idx) => (
                  <span
                    key={idx}
                    className="tech-tag"
                    style={{
                      background: template.colors.sectionBg,
                      color: template.colors.accent,
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsSection;
