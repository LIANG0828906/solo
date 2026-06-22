import React, { useState } from 'react';

export interface BasicInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  summary: string;
}

export interface Education {
  id: string;
  school: string;
  major: string;
  period: string;
  description: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  period: string;
  description: string;
}

export interface Skill {
  name: string;
  value: number;
}

export interface ResumeData {
  basicInfo: BasicInfo;
  education: Education[];
  workExperience: WorkExperience[];
  skills: Skill[];
}

interface ResumeFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const ResumeForm: React.FC<ResumeFormProps> = ({ data, onChange }) => {
  const [draggedItem, setDraggedItem] = useState<{ type: string; index: number } | null>(null);

  const handleBasicInfoChange = (field: keyof BasicInfo, value: string) => {
    onChange({
      ...data,
      basicInfo: { ...data.basicInfo, [field]: value }
    });
  };

  const handleEducationChange = (index: number, field: keyof Education, value: string) => {
    const newEducation = [...data.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    onChange({ ...data, education: newEducation });
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      school: '',
      major: '',
      period: '',
      description: ''
    };
    onChange({ ...data, education: [...data.education, newEdu] });
  };

  const removeEducation = (index: number) => {
    const newEducation = data.education.filter((_, i) => i !== index);
    onChange({ ...data, education: newEducation });
  };

  const handleWorkChange = (index: number, field: keyof WorkExperience, value: string) => {
    const newWork = [...data.workExperience];
    newWork[index] = { ...newWork[index], [field]: value };
    onChange({ ...data, workExperience: newWork });
  };

