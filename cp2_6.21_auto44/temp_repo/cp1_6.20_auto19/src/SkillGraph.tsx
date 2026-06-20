import React, { useState, useCallback, memo } from 'react';
import type { Skill } from './types';

interface SkillGraphProps {
  skills: Skill[];
  editable?: boolean;
  onSkillChange?: (skills: Skill[]) => void;
}

interface SkillNodeProps {
  skill: Skill;
  level: number;
  expanded: { [key: string]: boolean };
  editable?: boolean;
  onToggle: (id: string) => void;
  onMasteryChange: (id: string, mastery: number) => void;
}

const SkillNode = memo(function SkillNode({
  skill,
  level,
  expanded,
  editable,
  onToggle,
  onMasteryChange,
}: SkillNodeProps) {
  const isExpanded = expanded[skill.id] ?? true;
  const hasChildren = skill.children && skill.children.length > 0;

  const handleNodeClick = () => {
    if (hasChildren) {
      onToggle(skill.id);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mastery = parseInt(e.target.value, 10);
    onMasteryChange(skill.id, mastery);
  };

  return (
    <div className="skill-node" style={{ '--level': level } as React.CSSProperties}>
      <div className="skill-node__content" onClick={handleNodeClick}>
        <div className="skill-node__connector" />
        <div className="skill-node__main">
          <div className="skill-node__header">
            {hasChildren && (
              <span className={`skill-node__arrow ${isExpanded ? 'skill-node__arrow--expanded' : ''}`}>
                ▶
              </span>
            )}
            <span className="skill-node__name">{skill.name}</span>
            <span className="skill-node__mastery-text">{skill.mastery}%</span>
          </div>
          <div className="skill-node__progress">
            <div
              className="skill-node__progress-bar"
              style={{ width: `${skill.mastery}%` }}
            />
          </div>
          {editable && (
            <input
              type="range"
              min="0"
              max="100"
              value={skill.mastery}
              onChange={handleSliderChange}
              onClick={(e) => e.stopPropagation()}
              className="skill-node__slider"
            />
          )}
        </div>
      </div>
      {hasChildren && (
        <div
          className={`skill-node__children ${isExpanded ? 'skill-node__children--expanded' : ''}`}
        >
          {skill.children!.map((child, index) => (
            <div
              key={child.id}
              className="skill-node__child"
              style={{ '--child-index': index } as React.CSSProperties}
            >
              <SkillNode
                skill={child}
                level={level + 1}
                expanded={expanded}
                editable={editable}
                onToggle={onToggle}
                onMasteryChange={onMasteryChange}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

const updateSkillMastery = (skills: Skill[], id: string, mastery: number): Skill[] => {
  return skills.map((skill) => {
    if (skill.id === id) {
      return { ...skill, mastery };
    }
    if (skill.children) {
      return { ...skill, children: updateSkillMastery(skill.children, id, mastery) };
    }
    return skill;
  });
};

export default function SkillGraph({
  skills,
  editable = false,
  onSkillChange,
}: SkillGraphProps) {
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});

  const handleToggle = useCallback((id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const handleMasteryChange = useCallback(
    (id: string, mastery: number) => {
      if (onSkillChange) {
        const updatedSkills = updateSkillMastery(skills, id, mastery);
        onSkillChange(updatedSkills);
      }
    },
    [skills, onSkillChange]
  );

  return (
    <div className="skill-graph">
      <style>{`
        .skill-graph {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #333;
          padding: 16px;
        }

        .skill-node {
          position: relative;
          padding-left: 24px;
        }

        .skill-node__content {
          display: flex;
          align-items: flex-start;
          cursor: pointer;
          padding: 8px 0;
          transition: background-color 0.3s ease;
        }

        .skill-node__content:hover {
          background-color: #f5f5f5;
        }

        .skill-node__connector {
          position: absolute;
          left: 0;
          top: 24px;
          width: 20px;
          height: 1px;
          background-color: #e0e0e0;
        }

        .skill-node::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 1px;
          background-color: #e0e0e0;
          border-left: 1px dashed #e0e0e0;
        }

        .skill-node:first-child::before {
          top: 24px;
        }

        .skill-node:last-child::before {
          bottom: auto;
          height: 24px;
        }

        .skill-node:only-child::before {
          height: 24px;
        }

        .skill-node__main {
          flex: 1;
          min-width: 0;
        }

        .skill-node__header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .skill-node__arrow {
          display: inline-block;
          font-size: 10px;
          color: #999;
          transition: transform 0.3s ease;
          user-select: none;
        }

        .skill-node__arrow--expanded {
          transform: rotate(90deg);
        }

        .skill-node__name {
          font-weight: 500;
          font-size: 14px;
          flex: 1;
        }

        .skill-node__mastery-text {
          font-size: 12px;
          color: #666;
          font-variant-numeric: tabular-nums;
        }

        .skill-node__progress {
          height: 6px;
          background-color: #e0e0e0;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .skill-node__progress-bar {
          height: 100%;
          background-color: #D4A017;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .skill-node__slider {
          width: 100%;
          height: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          margin-top: 4px;
        }

        .skill-node__slider::-webkit-slider-track {
          height: 4px;
          background: #e0e0e0;
          border-radius: 2px;
        }

        .skill-node__slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          background: #D4A017;
          border-radius: 50%;
          cursor: pointer;
          margin-top: -5px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s ease;
        }

        .skill-node__slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        .skill-node__slider::-moz-range-track {
          height: 4px;
          background: #e0e0e0;
          border-radius: 2px;
        }

        .skill-node__slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          background: #D4A017;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .skill-node__children {
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: max-height 0.3s ease, opacity 0.3s ease;
        }

        .skill-node__children--expanded {
          max-height: 10000px;
          opacity: 1;
        }

        .skill-node__child {
          opacity: 0;
          transform: translateY(10px);
          animation: fadeInUp 0.3s ease forwards;
          animation-delay: calc(var(--child-index) * 50ms);
        }

        .skill-node__children:not(.skill-node__children--expanded) .skill-node__child {
          animation: none;
          opacity: 0;
          transform: translateY(0);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {skills.map((skill) => (
        <SkillNode
          key={skill.id}
          skill={skill}
          level={0}
          expanded={expanded}
          editable={editable}
          onToggle={handleToggle}
          onMasteryChange={handleMasteryChange}
        />
      ))}
    </div>
  );
}
