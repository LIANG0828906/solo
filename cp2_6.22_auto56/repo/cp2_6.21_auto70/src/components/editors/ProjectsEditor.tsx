import React from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import './editors.css';

const ProjectsEditor: React.FC = () => {
  const { resumeData, addProject, updateProject, removeProject } =
    useResumeStore();
  const { projects } = resumeData;

  return (
    <div className="editor-form">
      {projects.map((project, index) => (
        <div key={project.id} className="editor-item">
          <div className="item-header">
            <span className="item-index">项目 {index + 1}</span>
            {projects.length > 1 && (
              <button
                className="remove-btn"
                onClick={() => removeProject(project.id)}
              >
                删除
              </button>
            )}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>项目名称</label>
              <input
                type="text"
                value={project.name}
                onChange={(e) =>
                  updateProject(project.id, { name: e.target.value })
                }
                placeholder="项目名称"
              />
            </div>
            <div className="form-group">
              <label>担任角色</label>
              <input
                type="text"
                value={project.role}
                onChange={(e) =>
                  updateProject(project.id, { role: e.target.value })
                }
                placeholder="前端负责人"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>开始时间</label>
              <input
                type="text"
                value={project.startDate}
                onChange={(e) =>
                  updateProject(project.id, { startDate: e.target.value })
                }
                placeholder="2022-01"
              />
            </div>
            <div className="form-group">
              <label>结束时间</label>
              <input
                type="text"
                value={project.endDate}
                onChange={(e) =>
                  updateProject(project.id, { endDate: e.target.value })
                }
                placeholder="2023-06"
              />
            </div>
          </div>
          <div className="form-group">
            <label>项目描述</label>
            <textarea
              value={project.description}
              onChange={(e) =>
                updateProject(project.id, { description: e.target.value })
              }
              placeholder="项目介绍和你的贡献"
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>技术栈（用逗号分隔）</label>
            <input
              type="text"
              value={project.technologies?.join(', ') || ''}
              onChange={(e) =>
                updateProject(project.id, {
                  technologies: e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter((t) => t),
                })
              }
              placeholder="React, TypeScript, Node.js"
            />
          </div>
        </div>
      ))}
      <button className="add-btn" onClick={addProject}>
        + 添加项目
      </button>
    </div>
  );
};

export default ProjectsEditor;
