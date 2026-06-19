import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, User, GraduationCap, Briefcase } from 'lucide-react';
import { PersonalInfo, Education, WorkExperience } from './hooks/useResumeState';

interface EditorPanelProps {
  personalInfo: PersonalInfo;
  education: Education[];
  workExperience: WorkExperience[];
  updatePersonalInfo: (field: keyof PersonalInfo, value: string) => void;
  addEducation: () => void;
  updateEducation: (id: string, field: keyof Education, value: string) => void;
  removeEducation: (id: string) => void;
  addWorkExperience: () => void;
  updateWorkExperience: (id: string, field: keyof Omit<WorkExperience, 'highlights'>, value: string) => void;
  updateWorkHighlight: (workId: string, highlightIndex: number, value: string) => void;
  addWorkHighlight: (workId: string) => void;
  removeWorkHighlight: (workId: string, highlightIndex: number) => void;
  removeWorkExperience: (id: string) => void;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden transition-all duration-300 hover:shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#3498DB] bg-opacity-10 flex items-center justify-center text-[#3498DB]">
            {icon}
          </div>
          <span className="font-semibold text-[#2C3E50] text-base">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
};

const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  rows?: number;
}> = ({ label, value, onChange, placeholder, type = 'text', multiline = false, rows = 3 }) => {
  const baseInputClass =
    'w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3498DB] focus:ring-opacity-30 focus:border-[#3498DB] transition-all duration-200 bg-gray-50 focus:bg-white';

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-[#2C3E50] mb-1.5">{label}</label>
      {multiline ? (
        <textarea
          className={baseInputClass + ' resize-none'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <input
          type={type}
          className={baseInputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
};

export const EditorPanel: React.FC<EditorPanelProps> = ({
  personalInfo,
  education,
  workExperience,
  updatePersonalInfo,
  addEducation,
  updateEducation,
  removeEducation,
  addWorkExperience,
  updateWorkExperience,
  updateWorkHighlight,
  addWorkHighlight,
  removeWorkHighlight,
  removeWorkExperience,
}) => {
  return (
    <div className="h-full overflow-y-auto p-4 bg-gray-50">
      <Section title="个人信息" icon={<User className="w-5 h-5" />}>
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="姓名"
            value={personalInfo.name}
            onChange={(v) => updatePersonalInfo('name', v)}
            placeholder="请输入姓名"
          />
          <InputField
            label="职位"
            value={personalInfo.title}
            onChange={(v) => updatePersonalInfo('title', v)}
            placeholder="求职意向"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="邮箱"
            type="email"
            value={personalInfo.email}
            onChange={(v) => updatePersonalInfo('email', v)}
            placeholder="example@email.com"
          />
          <InputField
            label="电话"
            value={personalInfo.phone}
            onChange={(v) => updatePersonalInfo('phone', v)}
            placeholder="138-0000-0000"
          />
        </div>
        <InputField
          label="所在城市"
          value={personalInfo.location}
          onChange={(v) => updatePersonalInfo('location', v)}
          placeholder="北京市"
        />
        <InputField
          label="个人简介"
          multiline
          rows={4}
          value={personalInfo.summary}
          onChange={(v) => updatePersonalInfo('summary', v)}
          placeholder="简要介绍您的专业背景和核心优势..."
        />
      </Section>

      <Section title="教育经历" icon={<GraduationCap className="w-5 h-5" />}>
        {education.map((edu, index) => (
          <div
            key={edu.id}
            className="mb-5 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 relative"
          >
            {education.length > 1 && (
              <button
                onClick={() => removeEducation(edu.id)}
                className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <div className="text-xs font-medium text-[#3498DB] mb-3">教育经历 {index + 1}</div>
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="学校"
                value={edu.school}
                onChange={(v) => updateEducation(edu.id, 'school', v)}
                placeholder="北京大学"
              />
              <InputField
                label="学位"
                value={edu.degree}
                onChange={(v) => updateEducation(edu.id, 'degree', v)}
                placeholder="硕士/本科"
              />
            </div>
            <InputField
              label="专业"
              value={edu.major}
              onChange={(v) => updateEducation(edu.id, 'major', v)}
              placeholder="计算机科学与技术"
            />
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="开始时间"
                value={edu.startDate}
                onChange={(v) => updateEducation(edu.id, 'startDate', v)}
                placeholder="2016-09"
              />
              <InputField
                label="结束时间"
                value={edu.endDate}
                onChange={(v) => updateEducation(edu.id, 'endDate', v)}
                placeholder="2019-06"
              />
            </div>
            <InputField
              label="描述"
              multiline
              value={edu.description}
              onChange={(v) => updateEducation(edu.id, 'description', v)}
              placeholder="GPA、获奖情况等..."
            />
          </div>
        ))}
        <button
          onClick={addEducation}
          className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-[#3498DB] hover:text-[#3498DB] hover:bg-[#3498DB] hover:bg-opacity-5 transition-all duration-300 flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          添加教育经历
        </button>
      </Section>

      <Section title="工作项目经验" icon={<Briefcase className="w-5 h-5" />}>
        {workExperience.map((work, index) => (
          <div
            key={work.id}
            className="mb-5 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 relative"
          >
            {workExperience.length > 1 && (
              <button
                onClick={() => removeWorkExperience(work.id)}
                className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <div className="text-xs font-medium text-[#3498DB] mb-3">工作经历 {index + 1}</div>
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="公司"
                value={work.company}
                onChange={(v) => updateWorkExperience(work.id, 'company', v)}
                placeholder="字节跳动"
              />
              <InputField
                label="职位"
                value={work.position}
                onChange={(v) => updateWorkExperience(work.id, 'position', v)}
                placeholder="高级前端工程师"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="开始时间"
                value={work.startDate}
                onChange={(v) => updateWorkExperience(work.id, 'startDate', v)}
                placeholder="2021-03"
              />
              <InputField
                label="结束时间"
                value={work.endDate}
                onChange={(v) => updateWorkExperience(work.id, 'endDate', v)}
                placeholder="至今"
              />
            </div>
            <InputField
              label="工作描述"
              multiline
              value={work.description}
              onChange={(v) => updateWorkExperience(work.id, 'description', v)}
              placeholder="简要描述工作职责..."
            />
            <div className="mb-3">
              <label className="block text-sm font-medium text-[#2C3E50] mb-2">工作成果</label>
              {work.highlights.map((highlight, hIndex) => (
                <div key={hIndex} className="flex gap-2 mb-2">
                  <input
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3498DB] focus:ring-opacity-30 focus:border-[#3498DB] transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={highlight}
                    onChange={(e) => updateWorkHighlight(work.id, hIndex, e.target.value)}
                    placeholder="描述一项工作成果..."
                  />
                  {work.highlights.length > 1 && (
                    <button
                      onClick={() => removeWorkHighlight(work.id, hIndex)}
                      className="px-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addWorkHighlight(work.id)}
                className="text-sm text-[#3498DB] hover:text-[#2980B9] font-medium flex items-center gap-1 mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                添加成果
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={addWorkExperience}
          className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-[#3498DB] hover:text-[#3498DB] hover:bg-[#3498DB] hover:bg-opacity-5 transition-all duration-300 flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          添加工作经历
        </button>
      </Section>
    </div>
  );
};
