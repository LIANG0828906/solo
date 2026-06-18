import React from 'react';
import type { Transition, Clip, TransitionType } from '../../types';
import { ArrowRight, Move, Maximize2 } from 'lucide-react';
import './TransitionOverlay.css';

interface TransitionOverlayProps {
  transitions: Transition[];
  clips: Clip[];
  timeToPixel: (time: number) => number;
  onTransitionDragStart?: (type: TransitionType, e: React.DragEvent) => void;
}

const transitionConfig: Record<TransitionType, { 
  label: string; 
  icon: React.ReactNode; 
  color: string;
  gradient: string;
  pattern: 'fade' | 'slide' | 'zoom';
}> = {
  fade: {
    label: '淡入淡出',
    icon: <Move size={14} />,
    color: 'rgba(74, 144, 217, 0.4)',
    gradient: 'linear-gradient(90deg, rgba(74, 144, 217, 0.1) 0%, rgba(74, 144, 217, 0.5) 50%, rgba(74, 144, 217, 0.1) 100%)',
    pattern: 'fade',
  },
  slide: {
    label: '滑动',
    icon: <ArrowRight size={14} />,
    color: 'rgba(107, 179, 240, 0.4)',
    gradient: 'linear-gradient(90deg, rgba(107, 179, 240, 0.6) 0%, rgba(107, 179, 240, 0.2) 100%)',
    pattern: 'slide',
  },
  zoom: {
    label: '缩放',
    icon: <Maximize2 size={14} />,
    color: 'rgba(143, 211, 244, 0.4)',
    gradient: 'radial-gradient(circle at center, rgba(143, 211, 244, 0.6) 0%, rgba(143, 211, 244, 0.1) 100%)',
    pattern: 'zoom',
  },
};

const TransitionOverlay: React.FC<TransitionOverlayProps> = ({
  transitions,
  clips,
  timeToPixel,
  onTransitionDragStart,
}) => {
  const getTransitionPosition = (transition: Transition) => {
    const fromClip = clips.find(c => c.id === transition.fromClipId);
    if (!fromClip) return null;

    const transitionStart = fromClip.endTime - transition.duration;

    return {
      left: timeToPixel(transitionStart),
      width: timeToPixel(transition.duration),
    };
  };

  return (
    <div className="transition-overlay">
      {transitions.map((transition) => {
        const position = getTransitionPosition(transition);
        if (!position) return null;

        const config = transitionConfig[transition.type];

        return (
          <div
            key={transition.id}
            className={`transition-block transition-${transition.type}`}
            style={{
              left: position.left,
              width: position.width,
              background: config.gradient,
            }}
            title={`${config.label} (${transition.duration.toFixed(1)}s)`}
          >
            <div className="transition-visual">
              {config.pattern === 'fade' && (
                <>
                  <div className="fade-effect fade-left" />
                  <div className="fade-effect fade-center">
                    {config.icon}
                  </div>
                  <div className="fade-effect fade-right" />
                </>
              )}
              {config.pattern === 'slide' && (
                <>
                  <div className="slide-effect slide-bar" />
                  <div className="slide-effect slide-icon">
                    {config.icon}
                  </div>
                </>
              )}
              {config.pattern === 'zoom' && (
                <>
                  <div className="zoom-effect zoom-ring ring-1" />
                  <div className="zoom-effect zoom-ring ring-2" />
                  <div className="zoom-effect zoom-icon">
                    {config.icon}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}

      {onTransitionDragStart && (
        <div className="transition-palette">
          <div className="palette-title">转场效果</div>
          <div className="palette-items">
            {(Object.keys(transitionConfig) as TransitionType[]).map((type) => {
              const config = transitionConfig[type];
              return (
                <div
                  key={type}
                  className={`transition-item transition-item-${type}`}
                  draggable
                  onDragStart={(e) => onTransitionDragStart(type, e)}
                  title={`拖拽应用${config.label}转场`}
                >
                  <div
                    className="transition-preview"
                    style={{ background: config.gradient }}
                  >
                    {config.icon}
                  </div>
                  <span>{config.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(TransitionOverlay);
