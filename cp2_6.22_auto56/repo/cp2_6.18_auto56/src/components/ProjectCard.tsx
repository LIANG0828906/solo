import React, { memo, useMemo } from 'react';
import { Project, PROJECT_TYPE_COLORS, STATUS_COLORS, STAGE_NAMES } from '../types';
import { useAppStore } from '../store';

interface Props {
  project: Project;
}

function getCountdown(deadline: string, status: string): { label: string; cls: string } {
  if (status === '已完成') return { label: '已完成', cls: 'done' };
  const target = new Date(deadline + 'T23:59:59').getTime();
  if (isNaN(target)) return { label: '--', cls: '' };
  const diffMs = target - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `逾期${-diffDays}天`, cls: 'urgent' };
  if (diffDays === 0) return { label: '今日截止', cls: 'urgent' };
  if (diffDays <= 3) return { label: `${diffDays}天后`, cls: 'urgent' };
  if (diffDays <= 7) return { label: `${diffDays}天后`, cls: '' };
  return { label: `${diffDays}天后`, cls: '' };
}

function abbrEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 1) return email;
  const name = email.slice(0, at);
  const domain = email.slice(at);
  const shown = name.length > 4 ? name.slice(0, 4) + '…' : name;
  return shown + domain;
}

const ProjectCard: React.FC<Props> = memo(function ProjectCard({ project }) {
  const selectProject = useAppStore((s) => s.selectProject);
  const typeColor = PROJECT_TYPE_COLORS[project.projectType];
  const statusColor = STATUS_COLORS[project.status];
  const countdown = useMemo(() => getCountdown(project.deadline, project.status), [project.deadline, project.status]);
  const emailShort = useMemo(() => abbrEmail(project.clientEmail), [project.clientEmail]);

  const handleClick = () => selectProject(project.id);

  return (
    <div
      className="card"
      style={{ ['--type-color' as any]: typeColor }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
    >
      <div className="card-header">
        <p className="card-name" title={project.name}>{project.name}</p>
        <span className="status-tag" style={{ background: statusColor }}>{project.status}</span>
      </div>

      <div className="card-client" title={project.clientEmail}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        <span>{emailShort}</span>
      </div>

      <div className="card-deadline">
        <span>截止：{project.deadline}</span>
        <span className={`countdown ${countdown.cls}`}>{countdown.label}</span>
      </div>

      <div className="progress" aria-label="阶段进度">
        {project.stages.map((stage) => {
          const segColor = typeColor;
          const segLight = typeColor + '99';
          const cls = stage.confirmed ? 'completed' : stage.status === 'active' ? 'active' : '';
          return (
            <div
              key={stage.id}
              className={`progress-segment ${cls}`}
              title={`${stage.name}${stage.confirmed ? '（已确认）' : stage.status === 'active' ? '（进行中）' : ''}`}
              style={{
                ['--seg-color' as any]: segColor,
                ['--seg-color-light' as any]: segLight,
              }}
            />
          );
        })}
      </div>
      <div className="progress-labels">
        {STAGE_NAMES.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  );
});

export default ProjectCard;
