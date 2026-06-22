import { useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useStore } from '@/store';
import { GripVertical, Download, Palette } from 'lucide-react';
import type { ResumeData, Education, WorkExperience, ProjectExperience } from '@/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const BLOCK_LABELS: Record<string, string> = {
  personal: '个人信息',
  education: '教育经历',
  workExperience: '工作经历',
  projectExperience: '项目经验',
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr;
}

function LightTemplate({ resume }: { resume: ResumeData }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-card card-transition text-sm">
      <div className="bg-gradient-to-r from-navy-500/10 via-navy-500/5 to-transparent px-6 py-5 border-b border-navy-100">
        <h1 className="text-xl font-bold text-navy-600 font-display tracking-wide">
          {resume.name || '你的姓名'}
        </h1>
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-navy-400">
          {resume.phone && <span>{resume.phone}</span>}
          {resume.email && <span>{resume.email}</span>}
        </div>
      </div>
      {resume.summary && (
        <div className="px-6 py-3 border-b border-navy-100/60">
          <p className="text-navy-400 text-xs leading-relaxed">{resume.summary}</p>
        </div>
      )}
    </div>
  );
}

function DarkTemplate({ resume }: { resume: ResumeData }) {
  return (
    <div className="bg-navy-800 rounded-xl overflow-hidden shadow-card card-transition text-sm">
      <div className="px-6 py-5 border-b border-navy-700">
        <h1 className="text-xl font-bold text-white font-display tracking-wide">
          {resume.name || '你的姓名'}
        </h1>
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-navy-300">
          {resume.phone && <span>{resume.phone}</span>}
          {resume.email && <span>{resume.email}</span>}
        </div>
      </div>
      {resume.summary && (
        <div className="px-6 py-3 border-b border-navy-700/60">
          <p className="text-navy-300 text-xs leading-relaxed">{resume.summary}</p>
        </div>
      )}
    </div>
  );
}

