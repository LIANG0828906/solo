import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
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

const ZOOM_PRESETS = [
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1 },
  { label: '150%', value: 1.5 },
];

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

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

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom + 0.1, MAX_ZOOM);
    setZoom(Number(newZoom.toFixed(2)));
  }, [zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom - 0.1, MIN_ZOOM);
    setZoom(Number(newZoom.toFixed(2)));
  }, [zoom, setZoom]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setZoom(Number(e.target.value));
    },
    [setZoom]
  );

  const handlePresetClick = useCallback(
    (value: number) => {
      setZoom(value);
    },
    [setZoom]
  );

  const canvasStyle = {
    background: template.colors.background,
    color: template.colors.text,
    fontFamily: template.fonts.body,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  };

  const scaledWidth = CANVAS_WIDTH * zoom;
  const scaledHeight = CANVAS_HEIGHT * zoom;

  return (
    <div className="canvas-container">
      <div className="canvas-toolbar">
        <div className="zoom-control-group">
          <button
            className="zoom-btn zoom-out-btn"
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            title="缩小"
          >
            −
          </button>
          <div className="zoom-slider-wrapper">
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step="0.05"
              value={zoom}
              onChange={handleSliderChange}
              className="zoom-slider"
            />
          </div>
          <button
            className="zoom-btn zoom-in-btn"
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            title="放大"
          >
            +
          </button>
          <div className="zoom-display" title="点击重置为100%" onClick={() => handlePresetClick(1)}>
            {Math.round(zoom * 100)}%
          </div>
        </div>

        <div className="zoom-preset-group">
          {ZOOM_PRESETS.map((preset) => (
            <button
              key={preset.value}
              className={`zoom-preset-btn ${
                Math.abs(zoom - preset.value) < 0.01 ? 'active' : ''
              }`}
              onClick={() => handlePresetClick(preset.value)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="canvas-wrapper">
        <div
          className="canvas-scale-wrapper"
          style={{
            width: scaledWidth,
            height: scaledHeight,
          }}
        >
          <div
            className="canvas-inner"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
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

      <div className="canvas-bottom-toolbar">
        <div className="zoom-info">
          <span className="canvas-size-info">
            画布尺寸: {CANVAS_WIDTH} × {CANVAS_HEIGHT} px (A4)
          </span>
          <span className="canvas-scale-info">
            显示尺寸: {Math.round(scaledWidth)} × {Math.round(scaledHeight)} px
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResumeCanvas;
