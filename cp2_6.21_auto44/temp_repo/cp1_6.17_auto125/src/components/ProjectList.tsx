import React from 'react';
import { useProjectStore } from '../store/projectStore';
import { formatDate, getProjectColor } from '../utils';
import type { Project } from '../types';

interface ProjectListProps {
  currentProjectId: string | null;
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  sidebarOpen: boolean;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  currentProjectId,
  onSelectProject,
  onCreateProject,
  sidebarOpen
}) => {
  const { projects } = useProjectStore();

  return (
    <>
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => {}} />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>🧵 皮具手作志</h1>
          <p>记录每一件作品的诞生</p>
        </div>
        <div className="sidebar-create">
          <button className="btn-create" onClick={onCreateProject}>
            + 新建项目
          </button>
        </div>
        <div className="sidebar-content">
          {projects.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d', fontSize: '13px' }}>
              暂无项目，点击上方按钮创建
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className={`project-item ${currentProjectId === project.id ? 'active' : ''}`}
                style={{ borderLeftColor: getProjectColor(project.createdAt) }}
                onClick={() => onSelectProject(project)}
              >
                <div className="project-item-inner">
                  <div
                    className="project-item-cover"
                    style={{ background: `linear-gradient(135deg, ${getProjectColor(project.createdAt)}, ${getProjectColor(project.createdAt + 100000)})` }}
                  >
                    🧶
                  </div>
                  <div className="project-item-info">
                    <div className="project-item-title">{project.name}</div>
                    <div className="project-item-time">
                      {formatDate(project.updatedAt)} · {project.steps.length}个步骤
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
};