function EducationBlock({ item, isDark }: { item: Education; isDark: boolean }) {
  const tc = isDark ? 'text-white' : 'text-navy-600';
  const tc2 = isDark ? 'text-navy-300' : 'text-navy-400';
  const borderC = isDark ? 'border-navy-700' : 'border-navy-100';
  return (
    <div className={`py-3 border-b ${borderC} last:border-b-0`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className={`font-semibold ${tc}`}>{item.school || '学校名称'}</h4>
          <p className={`text-xs ${tc2}`}>{item.major || '专业'}</p>
        </div>
        <span className={`text-xs ${tc2} shrink-0 ml-2`}>
          {formatDate(item.startDate)} - {formatDate(item.endDate)}
        </span>
      </div>
    </div>
  );
}

function WorkBlock({ item, isDark }: { item: WorkExperience; isDark: boolean }) {
  const tc = isDark ? 'text-white' : 'text-navy-600';
  const tc2 = isDark ? 'text-navy-300' : 'text-navy-400';
  const borderC = isDark ? 'border-navy-700' : 'border-navy-100';
  return (
    <div className={`py-3 border-b ${borderC} last:border-b-0`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className={`font-semibold ${tc}`}>{item.company || '公司名称'}</h4>
          <p className={`text-xs ${tc2}`}>{item.position || '职位'}</p>
        </div>
        <span className={`text-xs ${tc2} shrink-0 ml-2`}>
          {formatDate(item.startDate)} - {formatDate(item.endDate)}
        </span>
      </div>
      {item.description && (
        <p className={`text-xs mt-1.5 leading-relaxed ${tc2}`}>{item.description}</p>
      )}
    </div>
  );
}

function ProjectBlock({ item, isDark }: { item: ProjectExperience; isDark: boolean }) {
  const tc = isDark ? 'text-white' : 'text-navy-600';
  const tc2 = isDark ? 'text-navy-300' : 'text-navy-400';
  const accentC = isDark ? 'text-gold-400' : 'text-navy-500';
  const borderC = isDark ? 'border-navy-700' : 'border-navy-100';
  return (
    <div className={`py-3 border-b ${borderC} last:border-b-0`}>
      <div className="flex items-start justify-between">
        <h4 className={`font-semibold ${tc}`}>{item.name || '项目名称'}</h4>
        {item.role && <span className={`text-xs ${accentC} shrink-0 ml-2`}>{item.role}</span>}
      </div>
      {item.description && (
        <p className={`text-xs mt-1.5 leading-relaxed ${tc2}`}>{item.description}</p>
      )}
    </div>
  );
}

function SectionTitle({ title, isDark }: { title: string; isDark: boolean }) {
  const tc = isDark ? 'text-gold-400' : 'text-navy-600';
  const borderC = isDark ? 'border-gold-400/30' : 'border-navy-500/30';
  return (
    <h3 className={`text-xs font-bold uppercase tracking-wider ${tc} pb-2 border-b ${borderC} mb-2`}>
      {title}
    </h3>
  );
}

export default function ResumePreview() {
  const resume = useStore((s) => s.resume);
  const reorderBlocks = useStore((s) => s.reorderBlocks);
  const setTemplate = useStore((s) => s.setTemplate);
  const resumeRef = useRef<HTMLDivElement>(null);

  const isDark = resume.template === 'dark';
  const bgColor = isDark ? 'bg-navy-800' : 'bg-white';
  const sectionBg = isDark ? 'px-6 py-3' : 'px-6 py-3';
  const sectionBorder = isDark ? 'border-b border-navy-700' : 'border-b border-navy-100';

  const handleDragEnd = useCallback(
    (result: { destination?: { index: number } | null; source: { index: number } }) => {
      if (!result.destination) return;
      const items = Array.from(resume.blockOrder);
      const [reordered] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reordered);
      reorderBlocks(items);
    },
    [resume.blockOrder, reorderBlocks]
  );

  const exportPDF = useCallback(async () => {
    if (!resumeRef.current) return;
    const canvas = await html2canvas(resumeRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: isDark ? '#0F1F33' : '#FFFFFF',
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${resume.name || '简历'}.pdf`);
  }, [isDark, resume.name]);

  const renderBlock = (blockId: string) => {
    switch (blockId) {
      case 'education':
        return resume.education.length > 0 ? (
          <div className={sectionBg + ' ' + sectionBorder}>
            <SectionTitle title="教育经历" isDark={isDark} />
            {resume.education.map((item) => (
              <EducationBlock key={item.id} item={item} isDark={isDark} />
            ))}
          </div>
        ) : null;
      case 'workExperience':
        return resume.workExperience.length > 0 ? (
          <div className={sectionBg + ' ' + sectionBorder}>
            <SectionTitle title="工作经历" isDark={isDark} />
            {resume.workExperience.map((item) => (
              <WorkBlock key={item.id} item={item} isDark={isDark} />
            ))}
          </div>
        ) : null;
      case 'projectExperience':
        return resume.projectExperience.length > 0 ? (
          <div className={sectionBg}>
            <SectionTitle title="项目经验" isDark={isDark} />
            {resume.projectExperience.map((item) => (
              <ProjectBlock key={item.id} item={item} isDark={isDark} />
            ))}
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-navy-100 bg-white/60 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <Palette size={14} className="text-navy-400" />
          <span className="text-xs font-medium text-navy-400">模板</span>
          <div className="flex gap-1">
            <button
              onClick={() => setTemplate('light')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                resume.template === 'light'
                  ? 'bg-navy-600 text-white shadow-sm'
                  : 'bg-navy-50 text-navy-400 hover:bg-navy-100'
              }`}
            >
              简约蓝白
            </button>
            <button
              onClick={() => setTemplate('dark')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                resume.template === 'dark'
                  ? 'bg-navy-600 text-white shadow-sm'
                  : 'bg-navy-50 text-navy-400 hover:bg-navy-100'
              }`}
            >
              商务深色
            </button>
          </div>
        </div>
        <button
          onClick={exportPDF}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-600 text-white text-xs font-medium hover:bg-navy-700 transition-colors shadow-sm"
        >
          <Download size={12} />
          导出PDF
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div ref={resumeRef} className={`rounded-xl overflow-hidden shadow-card ${bgColor}`}>
          {isDark ? <DarkTemplate resume={resume} /> : <LightTemplate resume={resume} />}

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="resume-blocks">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {resume.blockOrder.map((blockId, index) => {
                    const content = renderBlock(blockId);
                    if (!content) return null;
                    return (
                      <Draggable key={blockId} draggableId={blockId} index={index}>
                        {(dragProvided, snapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            className={`relative group ${snapshot.isDragging ? 'opacity-80 shadow-card-hover z-10' : ''}`}
                          >
                            <div
                              {...dragProvided.dragHandleProps}
                              className="absolute left-1 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical size={14} className={isDark ? 'text-navy-400' : 'text-navy-300'} />
                            </div>
                            {content}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
}
