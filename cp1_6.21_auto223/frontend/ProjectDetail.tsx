import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from './context';
import { TAG_COLOR_MAP, STATUS_LABELS, TagColor, TaskTag } from './types';

const DonutChart: React.FC<{ data: { name: string; color: string; value: number }[] }> = ({
  data,
}) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const size = 160;
  const radius = 60;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 24;

  if (total === 0) {
    return (
      <div className="donut-container">
        <svg width={size} height={size}>
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#334155"
            strokeWidth={strokeWidth}
          />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="#94A3B8" fontSize="14">
            暂无数据
          </text>
        </svg>
      </div>
    );
  }

  let cumulative = 0;
  const circumference = 2 * Math.PI * radius;

  const segments = data.map((d) => {
    const fraction = d.value / total;
    const length = fraction * circumference;
    const offset = -cumulative * circumference;
    cumulative += fraction;
    return { ...d, length, offset };
  });

  return (
    <div className="donut-container">
      <svg width={size} height={size}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#334155"
          strokeWidth={strokeWidth}
        />
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${seg.length} ${circumference - seg.length}`}
            strokeDashoffset={seg.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease' }}
          />
        ))}
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#F8FAFC" fontSize="24" fontWeight="700">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#94A3B8" fontSize="12">
          任务标签
        </text>
      </svg>
      <div className="donut-legend">
        {segments.map((seg, i) => (
          <div key={i} className="legend-item">
            <span className="legend-color" style={{ background: seg.color }} />
            <span>{seg.name}</span>
            <span style={{ marginLeft: 'auto', color: '#94A3B8' }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, tasks, users } = useApp();

  const project = projects.find((p) => p.id === id);

  const projectTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.projectId === id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [tasks, id]
  );

  const members = useMemo(
    () => users.filter((u) => project?.memberIds.includes(u.id)),
    [users, project]
  );

  const tagStats = useMemo(() => {
    const map = new Map<string, { name: string; color: string; value: number }>();
    projectTasks.forEach((task) => {
      task.tags.forEach((tag: TaskTag) => {
        const existing = map.get(tag.id);
        if (existing) {
          existing.value++;
        } else {
          map.set(tag.id, {
            name: tag.name,
            color: TAG_COLOR_MAP[tag.color as TagColor],
            value: 1,
          });
        }
      });
    });
    return Array.from(map.values());
  }, [projectTasks]);

  if (!project) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: 48 }}>📭</div>
        <div>项目不存在</div>
        <button className="accent" onClick={() => navigate('/')}>
          返回看板
        </button>
      </div>
    );
  }

  return (
    <div className="detail-layout">
      <div className="detail-sidebar">
        <div className="sidebar-section">
          <h3>项目成员</h3>
          <div className="member-list">
            {members.length === 0 && (
              <div style={{ fontSize: 12, color: '#94A3B8' }}>暂无成员</div>
            )}
            {members.map((m) => (
              <div key={m.id} className="member-item">
                <div className="member-avatar">{m.avatar}</div>
                <div className="member-name">{m.username}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <h3>标签统计</h3>
          <DonutChart data={tagStats} />
        </div>
      </div>

      <div className="detail-main">
        <div className="detail-header">
          <div className="detail-header-info">
            <h2>{project.name}</h2>
            <p>{project.description || '暂无描述'}</p>
            <div className="detail-meta">
              {project.deadline && <span>📅 截止: {project.deadline}</span>}
              <span>
                📋 共 {projectTasks.length} 个任务
              </span>
              <span>
                👥 {members.length} 位成员
              </span>
            </div>
          </div>
          <button onClick={() => navigate('/')}>← 返回看板</button>
        </div>

        <div className="tasks-table">
          <div className="tasks-table-header">
            <div>任务</div>
            <div>状态</div>
            <div>负责人</div>
            <div>标签</div>
            <div>工时</div>
          </div>
          {projectTasks.length === 0 ? (
            <div className="empty-state">暂无任务，请在看板中添加</div>
          ) : (
            projectTasks.map((task) => {
              const assignee = users.find((u) => u.id === task.assigneeId);
              return (
                <div key={task.id} className="tasks-table-row">
                  <div>
                    <div style={{ fontWeight: 500 }}>{task.title}</div>
                    {task.blockedReason && (
                      <div className="blocked-indicator" style={{ marginTop: 4 }}>
                        阻塞: {task.blockedReason}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className={`status-badge status-${task.status}`}>
                      {STATUS_LABELS[task.status]}
                    </span>
                  </div>
                  <div>
                    {assignee ? (
                      <div className="member-item">
                        <div
                          className="member-avatar"
                          style={{ width: 24, height: 24, fontSize: 11 }}
                        >
                          {assignee.avatar}
                        </div>
                        <span style={{ fontSize: 12 }}>{assignee.username}</span>
                      </div>
                    ) : (
                      <span style={{ color: '#94A3B8', fontSize: 12 }}>未指派</span>
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {task.tags.length === 0 ? (
                        <span style={{ color: '#94A3B8', fontSize: 12 }}>-</span>
                      ) : (
                        task.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="task-tag"
                            style={{ background: TAG_COLOR_MAP[tag.color as TagColor] }}
                          >
                            {tag.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    {task.estimatedHours > 0 ? (
                      <span style={{ color: '#94A3B8', fontSize: 12 }}>
                        {task.estimatedHours}h
                      </span>
                    ) : (
                      <span style={{ color: '#94A3B8', fontSize: 12 }}>-</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
