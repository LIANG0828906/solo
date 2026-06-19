import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Undo2, Redo2, GripVertical, ChevronDown, ChevronRight, Save, Eye } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import type { Resume, ResumeSection } from '@/types';
import { useHistory } from '@/hooks/useHistory';

interface SortableSectionProps {
  section: ResumeSection;
  isCollapsed: boolean;
  onToggleCollapse: (id: string) => void;
  onEdit: () => void;
}

function SortableSection({ section, isCollapsed, onToggleCollapse, onEdit }: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sectionLabels: Record<string, string> = {
    personalInfo: '个人信息',
    workExperience: '工作经历',
    education: '教育背景',
    skills: '技能标签',
    projects: '项目经验',
    custom: '自定义模块',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white rounded-lg border border-gray-200 mb-2 overflow-hidden',
        'transition-all duration-200',
        isDragging && 'shadow-lg z-10',
        'hover:border-blue-200'
      )}
    >
      <div
      className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 cursor-pointer select-none"
      onClick={() => onToggleCollapse(section.id)}
      >
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing rounded hover:bg-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </button>

        {isCollapsed ? (
          <ChevronRight size={16} className="text-gray-500" />
          ) : (
            <ChevronDown size={16} className="text-gray-500" />
            )}
        <span className="font-medium text-gray-700 text-sm flex-1">
          {section.title || sectionLabels[section.type] || '未命名'}
        </span>
      </div>

      <div
      className={cn(
        'overflow-hidden transition-all duration-300 ease-in-out',
        isCollapsed ? 'max-h-0' : 'max-h-[500px]'
      )}
      >
        <div className="p-4 text-sm text-gray-600" onClick={onEdit}>
          <SectionContent section={section} />
        </div>
      </div>
    </div>
  );
}

function SectionContent({ section }: { section: ResumeSection }) {
  switch (section.type) {
    case 'personalInfo':
      return <div className="space-y-1">
        <p className="text-gray-500">点击编辑个人信息...</p>
      </div>;
    case 'workExperience':
      return <p className="text-gray-500">点击编辑工作经历...</p>;
    case 'education':
      return <p className="text-gray-500">点击编辑教育背景...</p>;
    case 'skills':
      return <p className="text-gray-500">点击编辑技能标签...</p>;
    case 'projects':
      return <p className="text-gray-500">点击编辑项目经验...</p>;
    default:
      return <p className="text-gray-500">点击编辑...</p>;
  }
}

interface ResumeEditorProps {
  resume: Resume;
  onChange?: (resume: Resume) => void;
  onSave?: (resume: Resume) => void;
}

