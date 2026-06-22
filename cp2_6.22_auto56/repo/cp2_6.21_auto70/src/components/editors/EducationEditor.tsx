import React from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import './editors.css';

const EducationEditor: React.FC = () => {
  const { resumeData, addEducation, updateEducation, removeEducation } =
    useResumeStore();
  const { education } = resumeData;

  return (
    <div className="editor-form">
      {education.map((edu, index) => (
        <div key={edu.id} className="editor-item">
          <div className="item-header">
            <span className="item-index">教育经历 {index + 1}</span>
            {education.length > 1 && (
              <button
                className="remove-btn"
                onClick={() => removeEducation(edu.id)}
              >
                删除
              </button>
            )}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>学校</label>
              <input
                type="text"
                value={edu.school}
                onChange={(e) =>
                  updateEducation(edu.id, { school: e.target.value })
                }
                placeholder="学校名称"
              />
            </div>
            <div className="form-group">
              <label>学历</label>
              <input
                type="text"
                value={edu.degree}
                onChange={(e) =>
                  updateEducation(edu.id, { degree: e.target.value })
                }
                placeholder="本科/硕士/博士"
              />
            </div>
          </div>
          <div className="form-group">
            <label>专业</label>
            <input
              type="text"
              value={edu.major}
              onChange={(e) =>
                updateEducation(edu.id, { major: e.target.value })
              }
              placeholder="所学专业"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>开始时间</label>
              <input
                type="text"
                value={edu.startDate}
                onChange={(e) =>
                  updateEducation(edu.id, { startDate: e.target.value })
                }
                placeholder="2015-09"
              />
            </div>
            <div className="form-group">
              <label>结束时间</label>
              <input
                type="text"
                value={edu.endDate}
                onChange={(e) =>
                  updateEducation(edu.id, { endDate: e.target.value })
                }
                placeholder="2019-06"
              />
            </div>
          </div>
          <div className="form-group">
            <label>描述</label>
            <textarea
              value={edu.description}
              onChange={(e) =>
                updateEducation(edu.id, { description: e.target.value })
              }
              placeholder="补充说明"
              rows={2}
            />
          </div>
        </div>
      ))}
      <button className="add-btn" onClick={addEducation}>
        + 添加教育经历
      </button>
    </div>
  );
};

export default EducationEditor;
