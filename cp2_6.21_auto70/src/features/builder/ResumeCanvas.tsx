import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { TEMPLATES } from '@/types/resume';
import PersonalSection from './sections/PersonalSection';
import EducationSection from './sections/EducationSection';
import WorkSection from './sections/WorkSection';
import SkillsSection from './sections/SkillsSection';
import ProjectsSection from './sections/ProjectsSection';
import CustomSection from './sections/CustomSection';
import './ResumeCanvas.css';

const CANVAS_WIDTH = 794;
const CANVAS_HEIGHT = 1123;

const ResumeCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { resumeData, zoom, setZoom, activeModuleId } = useResumeStore();
  const [renderKey, setRenderKey] = useState(0);

  const template = useMemo(() => {
    return TEMPLATES.find((t) => t.id === resumeData.templateId) || TEMPLATES[0];
  }, [resumeData.templateId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRenderKey((k) => k + 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [resumeData]);

  const visibleModules = resumeData.modules.filter((m) => m.visible);

  const renderModule = (moduleId: string, moduleType: string) => {
    switch (moduleType) {
      case 'personal':
        return <PersonalSection template={template} />;
      case 'education':
        return <EducationSection template={template} />;
      case 'work':
        return <WorkSection template={template} />;
      case 'skills':
        return <SkillsSection template={template} />;
      case 'projects':
        return <ProjectsSection template={template} />;
      case 'custom':
        return <CustomSection template={template} />;
      default:
        return null;
    }
  };

  const canvasStyle = {
    background: template.colors.background,
    color: template.colors.text,
    fontFamily: template.fonts.body,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  };

  return (
    <div className="canvas-container">
      <div className="canvas-toolbar">
        <div className="zoom-control">
          <span className="zoom-label">缩放</span>
          <input
            type="range"
            min="0.7"
            max="1.5"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="zoom-slider"
          />
          <span className="zoom-value">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div className="canvas-wrapper">
        <div
          className="canvas-scale-wrapper"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
          }}
        >
          <div
            ref={canvasRef}
            id="resume-canvas"
            className="resume-canvas"
            style={canvasStyle}
            key={renderKey}
          >
            <div className="canvas-content">
              {visibleModules.map((module) => (
                <div
                  key={module.id}
                  className={`canvas-module ${
                    activeModuleId === module.id ? 'active-highlight' : ''
                  }`}
                  style={{
                    '--module-accent': template.colors.accent,
                  } as React.CSSProperties}
                >
                  {renderModule(module.id, module.type)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeCanvas;
