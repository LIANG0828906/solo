import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Template, Project, Version, CanvasElement, AppView } from '../types';

interface AppContextType {
  view: AppView;
  setView: (view: AppView) => void;
  templates: Template[];
  setTemplates: (templates: Template[]) => void;
  project: Project | null;
  setProject: (project: Project | null) => void;
  currentElements: CanvasElement[];
  setCurrentElements: (elements: CanvasElement[]) => void;
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  selectedTemplate: Template | null;
  setSelectedTemplate: (template: Template | null) => void;
  compareVersionIds: string[];
  setCompareVersionIds: (ids: string[]) => void;
  selectTemplate: (template: Template) => void;
  saveVersion: () => Promise<void>;
  switchVersion: (versionId: string) => void;
  getCurrentVersion: () => Version | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AppView>('templates');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [currentElements, setCurrentElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [compareVersionIds, setCompareVersionIds] = useState<string[]>([]);

  const selectTemplate = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setCurrentElements(template.elements);
    setView('editor');
    setSelectedElementId(null);
  }, []);

  const getCurrentVersion = useCallback((): Version | null => {
    if (!project) return null;
    return project.versions.find(v => v.id === project.currentVersionId) || null;
  }, [project]);

  const saveVersion = useCallback(async () => {
    if (!project) {
      const newProject: Project = {
        id: `project-${Date.now()}`,
        name: '未命名项目',
        currentVersionId: 'v1',
        versions: [
          {
            id: 'v1',
            name: '版本 1',
            createdAt: new Date().toISOString(),
            elements: [...currentElements],
            canvasWidth: selectedTemplate?.canvasWidth || 800,
            canvasHeight: selectedTemplate?.canvasHeight || 600,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProject(newProject);
      return;
    }

    const versionNumber = project.versions.length + 1;
    const newVersion: Version = {
      id: `v${versionNumber}`,
      name: `版本 ${versionNumber}`,
      createdAt: new Date().toISOString(),
      elements: [...currentElements],
      canvasWidth: selectedTemplate?.canvasWidth || 800,
      canvasHeight: selectedTemplate?.canvasHeight || 600,
    };

    const updatedProject: Project = {
      ...project,
      versions: [...project.versions, newVersion],
      currentVersionId: newVersion.id,
      updatedAt: new Date().toISOString(),
    };
    setProject(updatedProject);
  }, [project, currentElements, selectedTemplate]);

  const switchVersion = useCallback((versionId: string) => {
    if (!project) return;
    const version = project.versions.find(v => v.id === versionId);
    if (version) {
      setCurrentElements(version.elements);
      setProject({
        ...project,
        currentVersionId: versionId,
      });
      setSelectedElementId(null);
    }
  }, [project]);

  return (
    <AppContext.Provider
      value={{
        view,
        setView,
        templates,
        setTemplates,
        project,
        setProject,
        currentElements,
        setCurrentElements,
        selectedElementId,
        setSelectedElementId,
        selectedTemplate,
        setSelectedTemplate,
        compareVersionIds,
        setCompareVersionIds,
        selectTemplate,
        saveVersion,
        switchVersion,
        getCurrentVersion,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
