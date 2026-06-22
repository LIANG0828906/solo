import React from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import './editors.css';

const WorkEditor: React.FC = () => {
  const {
    resumeData,
    addWorkExperience,
    updateWorkExperience,
    removeWorkExperience,
  } = useResumeStore();
  const { workExperience } = resumeData;

  return (
    <div className="editor-form">
      {workExperience.map((work, index) => (
        <div key={work.id} className="editor-item">
          <div className="item-header">
            <span className="item-index">工作经历 {index + 1}</span>
            {workExperience.length > 1 && (
              <button
                className="remove-btn"
                onClick={() => removeWorkExperience(work.id)}
              >
                删除
              </button>
            )}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>公司</label>
              <input
                type="text"
                value={work.company}
                onChange={(e) =>
                  updateWorkExperience(work.id, { company: e.target.value })
                }
                placeholder="公司名称"
              />
            </div>
            <div className="form-group">
              <label>职位</label>
              <input
                type="text"
                value={work.position}
                onChange={(e) =>
                  updateWorkExperience(work.id, { position: e.target.value })
                }
                placeholder="担任职位"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>开始时间</label>
              <input
                type="text"
                value={work.startDate}
                onChange={(e) =>
                  updateWorkExperience(work.id, { startDate: e.target.value })
                }
                placeholder="2021-03"
              />
            </div>
            <div className="form-group">
              <label>结束时间</label>
              <input
                type="text"
                value={work.endDate}
                onChange={(e) =>
                  updateWorkExperience(work.id, { endDate: e.target.value })
                }
                placeholder="至今"
              />
            </div>
          </div>
          <div className="form-group">
            <label>工作描述</label>
            <textarea
              value={work.description}
              onChange={(e) =>
                updateWorkExperience(work.id, { description: e.target.value })
              }
              placeholder="工作职责和成就"
              rows={3}
            />
          </div>
        </div>
      ))}
      <button className="add-btn" onClick={addWorkExperience}>
        + 添加工作经历
      </button>
    </div>
  );
};

export default WorkEditor;
