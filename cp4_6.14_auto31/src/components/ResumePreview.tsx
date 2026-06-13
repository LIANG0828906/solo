import React, { forwardRef, useState, useCallback, DragEvent } from 'react';
import { ResumeData, ModuleType, THEME_CONFIG } from '@/data/resumeModel';
import { cn } from '@/lib/utils';

interface ResumePreviewProps {
  data: ResumeData;
  theme: string;
  moduleOrder: ModuleType[];
  onModuleReorder?: (newOrder: ModuleType[]) => void;
}

const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ data, theme, moduleOrder, onModuleReorder }, ref) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const themeConfig = THEME_CONFIG[theme] || THEME_CONFIG['简洁灰'];

    const cssVars = {
      '--resume-width': '210mm',
      '--resume-height': '297mm',
      '--resume-primary': themeConfig.primary,
      '--resume-background': themeConfig.background,
      '--resume-text': themeConfig.text,
      '--resume-accent': themeConfig.accent,
      '--resume-shadow': themeConfig.shadow,
      '--resume-font-family': themeConfig.fontFamily,
    } as React.CSSProperties;

    const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    }, []);

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverIndex !== index) {
        setDragOverIndex(index);
      }
    }, [dragOverIndex]);

    const handleDragLeave = useCallback(() => {
      setDragOverIndex(null);
    }, []);

    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, dropIndex: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === dropIndex) {
        setDraggedIndex(null);
        setDragOverIndex(null);
        return;
      }

      const newOrder = [...moduleOrder];
      const removed = newOrder[draggedIndex];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(dropIndex, 0, removed);

      onModuleReorder?.(newOrder);
      setDraggedIndex(null);
      setDragOverIndex(null);
    }, [draggedIndex, moduleOrder, onModuleReorder]);

    const handleDragEnd = useCallback(() => {
      setDraggedIndex(null);
      setDragOverIndex(null);
    }, []);

    const renderModule = (moduleType: ModuleType, index: number) => {
      const isDragging = draggedIndex === index;
      const isDragOver = dragOverIndex === index && draggedIndex !== index;

      const moduleContent = () => {
        switch (moduleType) {
          case 'personal':
            return renderPersonalModule();
          case 'work':
            return renderWorkModule();
          case 'education':
            return renderEducationModule();
          case 'skills':
            return renderSkillsModule();
          case 'projects':
            return renderProjectsModule();
          default:
            return null;
        }
      };

      return (
        <div
          key={moduleType}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={cn(
            'module-card relative rounded-lg p-4 mb-4 transition-all duration-200',
            isDragging && 'opacity-50 scale-[1.02] z-10',
            isDragOver && 'mt-8'
          )}
          style={{
            backgroundColor: 'var(--resume-background)',
            boxShadow: isDragging
              ? '0 8px 25px rgba(0, 0, 0, 0.2)'
              : 'var(--resume-shadow)',
            transition: 'transform 200ms ease, box-shadow 200ms ease, margin 200ms ease',
          }}
        >
          <div className="drag-handle absolute top-3 right-3 cursor-grab active:cursor-grabbing select-none text-xs opacity-40 hover:opacity-70">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="2" />
              <circle cx="15" cy="6" r="2" />
              <circle cx="9" cy="12" r="2" />
              <circle cx="15" cy="12" r="2" />
              <circle cx="9" cy="18" r="2" />
              <circle cx="15" cy="18" r="2" />
            </svg>
          </div>
          {moduleContent()}
        </div>
      );
    };

    const renderPersonalModule = () => (
      <div className="personal-module">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--resume-primary)' }}
            >
              {data.personal.name || '姓名'}
            </h1>
            <p
              className="text-base"
              style={{ color: 'var(--resume-accent)' }}
            >
              {data.personal.title || '职位'}
            </p>
          </div>
          {data.personal.avatar && (
            <img
              src={data.personal.avatar}
              alt="avatar"
              className="w-16 h-16 rounded-full object-cover"
              style={{ border: '2px solid var(--resume-primary)' }}
            />
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-sm mb-4" style={{ color: 'var(--resume-text)' }}>
          {data.personal.email && (
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              {data.personal.email}
            </span>
          )}
          {data.personal.phone && (
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {data.personal.phone}
            </span>
          )}
          {data.personal.location && (
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {data.personal.location}
            </span>
          )}
        </div>
        {data.personal.summary && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--resume-text)' }}>
            {data.personal.summary}
          </p>
        )}
      </div>
    );

    const renderWorkModule = () => (
      <div className="work-module">
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b" style={{
          color: 'var(--resume-primary)',
          borderColor: 'var(--resume-accent)',
        }}>
          工作经历
        </h2>
        <div className="space-y-4">
          {data.work.length === 0 ? (
            <p className="text-sm opacity-50">暂无工作经历</p>
          ) : (
            data.work.map((item) => (
              <div key={item.id} className="work-item">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-medium" style={{ color: 'var(--resume-text)' }}>
                      {item.position}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--resume-accent)' }}>
                      {item.company}
                    </p>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--resume-accent)' }}>
                    {item.startDate} - {item.endDate}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm mt-2" style={{ color: 'var(--resume-text)' }}>
                    {item.description}
                  </p>
                )}
                {item.achievements.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {item.achievements.map((achievement, idx) => (
                      <li
                        key={idx}
                        className="text-sm flex items-start gap-2"
                        style={{ color: 'var(--resume-text)' }}
                      >
                        <span
                          className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
                          style={{ backgroundColor: 'var(--resume-primary)' }}
                        />
                        {achievement}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );

    const renderEducationModule = () => (
      <div className="education-module">
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b" style={{
          color: 'var(--resume-primary)',
          borderColor: 'var(--resume-accent)',
        }}>
          教育背景
        </h2>
        <div className="space-y-3">
          {data.education.length === 0 ? (
            <p className="text-sm opacity-50">暂无教育背景</p>
          ) : (
            data.education.map((item) => (
              <div key={item.id} className="education-item">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium" style={{ color: 'var(--resume-text)' }}>
                      {item.school}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--resume-accent)' }}>
                      {item.degree} · {item.major}
                    </p>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--resume-accent)' }}>
                    {item.startDate} - {item.endDate}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm mt-2" style={{ color: 'var(--resume-text)' }}>
                    {item.description}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );

    const renderSkillsModule = () => (
      <div className="skills-module">
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b" style={{
          color: 'var(--resume-primary)',
          borderColor: 'var(--resume-accent)',
        }}>
          技能特长
        </h2>
        {data.skills.length === 0 ? (
          <p className="text-sm opacity-50">暂无技能</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <span
                key={skill.id}
                className="px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: 'var(--resume-primary)',
                  color: 'var(--resume-background)',
                  opacity: 0.85 + (skill.level / 100) * 0.15,
                }}
              >
                {skill.name}
              </span>
            ))}
          </div>
        )}
      </div>
    );

    const renderProjectsModule = () => (
      <div className="projects-module">
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b" style={{
          color: 'var(--resume-primary)',
          borderColor: 'var(--resume-accent)',
        }}>
          项目经历
        </h2>
        <div className="space-y-4">
          {data.projects.length === 0 ? (
            <p className="text-sm opacity-50">暂无项目经历</p>
          ) : (
            data.projects.map((item) => (
              <div key={item.id} className="project-item">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-medium" style={{ color: 'var(--resume-text)' }}>
                      {item.name}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--resume-accent)' }}>
                      {item.role}
                    </p>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--resume-accent)' }}>
                    {item.startDate} - {item.endDate}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm mt-2" style={{ color: 'var(--resume-text)' }}>
                    {item.description}
                  </p>
                )}
                {item.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.technologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs rounded"
                        style={{
                          backgroundColor: 'var(--resume-accent)',
                          color: 'var(--resume-background)',
                          opacity: 0.7,
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                {item.highlights.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {item.highlights.map((highlight, idx) => (
                      <li
                        key={idx}
                        className="text-sm flex items-start gap-2"
                        style={{ color: 'var(--resume-text)' }}
                      >
                        <span
                          className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
                          style={{ backgroundColor: 'var(--resume-primary)' }}
                        />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );

    return (
      <div
        ref={ref}
        className="resume-container relative overflow-hidden"
        style={{
          ...cssVars,
          width: 'var(--resume-width)',
          height: 'var(--resume-height)',
          minHeight: 'var(--resume-height)',
          backgroundColor: '#FFF',
          backgroundImage: `
            linear-gradient(#EEE 1px, transparent 1px),
            linear-gradient(90deg, #EEE 1px, transparent 1px)
          `,
          backgroundSize: '10mm 10mm',
          fontFamily: 'var(--resume-font-family)',
          color: 'var(--resume-text)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          borderRadius: '4px',
        }}
      >
        <div
          className="resume-content h-full"
          style={{
            padding: '15mm',
            overflowY: 'auto',
          }}
        >
          {moduleOrder.map((moduleType, index) => renderModule(moduleType, index))}
        </div>
      </div>
    );
  }
);

ResumePreview.displayName = 'ResumePreview';

export default ResumePreview;
