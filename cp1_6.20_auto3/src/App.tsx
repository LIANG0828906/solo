import React, { useState, useRef } from 'react';
import { FileText } from 'lucide-react';
import { useResumeState } from './hooks/useResumeState';
import { EditorPanel } from './EditorPanel';
import { ResumePreview } from './ResumePreview';
import { TemplateId } from './templates';

const App: React.FC = () => {
  const [activeTemplate, setActiveTemplate] = useState<TemplateId>('minimal');
  const resumeRef = useRef<HTMLDivElement>(null);

  const {
    resumeData,
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
  } = useResumeState();

  return (
    <div className="h-screen flex flex-col bg-[#F8F9FA] overflow-hidden">
      <header
        className="h-14 flex items-center justify-between px-6 bg-[#2C3E50] text-white shadow-lg relative overflow-hidden flex-shrink-0"
        style={{
          background: 'linear-gradient(90deg, #2C3E50 0%, #34495E 50%, #2C3E50 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 8s ease-in-out infinite',
        }}
      >
        <style>
          {`
            @keyframes shimmer {
              0%, 100% {
                background-position: 0% 50%;
              }
              50% {
                background-position: 100% 50%;
              }
            }
            @keyframes shimmer-light {
              0% {
                transform: translateX(-100%);
              }
              100% {
                transform: translateX(100%);
              }
            }
          `}
        </style>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(52, 152, 219, 0.1) 50%, transparent 100%)',
              animation: 'shimmer-light 3s ease-in-out infinite',
            }}
          />
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-lg bg-[#3498DB] flex items-center justify-center shadow-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">智能简历生成器</h1>
            <p className="text-xs text-gray-300">实时预览 · 一键导出PDF</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-300 relative z-10">
          <span className="hidden sm:inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            实时同步
          </span>
          <span className="hidden md:inline text-gray-400">|</span>
          <span className="hidden md:inline">支持三套精美模板</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="w-full lg:w-[30%] h-full lg:h-auto overflow-hidden flex-shrink-0 border-r border-gray-200">
          <EditorPanel
            personalInfo={resumeData.personalInfo}
            education={resumeData.education}
            workExperience={resumeData.workExperience}
            updatePersonalInfo={updatePersonalInfo}
            addEducation={addEducation}
            updateEducation={updateEducation}
            removeEducation={removeEducation}
            addWorkExperience={addWorkExperience}
            updateWorkExperience={updateWorkExperience}
            updateWorkHighlight={updateWorkHighlight}
            addWorkHighlight={addWorkHighlight}
            removeWorkHighlight={removeWorkHighlight}
            removeWorkExperience={removeWorkExperience}
          />
        </div>
        <div className="w-full lg:w-[70%] h-full lg:h-auto overflow-hidden">
          <ResumePreview
            ref={resumeRef}
            resumeData={resumeData}
            templateId={activeTemplate}
            onTemplateChange={setActiveTemplate}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
