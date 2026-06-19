import { useStore } from '@/store';
import { Plus, Trash2, GraduationCap, Briefcase, FolderOpen, User } from 'lucide-react';
import type { Education, WorkExperience, ProjectExperience } from '@/types';

interface FieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  multiline?: boolean;
}

function Field({ label, value, onChange, type = 'text', placeholder, multiline }: FieldProps) {
  const baseClass =
    'w-full px-3 py-2 rounded-lg border border-navy-100 bg-white text-sm text-navy-600 input-focus placeholder:text-navy-300';
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-navy-400">{label}</label>
      {multiline ? (
        <textarea
          className={baseClass + ' resize-none min-h-[60px]'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
        />
      ) : (
        <input
          className={baseClass}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, onAdd }: { icon: React.ElementType; title: string; onAdd?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3 mt-5 first:mt-0">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-navy-600/10 flex items-center justify-center">
          <Icon size={14} className="text-navy-600" />
        </div>
        <h3 className="text-sm font-semibold text-navy-600">{title}</h3>
      </div>
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-xs text-navy-500 hover:text-navy-600 px-2 py-1 rounded-md border border-dashed border-navy-200 hover:border-navy-500 transition-colors"
        >
          <Plus size={12} />
          添加
        </button>
      )}
    </div>
  );
}

function EducationItem({ item, onUpdate, onRemove }: { item: Education; onUpdate: (id: string, data: Record<string, string>) => void; onRemove: (id: string) => void }) {
  return (
    <div className="relative bg-navy-50/50 rounded-lg p-3 border border-navy-100/60 animate-fade-in">
      <button
        onClick={() => onRemove(item.id)}
        className="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center text-navy-300 hover:text-red-500 hover:bg-red-50 transition-colors"
      >
        <Trash2 size={12} />
      </button>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Field label="学校" value={item.school} onChange={(v) => onUpdate(item.id, { school: v })} placeholder="学校名称" />
        <Field label="专业" value={item.major} onChange={(v) => onUpdate(item.id, { major: v })} placeholder="专业名称" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="开始时间" value={item.startDate} onChange={(v) => onUpdate(item.id, { startDate: v })} type="month" />
        <Field label="结束时间" value={item.endDate} onChange={(v) => onUpdate(item.id, { endDate: v })} type="month" />
      </div>
    </div>
  );
}

function WorkItem({ item, onUpdate, onRemove }: { item: WorkExperience; onUpdate: (id: string, data: Record<string, string>) => void; onRemove: (id: string) => void }) {
  return (
    <div className="relative bg-navy-50/50 rounded-lg p-3 border border-navy-100/60 animate-fade-in">
      <button
        onClick={() => onRemove(item.id)}
        className="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center text-navy-300 hover:text-red-500 hover:bg-red-50 transition-colors"
      >
        <Trash2 size={12} />
      </button>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Field label="公司" value={item.company} onChange={(v) => onUpdate(item.id, { company: v })} placeholder="公司名称" />
        <Field label="职位" value={item.position} onChange={(v) => onUpdate(item.id, { position: v })} placeholder="职位名称" />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Field label="开始时间" value={item.startDate} onChange={(v) => onUpdate(item.id, { startDate: v })} type="month" />
        <Field label="结束时间" value={item.endDate} onChange={(v) => onUpdate(item.id, { endDate: v })} type="month" />
      </div>
      <Field label="工作描述" value={item.description} onChange={(v) => onUpdate(item.id, { description: v })} placeholder="描述你的工作内容和成果" multiline />
    </div>
  );
}

function ProjectItem({ item, onUpdate, onRemove }: { item: ProjectExperience; onUpdate: (id: string, data: Record<string, string>) => void; onRemove: (id: string) => void }) {
  return (
    <div className="relative bg-navy-50/50 rounded-lg p-3 border border-navy-100/60 animate-fade-in">
      <button
        onClick={() => onRemove(item.id)}
        className="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center text-navy-300 hover:text-red-500 hover:bg-red-50 transition-colors"
      >
        <Trash2 size={12} />
      </button>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Field label="项目名称" value={item.name} onChange={(v) => onUpdate(item.id, { name: v })} placeholder="项目名称" />
        <Field label="角色" value={item.role} onChange={(v) => onUpdate(item.id, { role: v })} placeholder="你的角色" />
      </div>
      <Field label="项目描述" value={item.description} onChange={(v) => onUpdate(item.id, { description: v })} placeholder="描述项目内容和你的贡献" multiline />
    </div>
  );
}

export default function ProfileForm() {
  const resume = useStore((s) => s.resume);
  const setResume = useStore((s) => s.setResume);
  const addEducation = useStore((s) => s.addEducation);
  const updateEducation = useStore((s) => s.updateEducation);
  const removeEducation = useStore((s) => s.removeEducation);
  const addWorkExperience = useStore((s) => s.addWorkExperience);
  const updateWorkExperience = useStore((s) => s.updateWorkExperience);
  const removeWorkExperience = useStore((s) => s.removeWorkExperience);
  const addProjectExperience = useStore((s) => s.addProjectExperience);
  const updateProjectExperience = useStore((s) => s.updateProjectExperience);
  const removeProjectExperience = useStore((s) => s.removeProjectExperience);

  return (
    <div className="h-full overflow-y-auto px-4 py-5 md:px-5">
      <SectionHeader icon={User} title="个人信息" />
      <div className="space-y-2">
        <Field label="姓名" value={resume.name} onChange={(v) => setResume({ name: v })} placeholder="你的姓名" />
        <div className="grid grid-cols-2 gap-2">
          <Field label="电话" value={resume.phone} onChange={(v) => setResume({ phone: v })} type="tel" placeholder="手机号码" />
          <Field label="邮箱" value={resume.email} onChange={(v) => setResume({ email: v })} type="email" placeholder="邮箱地址" />
        </div>
        <Field label="个人简介" value={resume.summary} onChange={(v) => setResume({ summary: v })} placeholder="简要介绍你的职业方向和核心优势" multiline />
      </div>

      <SectionHeader icon={GraduationCap} title="教育经历" onAdd={addEducation} />
      <div className="space-y-2">
        {resume.education.map((edu) => (
          <EducationItem key={edu.id} item={edu} onUpdate={updateEducation} onRemove={removeEducation} />
        ))}
        {resume.education.length === 0 && (
          <p className="text-xs text-navy-300 text-center py-3">暂无教育经历，点击添加</p>
        )}
      </div>

      <SectionHeader icon={Briefcase} title="工作经历" onAdd={addWorkExperience} />
      <div className="space-y-2">
        {resume.workExperience.map((work) => (
          <WorkItem key={work.id} item={work} onUpdate={updateWorkExperience} onRemove={removeWorkExperience} />
        ))}
        {resume.workExperience.length === 0 && (
          <p className="text-xs text-navy-300 text-center py-3">暂无工作经历，点击添加</p>
        )}
      </div>

      <SectionHeader icon={FolderOpen} title="项目经验" onAdd={addProjectExperience} />
      <div className="space-y-2 pb-6">
        {resume.projectExperience.map((proj) => (
          <ProjectItem key={proj.id} item={proj} onUpdate={updateProjectExperience} onRemove={removeProjectExperience} />
        ))}
        {resume.projectExperience.length === 0 && (
          <p className="text-xs text-navy-300 text-center py-3">暂无项目经验，点击添加</p>
        )}
      </div>
    </div>
  );
}
