import React from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import './editors.css';

const PersonalEditor: React.FC = () => {
  const { resumeData, updatePersonalInfo } = useResumeStore();
  const { personalInfo } = resumeData;

  return (
    <div className="editor-form">
      <div className="form-group">
        <label>姓名</label>
        <input
          type="text"
          value={personalInfo.name}
          onChange={(e) => updatePersonalInfo({ name: e.target.value })}
          placeholder="请输入姓名"
        />
      </div>
      <div className="form-group">
        <label>邮箱</label>
        <input
          type="email"
          value={personalInfo.email}
          onChange={(e) => updatePersonalInfo({ email: e.target.value })}
          placeholder="请输入邮箱"
        />
      </div>
      <div className="form-group">
        <label>电话</label>
        <input
          type="tel"
          value={personalInfo.phone}
          onChange={(e) => updatePersonalInfo({ phone: e.target.value })}
          placeholder="请输入电话"
        />
      </div>
      <div className="form-group">
        <label>头像链接</label>
        <input
          type="url"
          value={personalInfo.avatar}
          onChange={(e) => updatePersonalInfo({ avatar: e.target.value })}
          placeholder="请输入头像图片URL"
        />
      </div>
      <div className="form-group">
        <label>个人简介</label>
        <textarea
          value={personalInfo.summary}
          onChange={(e) => updatePersonalInfo({ summary: e.target.value })}
          placeholder="简单介绍一下自己"
          rows={3}
        />
      </div>
    </div>
  );
};

export default PersonalEditor;
