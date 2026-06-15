import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { Project, CanvasElement, ColorSwatch } from '../shared/types';
import Moodboard from './Moodboard';
import Sidebar from './Sidebar';
import ProjectList from './ProjectList';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [colorPalette, setColorPalette] = useState<ColorSwatch[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const loadProjects = async () => {
    try {
      const response = await axios.get<Project[]>('/api/projects');
      setProjects(response.data);
      if (response.data.length > 0 && !currentProject) {
        selectProject(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const selectProject = async (projectId: string) => {
    try {
      const response = await axios.get<Project>(`/api/projects/${projectId}`);
      const project = response.data;
      setCurrentProject(project);
      setElements(project.elements);
      setColorPalette(project.colorPalette);
      setSelectedElementId(null);
      
      const storageKey = `moodboard_${projectId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        setElements(data.elements);
        setColorPalette(data.colorPalette);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  const saveToLocalStorage = useCallback(() => {
    if (!currentProject) return;
    const storageKey = `moodboard_${currentProject.id}`;
    localStorage.setItem(storageKey, JSON.stringify({
      elements,
      colorPalette,
      savedAt: Date.now()
    }));
  }, [currentProject, elements, colorPalette]);

  useEffect(() => {
    saveToLocalStorage();
  }, [elements, colorPalette, saveToLocalStorage]);

  const saveProject = async () => {
    if (!currentProject) return;
    
    try {
      const canvas = document.querySelector('.canvas') as HTMLDivElement;
      let thumbnail: string | undefined;
      if (canvas) {
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        tempCanvas.width = 400;
        tempCanvas.height = 300;
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          const images = canvas.querySelectorAll('img');
          for (const img of Array.from(images)) {
            const rect = img.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            const scale = 400 / canvas.offsetWidth;
            ctx.drawImage(
              img,
              (rect.left - canvasRect.left) * scale,
              (rect.top - canvasRect.top) * scale,
              rect.width * scale,
              rect.height * scale
            );
          }
          thumbnail = tempCanvas.toDataURL('image/jpeg', 0.8);
        }
      }

      await axios.put(`/api/projects/${currentProject.id}`, {
        elements,
        colorPalette,
        thumbnail
      });
      
      setStatusMessage('✓ 项目已保存');
      loadProjects();
    } catch (error) {
      console.error('Failed to save project:', error);
      setStatusMessage('✗ 保存失败');
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    
    try {
      const response = await axios.post<Project>('/api/projects', {
        name: newProjectName.trim()
      });
      setNewProjectName('');
      setShowNewProjectModal(false);
      loadProjects();
      selectProject(response.data.id);
      setStatusMessage('✓ 项目已创建');
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('确定要删除这个项目吗？')) return;
    
    try {
      await axios.delete(`/api/projects/${projectId}`);
      localStorage.removeItem(`moodboard_${projectId}`);
      
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
        setElements([]);
        setColorPalette([]);
      }
      loadProjects();
      setStatusMessage('✓ 项目已删除');
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const copyProject = async (projectId: string, newName: string) => {
    try {
      const response = await axios.post<Project>(`/api/projects/${projectId}/copy`, {
        name: newName
      });
      loadProjects();
      selectProject(response.data.id);
      setStatusMessage('✓ 项目已复制');
    } catch (error) {
      console.error('Failed to copy project:', error);
    }
  };

  const renameProject = async (projectId: string, newName: string) => {
    try {
      await axios.put(`/api/projects/${projectId}`, { name: newName });
      if (currentProject?.id === projectId) {
        setCurrentProject({ ...currentProject, name: newName });
      }
      loadProjects();
      setStatusMessage('✓ 项目已重命名');
    } catch (error) {
      console.error('Failed to rename project:', error);
    }
  };

  const addElements = (newElements: CanvasElement[]) => {
    setElements(prev => [...prev, ...newElements]);
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } as CanvasElement : el
    ));
  };

  const deleteElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  const applyColorToSelected = (color: string) => {
    if (!selectedElementId) return;
    const element = elements.find(el => el.id === selectedElementId);
    if (element && element.type === 'text') {
      updateElement(selectedElementId, { color });
    }
  };

  const exportHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${currentProject?.name || '灵感板'}</title>
  <style>
    body { margin: 0; padding: 40px; background: #f0f2f5; font-family: sans-serif; }
    .moodboard { position: relative; width: 2000px; height: 1500px; background: white; box-shadow: 0 10px 40px rgba(0,0,0,0.1); margin: 0 auto; }
    .element { position: absolute; }
    .element img { width: 100%; height: 100%; object-fit: cover; }
    .palette { margin-top: 24px; display: flex; gap: 8px; justify-content: center; }
    .swatch { width: 60px; height: 60px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1 style="text-align: center; color: #2d3748; margin-bottom: 24px;">${currentProject?.name || '灵感板'}</h1>
  <div class="moodboard">
    ${elements.map(el => {
      if (el.type === 'image') {
        return `<div class="element" style="left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;transform:rotate(${el.rotation}deg);"><img src="${el.src}" alt="${el.name}"></div>`;
      } else if (el.type === 'text') {
        return `<div class="element" style="left:${el.x}px;top:${el.y}px;font-size:${el.fontSize}px;font-family:${el.fontFamily};color:${el.color};">${el.text}</div>`;
      } else if (el.type === 'drawing') {
        return `<div class="element" style="left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;"><img src="${el.dataUrl}" alt="${el.name}"></div>`;
      }
      return '';
    }).join('')}
  </div>
  ${colorPalette.length > 0 ? `
  <h2 style="text-align: center; color: #2d3748; margin-top: 40px; margin-bottom: 16px;">配色方案</h2>
  <div class="palette">
    ${colorPalette.map(c => `<div class="swatch" style="background:${c.hex};"></div>`).join('')}
  </div>` : ''}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject?.name || 'moodboard'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('✓ 已导出HTML快照');
  };

  const handleImagesUpload = async (files: FileList) => {
    const fileArray = Array.from(files).slice(0, 20);
    const newElements: CanvasElement[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const reader = new FileReader();
      
      await new Promise<void>((resolve) => {
        reader.onload = (e) => {
          const src = e.target?.result as string;
          const img = new Image();
          img.onload = () => {
            const maxWidth = 300;
            const maxHeight = 300;
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
              height = (maxWidth / width) * height;
              width = maxWidth;
            }
            if (height > maxHeight) {
              width = (maxHeight / height) * width;
              height = maxHeight;
            }

            newElements.push({
              id: uuidv4(),
              type: 'image',
              x: 100 + i * 30,
              y: 100 + i * 30,
              width,
              height,
              rotation: 0,
              src,
              name: file.name
            });
            resolve();
          };
          img.src = src;
        };
        reader.readAsDataURL(file);
      });
    }

    addElements(newElements);
    setStatusMessage(`✓ 已添加 ${newElements.length} 张图片`);
  };

  const handleColorExtracted = (colors: ColorSwatch[]) => {
    setColorPalette(colors);
    setStatusMessage('✓ 色板已更新');
  };

  const selectedElement = elements.find(el => el.id === selectedElementId) || null;

  return (
    <div className="app-container">
      <div className={`status-bar ${statusMessage ? 'show' : ''}`}>
        {statusMessage}
      </div>

      <div className="left-sidebar">
        <ProjectList
          projects={projects}
          currentProjectId={currentProject?.id || null}
          onSelect={selectProject}
          onDelete={deleteProject}
          onCopy={copyProject}
          onRename={renameProject}
          onNewProject={() => setShowNewProjectModal(true)}
        />
      </div>

      <div className="main-content">
        {currentProject ? (
          <Moodboard
            project={currentProject}
            elements={elements}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onUpdateElement={updateElement}
            onDeleteElement={deleteElement}
            onAddElements={addElements}
            onImagesUpload={handleImagesUpload}
            onColorExtracted={handleColorExtracted}
            onSave={saveProject}
            onExportHtml={exportHtml}
          />
        ) : (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#a0aec0',
            fontSize: '18px'
          }}>
            请选择或创建一个项目开始
          </div>
        )}
      </div>

      <div className={`right-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="right-sidebar-header">
          {!sidebarCollapsed && <h2>工具面板</h2>}
          <button
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? '展开' : '收起'}
          >
            {sidebarCollapsed ? '◀' : '▶'}
          </button>
        </div>
        
        {!sidebarCollapsed && (
          <Sidebar
            colorPalette={colorPalette}
            selectedElement={selectedElement}
            onApplyColor={applyColorToSelected}
            onUpdateElement={updateElement}
            onImagesUpload={handleImagesUpload}
            selectedElementId={selectedElementId}
          />
        )}
      </div>

      {showNewProjectModal && (
        <div className="modal-overlay" onClick={() => setShowNewProjectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>创建新项目</h3>
            <div className="form-group">
              <label>项目名称</label>
              <input
                type="text"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                placeholder="输入项目名称..."
                autoFocus
                onKeyDown={e => e.key === 'Enter' && createProject()}
              />
            </div>
            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setShowNewProjectModal(false)}>
                取消
              </button>
              <button className="primary-btn" onClick={createProject}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
