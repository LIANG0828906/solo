import { useState } from 'react';
import { Plus, GripVertical, Trash2, FileText, Layers, HelpCircle, X } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useRetroStore } from '@/store/useRetroStore';
import type { RetrospectiveTemplate, TemplatePhase, TemplateQuestion } from '@/types';
import { cn } from '@/lib/utils';

export default function TemplateManager() {
  const { templates } = useRetroStore();
  const [localTemplates, setLocalTemplates] = useState<RetrospectiveTemplate[]>(templates);
  const [editingTemplate, setEditingTemplate] = useState<RetrospectiveTemplate | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '' });
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleAddTemplate = () => {
    if (!newTemplate.name.trim()) return;

    const template: RetrospectiveTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplate.name.trim(),
      description: newTemplate.description.trim(),
      phases: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setLocalTemplates([...localTemplates, template]);
    setNewTemplate({ name: '', description: '' });
    setIsCreateModalOpen(false);
  };

  const handleAddPhase = (templateId: string) => {
    setLocalTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== templateId) return t;
        const newPhase: TemplatePhase = {
          id: `phase-${Date.now()}`,
          name: '新阶段',
          order: t.phases.length,
          questions: [],
        };
        return { ...t, phases: [...t.phases, newPhase], updatedAt: new Date().toISOString() };
      })
    );
  };

  const handleDeletePhase = (templateId: string, phaseId: string) => {
    setLocalTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== templateId) return t;
        return {
          ...t,
          phases: t.phases.filter((p) => p.id !== phaseId),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const handleUpdatePhaseName = (templateId: string, phaseId: string, name: string) => {
    setLocalTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== templateId) return t;
        return {
          ...t,
          phases: t.phases.map((p) => (p.id === phaseId ? { ...p, name } : p)),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const handleAddQuestion = (templateId: string, phaseId: string) => {
    setLocalTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== templateId) return t;
        return {
          ...t,
          phases: t.phases.map((p) => {
            if (p.id !== phaseId) return p;
            const newQuestion: TemplateQuestion = {
              id: `q-${Date.now()}`,
              text: '新问题',
              type: 'open',
              order: p.questions.length,
            };
            return { ...p, questions: [...p.questions, newQuestion] };
          }),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const handleDeleteQuestion = (templateId: string, phaseId: string, questionId: string) => {
    setLocalTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== templateId) return t;
        return {
          ...t,
          phases: t.phases.map((p) => {
            if (p.id !== phaseId) return p;
            return { ...p, questions: p.questions.filter((q) => q.id !== questionId) };
          }),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const handleUpdateQuestion = (
    templateId: string,
    phaseId: string,
    questionId: string,
    updates: Partial<TemplateQuestion>
  ) => {
    setLocalTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== templateId) return t;
        return {
          ...t,
          phases: t.phases.map((p) => {
            if (p.id !== phaseId) return p;
            return {
              ...p,
              questions: p.questions.map((q) =>
                q.id === questionId ? { ...q, ...updates } : q
              ),
            };
          }),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const handlePhaseDragStart = (e: React.DragEvent, phaseId: string) => {
    setDraggedItem(phaseId);
    e.dataTransfer.setData('phaseId', phaseId);
  };

  const handlePhaseDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handlePhaseDrop = (e: React.DragEvent, templateId: string, targetPhaseId: string) => {
    e.preventDefault();
    const draggedPhaseId = e.dataTransfer.getData('phaseId');
    if (!draggedPhaseId || draggedPhaseId === targetPhaseId) return;

    setLocalTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== templateId) return t;
        const phases = [...t.phases];
        const dragIndex = phases.findIndex((p) => p.id === draggedPhaseId);
        const dropIndex = phases.findIndex((p) => p.id === targetPhaseId);
        if (dragIndex === -1 || dropIndex === -1) return t;

        const [removed] = phases.splice(dragIndex, 1);
        phases.splice(dropIndex, 0, removed);
        const reorderedPhases = phases.map((p, i) => ({ ...p, order: i }));

        return { ...t, phases: reorderedPhases, updatedAt: new Date().toISOString() };
      })
    );
    setDraggedItem(null);
  };

  const handleQuestionDragStart = (e: React.DragEvent, questionId: string) => {
    setDraggedItem(questionId);
    e.dataTransfer.setData('questionId', questionId);
  };

  const handleQuestionDrop = (
    e: React.DragEvent,
    templateId: string,
    phaseId: string,
    targetQuestionId: string
  ) => {
    e.preventDefault();
    const draggedQuestionId = e.dataTransfer.getData('questionId');
    if (!draggedQuestionId || draggedQuestionId === targetQuestionId) return;

    setLocalTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== templateId) return t;
        return {
          ...t,
          phases: t.phases.map((p) => {
            if (p.id !== phaseId) return p;
            const questions = [...p.questions];
            const dragIndex = questions.findIndex((q) => q.id === draggedQuestionId);
            const dropIndex = questions.findIndex((q) => q.id === targetQuestionId);
            if (dragIndex === -1 || dropIndex === -1) return p;

            const [removed] = questions.splice(dragIndex, 1);
            questions.splice(dropIndex, 0, removed);
            const reorderedQuestions = questions.map((q, i) => ({ ...q, order: i }));

            return { ...p, questions: reorderedQuestions };
          }),
          updatedAt: new Date().toISOString(),
        };
      })
    );
    setDraggedItem(null);
  };

  const getTotalQuestions = (template: RetrospectiveTemplate) => {
    return template.phases.reduce((sum, phase) => sum + phase.questions.length, 0);
  };

  return (
    <div className="min-h-screen bg-grid-pattern">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold font-display mb-1">模板管理</h2>
            <p className="text-white/60 text-sm">管理和配置复盘模板</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            创建新模板
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {localTemplates.map((template, index) => {
            const isExpanded = editingTemplate?.id === template.id;

            return (
              <div
                key={template.id}
                className={`glass-card glass-card-hover overflow-hidden fade-in slide-up animate-stagger-${
                  Math.min(index + 1, 8) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
                }`}
              >
                <div
                  className="p-6 cursor-pointer"
                  onClick={() =>
                    setEditingTemplate(isExpanded ? null : template)
                  }
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400/30 to-violet-600/30 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-1">{template.name}</h3>
                      <p className="text-sm text-white/50 line-clamp-2 mb-3">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-white/60">
                          <Layers className="w-4 h-4" />
                          <span>{template.phases.length} 个阶段</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/60">
                          <HelpCircle className="w-4 h-4" />
                          <span>{getTotalQuestions(template)} 个问题</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/10 p-6 space-y-4">
                    {template.phases.map((phase, phaseIndex) => (
                      <div
                        key={phase.id}
                        className={cn(
                          'glass-card p-4 bg-white/5',
                          draggedItem === phase.id && 'opacity-50'
                        )}
                        draggable
                        onDragStart={(e) => handlePhaseDragStart(e, phase.id)}
                        onDragOver={handlePhaseDragOver}
                        onDrop={(e) => handlePhaseDrop(e, template.id, phase.id)}
                        onDragEnd={() => setDraggedItem(null)}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <GripVertical className="w-4 h-4 text-white/30 cursor-grab" />
                          <input
                            type="text"
                            value={phase.name}
                            onChange={(e) =>
                              handleUpdatePhaseName(template.id, phase.id, e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="bg-transparent border-none text-white font-medium focus:outline-none focus:ring-0 p-0 flex-1"
                          />
                          <span className="text-xs text-white/40">
                            阶段 {phaseIndex + 1}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePhase(template.id, phase.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-2 pl-7">
                          {phase.questions.map((question, qIndex) => (
                            <div
                              key={question.id}
                              className={cn(
                                'flex items-center gap-2 p-2 rounded-lg bg-white/5',
                                draggedItem === question.id && 'opacity-50'
                              )}
                              draggable
                              onDragStart={(e) =>
                                handleQuestionDragStart(e, question.id)
                              }
                              onDragOver={handlePhaseDragOver}
                              onDrop={(e) =>
                                handleQuestionDrop(
                                  e,
                                  template.id,
                                  phase.id,
                                  question.id
                                )
                              }
                              onDragEnd={() => setDraggedItem(null)}
                            >
                              <GripVertical className="w-3 h-3 text-white/30 cursor-grab flex-shrink-0" />
                              <input
                                type="text"
                                value={question.text}
                                onChange={(e) =>
                                  handleUpdateQuestion(
                                    template.id,
                                    phase.id,
                                    question.id,
                                    { text: e.target.value }
                                  )
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="bg-transparent border-none text-sm text-white/80 focus:outline-none focus:ring-0 p-0 flex-1"
                              />
                              <select
                                value={question.type}
                                onChange={(e) =>
                                  handleUpdateQuestion(
                                    template.id,
                                    phase.id,
                                    question.id,
                                    {
                                      type: e.target.value as 'open' | 'rating',
                                    }
                                  )
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="bg-dark-400 border border-white/10 rounded text-xs text-white/60 px-2 py-1 focus:outline-none focus:border-primary-500/50"
                              >
                                <option value="open">开放</option>
                                <option value="rating">评分</option>
                              </select>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteQuestion(
                                    template.id,
                                    phase.id,
                                    question.id
                                  );
                                }}
                                className="p-1 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddQuestion(template.id, phase.id);
                            }}
                            className="w-full text-left text-sm text-white/40 hover:text-white/60 py-2 pl-5 transition-colors"
                          >
                            + 添加问题
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddPhase(template.id);
                      }}
                      className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-white/40 hover:text-white/60 hover:border-white/20 transition-colors text-sm"
                    >
                      + 添加阶段
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {isCreateModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold font-display">创建新模板</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">
                  模板名称
                </label>
                <div className="input-glow">
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) =>
                      setNewTemplate((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="输入模板名称"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">
                  模板描述
                </label>
                <div className="input-glow">
                  <textarea
                    value={newTemplate.description}
                    onChange={(e) =>
                      setNewTemplate((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="输入模板描述（可选）"
                    rows={3}
                    className="input-field resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button onClick={handleAddTemplate} className="btn-primary flex-1">
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
