import React from 'react';
import type { Transition, Clip, TransitionType } from '../../types';
import { ArrowRight, Move, Maximize2 } from 'lucide-react';

interface TransitionOverlayProps {
  transitions: Transition[];
  clips: Clip[];
  timeToPixel: (time: number) => number;
  onTransitionDragStart?: (type: TransitionType, e: React.DragEvent) => void;
}

const transitionConfig: Record<TransitionType, { label: string; icon: React.ReactNode; color: string }> = {
  fade: {
    label: '淡入淡出',
    icon: <Move size={14} />,
    color: 'rgba(74, 144, 217, 0.4)',
  },
  slide: {
    label: '滑动',
    icon: <ArrowRight size={14} />,
    color: 'rgba(107, 179, 240, 0.4)',
  },
  zoom: {
    label: '缩放',
    icon: <Maximize2 size={14} />,
    color: 'rgba(143, 211, 244, 0.4)',
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
    const transitionEnd = fromClip.endTime;

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
            className="transition-block"
            style={{
              left: position.left,
              width: position.width,
              background: config.color,
            }}
            title={`${config.label} (${transition.duration.toFixed(1)}s)`}
          >
            <div className="transition-icon">
              {config.icon}
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
                  className="transition-item"
                  draggable
                  onDragStart={(e) => onTransitionDragStart(type, e)}
                  title={`拖拽应用${config.label}`}
                >
                  <div
                    className="transition-preview"
                    style={{ background: config.color }}
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
