import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';
import { useResumeStore } from '@/store/useResumeStore';
import { MODULE_TYPES, TEMPLATES } from '@/types/resume';
import { DataService } from '@/services/DataService';
import PersonalEditor from './editors/PersonalEditor';
import EducationEditor from './editors/EducationEditor';
import WorkEditor from './editors/WorkEditor';
import SkillsEditor from './editors/SkillsEditor';
import ProjectsEditor from './editors/ProjectsEditor';
import CustomEditor from './editors/CustomEditor';
import './EditorPanel.css';

const EditorPanel: React.FC = () => {
  const {
    resumeData,
    reorderModules,
    removeModule,
    toggleModuleVisibility,
    setActiveModule,
    activeModuleId,
    setTemplate,
  } = useResumeStore();

  const [expandedEditor, setExpandedEditor] = useState<string | null>('personal');
  const saveTimeoutRef = useRef<number | null>(null);

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      DataService.saveResume(useResumeStore.getState().resumeData);
    }, 500);
  }, []);

  useEffect(() => {
    debouncedSave();
  }, [resumeData, debouncedSave]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderModules(result.source.index, result.destination.index);
  };

  const toggleEditor = (moduleId: string) => {
    setExpandedEditor(expandedEditor === moduleId ? null : moduleId);
    setActiveModule(expandedEditor === moduleId ? null : moduleId);
  };

  const renderEditor = (moduleType: string) => {
    switch (moduleType) {
      case 'personal':
        return <PersonalEditor />;
      case 'education':
        return <EducationEditor />;
      case 'work':
        return <WorkEditor />;
      case 'skills':
        return <SkillsEditor />;
      case 'projects':
        return <ProjectsEditor />;
      case 'custom':
        return <CustomEditor />;
      default:
        return null;
    }
  };

  const moduleInfo = (type: string) => MODULE_TYPES.find((m) => m.type === type);

  return (
    <div className="editor-panel">
      <div className="panel-header">
        <h2>简历编辑器</h2>
      </div>

      <div className="template-selector">
        <h3>选择模板</h3>
        <div className="template-grid">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              className={`template-btn ${
                resumeData.templateId === template.id ? 'active' : ''
              }`}
              onClick={() => setTemplate(template.id)}
              style={{
                background: template.colors.background,
                borderColor:
                  resumeData.templateId === template.id
                    ? template.colors.accent
                    : '#e0e0e0',
              }}
            >
              <span
                className="template-color-bar"
                style={{ background: template.colors.accent }}
              />
              <span
                className="template-name"
                style={{ color: template.colors.title }}
              >
                {template.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="modules-section">
        <h3>模块列表</h3>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="modules">
            {(provided) => (
              <div
                className="modules-list"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {resumeData.modules.map((module, index) => {
                  const info = moduleInfo(module.type);
                  const isExpanded = expandedEditor === module.id;
                  return (
                    <div key={module.id} className="module-item-wrapper">
                      <Draggable
                        draggableId={module.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`module-item ${
                              snapshot.isDragging ? 'dragging' : ''
                            } ${isExpanded ? 'expanded' : ''}`}
                            style={{
                              ...provided.draggableProps.style,
                            }}
                          >
                            <div className="module-header">
                              <span className="module-icon">
                                {info?.icon || '📦'}
                              </span>
                              <span
                                className="module-title"
                                onClick={() => toggleEditor(module.id)}
                              >
                                {module.title}
                              </span>
                              <div className="module-actions">
                                <button
                                  className="action-btn visibility-btn"
                                  onClick={() =>
                                    toggleModuleVisibility(module.id)
                                  }
                                  title={
                                    module.visible ? '隐藏' : '显示'
                                  }
                                >
                                  {module.visible ? '👁️' : '👁️‍🗨️'}
                                </button>
                                <button
                                  className="action-btn expand-btn"
                                  onClick={() => toggleEditor(module.id)}
                                >
                                  {isExpanded ? '▲' : '▼'}
                                </button>
                                {resumeData.modules.length > 1 && (
                                  <button
                                    className="action-btn delete-btn"
                                    onClick={() => removeModule(module.id)}
                                    title="删除"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                      {isExpanded && (
                        <div className="module-editor">
                          {renderEditor(module.type)}
                        </div>
                      )}
                    </div>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};

export default EditorPanel;