  const addWork = () => {
    const newWork: WorkExperience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      period: '',
      description: ''
    };
    onChange({ ...data, workExperience: [...data.workExperience, newWork] });
  };

  const removeWork = (index: number) => {
    const newWork = data.workExperience.filter((_, i) => i !== index);
    onChange({ ...data, workExperience: newWork });
  };

  const handleSkillChange = (index: number, field: keyof Skill, value: string | number) => {
    const newSkills = [...data.skills];
    newSkills[index] = { ...newSkills[index], [field]: value };
    onChange({ ...data, skills: newSkills });
  };

  const addSkill = () => {
    if (data.skills.length >= 6) return;
    const newSkill: Skill = { name: '', value: 70 };
    onChange({ ...data, skills: [...data.skills, newSkill] });
  };

  const removeSkill = (index: number) => {
    const newSkills = data.skills.filter((_, i) => i !== index);
    onChange({ ...data, skills: newSkills });
  };

  const handleDragStart = (type: string, index: number) => {
    setDraggedItem({ type, index });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleEducationDrop = (dropIndex: number) => {
    if (!draggedItem || draggedItem.type !== 'education') return;

    const list = [...data.education];
    const [removed] = list.splice(draggedItem.index, 1);
    list.splice(dropIndex, 0, removed);
    onChange({ ...data, education: list });
    setDraggedItem(null);
  };

  const handleWorkDrop = (dropIndex: number) => {
    if (!draggedItem || draggedItem.type !== 'work') return;

    const list = [...data.workExperience];
    const [removed] = list.splice(draggedItem.index, 1);
    list.splice(dropIndex, 0, removed);
    onChange({ ...data, workExperience: list });
    setDraggedItem(null);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.sectionTitle}>基本信息</h2>
      <div style={styles.inputGroup}>
        <label style={styles.label}>姓名</label>
        <input
          style={styles.input}
          value={data.basicInfo.name}
          onChange={(e) => handleBasicInfoChange('name', e.target.value)}
          placeholder="请输入姓名"
        />
      </div>
      <div style={styles.inputGroup}>
        <label style={styles.label}>职位</label>
        <input
          style={styles.input}
          value={data.basicInfo.title}
          onChange={(e) => handleBasicInfoChange('title', e.target.value)}
          placeholder="请输入目标职位"
        />
      </div>
      <div style={styles.row}>
        <div style={{ ...styles.inputGroup, flex: 1 }}>
          <label style={styles.label}>邮箱</label>
          <input
            style={styles.input}
            type="email"
            value={data.basicInfo.email}
            onChange={(e) => handleBasicInfoChange('email', e.target.value)}
            placeholder="your@email.com"
          />
        </div>
        <div style={{ ...styles.inputGroup, flex: 1, marginLeft: '12px' }}>
          <label style={styles.label}>电话</label>
          <input
            style={styles.input}
            type="tel"
            value={data.basicInfo.phone}
            onChange={(e) => handleBasicInfoChange('phone', e.target.value)}
            placeholder="138-xxxx-xxxx"
          />
        </div>
      </div>
      <div style={styles.inputGroup}>
        <label style={styles.label}>个人简介</label>
        <textarea
          style={{ ...styles.input, ...styles.textarea }}
          value={data.basicInfo.summary}
          onChange={(e) => handleBasicInfoChange('summary', e.target.value)}
          placeholder="简要介绍自己..."
          rows={4}
        />
      </div>

      <div style={styles.divider} />

      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>教育经历</h2>
        <button style={styles.addButton} onClick={addEducation}>+ 添加</button>
      </div>
      {data.education.map((edu, index) => (
        <div
          key={edu.id}
          draggable
          onDragStart={() => handleDragStart('education', index)}
          onDragOver={handleDragOver}
          onDrop={() => handleEducationDrop(index)}
          style={{
            ...styles.itemCard,
            opacity: draggedItem?.type === 'education' && draggedItem.index === index ? 0.5 : 1
          }}
        >
          <div style={styles.dragHandle}>⋮⋮</div>
          <div style={styles.itemContent}>
            <div style={styles.row}>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>学校</label>
                <input
                  style={styles.input}
                  value={edu.school}
                  onChange={(e) => handleEducationChange(index, 'school', e.target.value)}
                  placeholder="学校名称"
                />
              </div>
              <div style={{ ...styles.inputGroup, flex: 1, marginLeft: '12px' }}>
                <label style={styles.label}>专业</label>
                <input
                  style={styles.input}
                  value={edu.major}
                  onChange={(e) => handleEducationChange(index, 'major', e.target.value)}
                  placeholder="专业名称"
                />
              </div>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>时间</label>
              <input
                style={styles.input}
                value={edu.period}
                onChange={(e) => handleEducationChange(index, 'period', e.target.value)}
                placeholder="2018.09 - 2022.06"
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>描述</label>
              <textarea
                style={{ ...styles.input, ...styles.textarea }}
                value={edu.description}
                onChange={(e) => handleEducationChange(index, 'description', e.target.value)}
                placeholder="学习经历、获奖情况等..."
                rows={2}
              />
            </div>
            <button
              style={styles.removeButton}
              onClick={() => removeEducation(index)}
            >
              删除
            </button>
          </div>
        </div>
      ))}

      <div style={styles.divider} />

      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>工作经历</h2>
        <button style={styles.addButton} onClick={addWork}>+ 添加</button>
      </div>
      {data.workExperience.map((work, index) => (
        <div
          key={work.id}
          draggable
          onDragStart={() => handleDragStart('work', index)}
          onDragOver={handleDragOver}
          onDrop={() => handleWorkDrop(index)}
          style={{
            ...styles.itemCard,
            opacity: draggedItem?.type === 'work' && draggedItem.index === index ? 0.5 : 1
          }}
        >
          <div style={styles.dragHandle}>⋮⋮</div>
          <div style={styles.itemContent}>
            <div style={styles.row}>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>公司</label>
                <input
                  style={styles.input}
                  value={work.company}
                  onChange={(e) => handleWorkChange(index, 'company', e.target.value)}
                  placeholder="公司名称"
                />
              </div>
              <div style={{ ...styles.inputGroup, flex: 1, marginLeft: '12px' }}>
                <label style={styles.label}>职位</label>
                <input
                  style={styles.input}
                  value={work.position}
                  onChange={(e) => handleWorkChange(index, 'position', e.target.value)}
                  placeholder="职位名称"
                />
              </div>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>时间</label>
              <input
                style={styles.input}
                value={work.period}
                onChange={(e) => handleWorkChange(index, 'period', e.target.value)}
                placeholder="2022.07 - 至今"
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>工作内容</label>
              <textarea
                style={{ ...styles.input, ...styles.textarea }}
                value={work.description}
                onChange={(e) => handleWorkChange(index, 'description', e.target.value)}
                placeholder="工作内容、项目经验、成果等..."
                rows={3}
              />
            </div>
            <button
              style={styles.removeButton}
              onClick={() => removeWork(index)}
            >
              删除
            </button>
          </div>
        </div>
      ))}

      <div style={styles.divider} />

      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>技能标签</h2>
        <button
          style={styles.addButton}
          onClick={addSkill}
          disabled={data.skills.length >= 6}
        >
          + 添加
        </button>
      </div>
      <div style={styles.skillsContainer}>
        {data.skills.map((skill, index) => (
          <div key={index} style={styles.skillItem}>
            <input
              style={{ ...styles.input, ...styles.skillNameInput }}
              value={skill.name}
              onChange={(e) => handleSkillChange(index, 'name', e.target.value)}
              placeholder="技能名"
            />
            <input
              type="range"
              min="0"
              max="100"
              value={skill.value}
              onChange={(e) => handleSkillChange(index, 'value', parseInt(e.target.value))}
              style={styles.skillSlider}
            />
            <span style={styles.skillValue}>{skill.value}%</span>
            <button
              style={styles.skillRemove}
              onClick={() => removeSkill(index)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    overflowY: 'auto',
    height: '100%'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '16px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  inputGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#555',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
    outline: 'none',
    backgroundColor: '#fff'
  },
  textarea: {
    resize: 'vertical',
    minHeight: '60px',
    fontFamily: 'inherit'
  },
  row: {
    display: 'flex'
  },
  divider: {
    height: '1px',
    backgroundColor: '#e0e0e0',
    margin: '24px 0',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  addButton: {
    padding: '6px 16px',
    backgroundColor: '#4a90d9',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'background-color 0.2s'
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    gap: '12px',
    transition: 'opacity 0.2s'
  },
  dragHandle: {
    cursor: 'grab',
    color: '#aaa',
    fontSize: '18px',
    userSelect: 'none',
    paddingTop: '30px'
  },
  itemContent: {
    flex: 1,
    position: 'relative'
  },
  removeButton: {
    position: 'absolute',
    top: '0',
    right: '0',
    padding: '4px 10px',
    backgroundColor: '#ff4757',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'background-color 0.2s'
  },
  skillsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  skillItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#fff',
    padding: '10px 12px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  skillNameInput: {
    width: '100px',
    padding: '6px 8px',
    fontSize: '13px'
  },
  skillSlider: {
    flex: 1,
    cursor: 'pointer'
  },
  skillValue: {
    width: '45px',
    fontSize: '13px',
    color: '#666',
    textAlign: 'right'
  },
  skillRemove: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#ff4757',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '16px',
    lineHeight: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};

export default ResumeForm;