export default function ResumeEditor({ resume, onChange, onSave }: ResumeEditorProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    state: historyResume,
    canUndo,
    canRedo,
    push,
    undo,
    redo,
    reset,
  } = useHistory<Resume>({
    initialState: resume,
    maxHistory: 50,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    reset(resume);
  }, [resume.id, reset]);

  useEffect(() => {
    if (onChange) {
      onChange(historyResume);
    }
  }, [historyResume, onChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (onSave) {
          onSave(historyResume);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 1500);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo, onSave, historyResume]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = historyResume.sections.findIndex((s) => s.id === active.id);
      const newIndex = historyResume.sections.findIndex((s) => s.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSections = arrayMove(historyResume.sections, oldIndex, newIndex).map(
          (section, idx) => ({
            ...section,
            order: idx,
          })
        );
        push({
          ...historyResume,
          sections: newSections,
        });
      }
    }
  };

  const toggleSection = useCallback(
    (id: string) => {
      setCollapsedSections((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    []
  );

  const handleEditSection = useCallback(() => {
    // TODO: 实现内联编辑
  }, []);

  const activeSection = useMemo(
    () => historyResume.sections.find((s) => s.id === activeId),
    [historyResume.sections, activeId]
  );

  const handleSave = () => {
    if (onSave) {
      onSave(historyResume);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="glass flex items-center justify-between px-4 py-3 border-b border-gray-200/60">
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={cn(
              'p-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 text-sm',
              canUndo
                ? 'text-gray-700 hover:bg-white/80 hover:shadow-sm active:scale-95'
                : 'text-gray-300 cursor-not-allowed'
            )}
            title="撤销 (Ctrl+Z)"
          >
            <Undo2 size={18} />
            <span className="hidden sm:inline">撤销</span>
          </button>

          <button
            onClick={redo}
            disabled={!canRedo}
            className={cn(
              'p-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 text-sm',
              canRedo
                ? 'text-gray-700 hover:bg-white/80 hover:shadow-sm active:scale-95'
                : 'text-gray-300 cursor-not-allowed'
            )}
            title="重做 (Ctrl+Shift+Z)"
          >
            <Redo2 size={18} />
            <span className="hidden sm:inline">重做</span>
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            onClick={handleSave}
            className={cn(
              'p-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 text-sm',
              'text-blue-600 hover:bg-blue-50 active:scale-95',
              saveSuccess && 'text-green-600'
            )}
            title="保存 (Ctrl+S)"
          >
            {saveSuccess ? (
              <>
                <svg className="w-[18px] h-[18px] text-green-500 animate-check-pop" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline text-green-600 font-medium">已保存</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span className="hidden sm:inline">保存</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            <Eye size={14} className="inline mr-1" />
            实时预览
          </span>
        </div>
      </div>

      {/* 编辑器主体 */}
      <div className="flex-1 overflow-hidden">
        {/* 左侧：模块列表 */}
        <div className="w-80 h-full overflow-y-auto p-4 bg-gray-50/50 border-r border-gray-200/60">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>简历模块</span>
            <span className="text-xs font-normal text-gray-400">拖拽调整顺序</span>
          </h3>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={historyResume.sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {historyResume.sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  isCollapsed={collapsedSections.has(section.id)}
                  onToggleCollapse={toggleSection}
                  onEdit={handleEditSection}
                />
              ))}
            </SortableContext>

            <DragOverlay>
              {activeSection ? (
                <div className="bg-white rounded-lg border-2 border-blue-400 shadow-lg opacity-90">
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50">
                    <GripVertical size={16} className="text-blue-400" />
                    <span className="font-medium text-gray-700 text-sm">
                      {activeSection.title}
                    </span>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* 右侧：预览区 */}
        <div className="flex-1 h-full overflow-y-auto p-6 bg-surface-200/50">
          <div className="max-w-2xl mx-auto">
            <ResumePreview resume={historyResume} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ResumePreview({ resume }: { resume: Resume }) {
  const templateStyles: Record<string, string> = {
    business: 'bg-white text-gray-800',
    tech: 'bg-slate-900 text-slate-100',
    creative: 'bg-amber-50 text-stone-800',
  };

  return (
    <div
      className={cn(
        'rounded-xl shadow-card p-8 min-h-[600px]',
        templateStyles[resume.template]
      )}
    >
      <div className="space-y-6">
        {/* 按顺序渲染各模块预览 */}
        {resume.sections
          .filter((s) => s.visible)
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <div key={section.id}>
              <h3 className="font-bold text-base mb-2 pb-1 border-b border-current/10">
                {section.title || getSectionTitle(section.type)}
              </h3>
              <div className="text-sm opacity-80">
                {section.type === 'personalInfo' && (
                  <div>
                    <div className="text-lg font-bold">{resume.personalInfo.name || '您的姓名'}</div>
                    <div className="text-xs opacity-70 mt-0.5">
                      {resume.personalInfo.title || '职位头衔'}
                    </div>
                    <div className="text-xs opacity-70 mt-2">
                      {resume.personalInfo.email} · {resume.personalInfo.phone}
                    </div>
                  </div>
                )}
                {section.type === 'workExperience' && (
                  <div className="opacity-60">工作经历内容预览...</div>
                )}
                {section.type === 'education' && (
                  <div className="opacity-60">教育背景内容预览...</div>
                )}
                {section.type === 'skills' && (
                  <div className="opacity-60">技能标签内容预览...</div>
                )}
                {section.type === 'projects' && (
                  <div className="opacity-60">项目经验内容预览...</div>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function getSectionTitle(type: string): string {
  const titles: Record<string, string> = {
    personalInfo: '个人信息',
    workExperience: '工作经历',
    education: '教育背景',
    skills: '技能',
    projects: '项目经验',
    custom: '自定义',
  };
  return titles[type] || '模块';
}
