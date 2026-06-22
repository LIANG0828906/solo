import React from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import './editors.css';

const CustomEditor: React.FC = () => {
  const {
    resumeData,
    addCustomSection,
    updateCustomSection,
    removeCustomSection,
  } = useResumeStore();
  const { customSections } = resumeData;

  return (
    <div className="editor-form">
      {customSections.map((section, index) => (
        <div key={section.id} className="editor-item">
          <div className="item-header">
            <span className="item-index">自定义区块 {index + 1}</span>
            {customSections.length > 1 && (
              <button
                className="remove-btn"
                onClick={() => removeCustomSection(section.id)}
              >
                删除
              </button>
            )}
          </div>
          <div className="form-group">
            <label>区块标题</label>
            <input
              type="text"
              value={section.title}
              onChange={(e) =>
                updateCustomSection(section.id, { title: e.target.value })
              }
              placeholder="区块标题"
            />
          </div>
          <div className="form-group">
            <label>内容</label>
            <textarea
              value={section.content}
              onChange={(e) =>
                updateCustomSection(section.id, { content: e.target.value })
              }
              placeholder="填写内容，支持换行"
              rows={4}
            />
          </div>
        </div>
      ))}
      <button className="add-btn" onClick={addCustomSection}>
        + 添加自定义区块
      </button>
    </div>
  );
};

export default CustomEditor;
