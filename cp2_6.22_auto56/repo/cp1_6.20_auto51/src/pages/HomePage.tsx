import React, { useEffect, useState } from 'react';
import { Menu, Palette, Heart, FolderPlus, Plus, Eye } from 'lucide-react';
import { ColorWheel } from '@/components/ColorWheel';
import { PaletteCard } from '@/components/PaletteCard';
import { ProjectCard } from '@/components/ProjectCard';
import { Drawer } from '@/components/Drawer';
import { useStore } from '@/store/useStore';
import { HARMONY_RULES, COLOR_BLIND_MODES } from '@/types';
import type { HarmonyRule, ColorBlindMode, Palette as PaletteType, Project } from '@/types';
import { hslToHex } from '@/utils/colorUtils';
import { simulatePaletteColorBlindness } from '@/utils/colorBlindness';
import { v4 as uuidv4 } from 'uuid';

export const HomePage: React.FC = () => {
  const {
    hsl,
    setHSL,
    selectedRule,
    setSelectedRule,
    colorBlindMode,
    setColorBlindMode,
    generatedPalettes,
    generatePalettes,
    savedPalettes,
    setSavedPalettes,
    addSavedPalette,
    removeSavedPalette,
    projects,
    setProjects,
    addProject,
    activeTab,
    setActiveTab,
    drawerOpen,
    setDrawerOpen,
    currentUser
  } = useStore();

  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    generatePalettes();
    
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1200);
    };
    
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, [generatePalettes]);

  useEffect(() => {
    fetch('/api/palettes')
      .then(res => res.json())
      .then(data => setSavedPalettes(data))
      .catch(() => {});
    
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(() => {});
  }, [setSavedPalettes, setProjects]);

  const handleSavePalette = async (colors: string[], rule: HarmonyRule) => {
    const baseColor = hslToHex(hsl.h, hsl.s, hsl.l);
    const name = `配色方案 ${new Date().toLocaleDateString()}`;
    
    try {
      const response = await fetch('/api/palettes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          colors,
          baseColor,
          harmonyRule: rule,
          tags: []
        })
      });
      
      if (response.ok) {
        const saved = await response.json();
        setSavedPalettes(prev => [saved, ...prev]);
      }
    } catch {
      addSavedPalette({
        name,
        colors,
        baseColor,
        harmonyRule: rule,
        tags: []
      });
    }
  };

  const handleDeletePalette = async (id: string) => {
    try {
      await fetch(`/api/palettes/${id}`, { method: 'DELETE' });
    } catch {}
    removeSavedPalette(id);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDesc,
          ownerEmail: currentUser.email
        })
      });
      
      if (response.ok) {
        const project = await response.json();
        addProject(project);
      }
    } catch {
      const now = new Date().toISOString();
      addProject({
        id: uuidv4(),
        name: newProjectName,
        description: newProjectDesc,
        members: [{
          id: uuidv4(),
          email: currentUser.email,
          role: 'owner',
          joinedAt: now
        }],
        palettes: [],
        comments: [],
        createdAt: now
      });
    }
    
    setNewProjectName('');
    setNewProjectDesc('');
    setShowNewProject(false);
  };

  const handleInviteMember = async (projectId: string, email: string) => {
    try {
      await fetch(`/api/projects/${projectId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: 'editor' })
      });
      
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch {
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          const existing = p.members.find(m => m.email === email);
          if (existing) return p;
          return {
            ...p,
            members: [...p.members, {
              id: uuidv4(),
              email,
              role: 'editor',
              joinedAt: new Date().toISOString()
            }]
          };
        }
        return p;
      }));
    }
  };

  const handleAddPaletteToProject = async (projectId: string, paletteId: string) => {
    try {
      await fetch(`/api/projects/${projectId}/palettes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paletteId })
      });
      
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch {
      setProjects(prev => prev.map(p => {
        if (p.id === projectId && !p.palettes.includes(paletteId)) {
          return { ...p, palettes: [...p.palettes, paletteId] };
        }
        return p;
      }));
    }
  };

  const handleAddComment = async (
    projectId: string,
    paletteId: string | undefined,
    colorIndex: number | undefined,
    content: string
  ) => {
    try {
      await fetch(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          paletteId,
          colorIndex,
          content
        })
      });
      
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch {
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            comments: [...p.comments, {
              id: uuidv4(),
              userId: uuidv4(),
              userEmail: currentUser.email,
              paletteId,
              colorIndex,
              content,
              createdAt: new Date().toISOString()
            }]
          };
        }
        return p;
      }));
    }
  };

  const getDisplayColors = (colors: string[]) => {
    return simulatePaletteColorBlindness(colors, colorBlindMode);
  };

  const ToolPanel = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-1">ColorPalette</h1>
        <p className="text-gray-400 text-sm">专业配色方案生成器</p>
      </div>

      <ColorWheel hsl={hsl} onChange={setHSL} />

      <div className="space-y-4">
        <div>
          <label className="block text-gray-300 text-sm mb-2">
            色相 (H): {hsl.h}°
          </label>
          <input
            type="range"
            min="0"
            max="359"
            value={hsl.h}
            onChange={(e) => setHSL({ ...hsl, h: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            style={{
              background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
            }}
          />
        </div>
        
        <div>
          <label className="block text-gray-300 text-sm mb-2">
            饱和度 (S): {hsl.s}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={hsl.s}
            onChange={(e) => setHSL({ ...hsl, s: parseInt(e.target.value) })}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #888, hsl(${hsl.h}, 100%, 50%)`
            }}
          />
        </div>
        
        <div>
          <label className="block text-gray-300 text-sm mb-2">
            亮度 (L): {hsl.l}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={hsl.l}
            onChange={(e) => setHSL({ ...hsl, l: parseInt(e.target.value) })}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #000, hsl(${hsl.h}, ${hsl.s}%, 50%), #fff)`
            }}
          />
        </div>
      </div>

      <div>
        <h3 className="text-gray-300 text-sm font-medium mb-3">色彩和谐规则</h3>
        <div className="grid grid-cols-1 gap-2">
          {HARMONY_RULES.map((rule) => (
          <button
            key={rule.value}
            onClick={() => setSelectedRule(rule.value)}
            className={`px-3 py-2 rounded-lg text-sm text-left transition-all ${
              selectedRule === rule.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <div className="font-medium">{rule.label}</div>
            <div className="text-xs opacity-75">{rule.description}</div>
          </button>
        ))}
        </div>
      </div>

      <div>
        <h3 className="text-gray-300 text-sm font-medium mb-3">色盲模拟</h3>
        <div className="grid grid-cols-2 gap-2">
          {COLOR_BLIND_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setColorBlindMode(mode.value)}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                colorBlindMode === mode.value
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F5F5FA] overflow-hidden">
      <div className={`hidden lg:block w-80 bg-[#2D2D3F] overflow-y-auto p-6 flex-shrink-0">
        <ToolPanel />
      </div>

      {isMobile && (
        <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <ToolPanel />
        </Drawer>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isMobile && (
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
                >
                  <Menu size={20} className="text-gray-600" />
                </button>
              )}
              {isTablet && !isMobile && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => setColorBlindMode('normal')}
                    className={
                      'px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ' +
                      (colorBlindMode === 'normal' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600')
                    }
                  >
                    <Eye size={14} className="inline mr-1" />
                    正常
                  </button>
                  {COLOR_BLIND_MODES.slice(1).map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setColorBlindMode(mode.value)}
                      className={
                        'px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ' +
                        (colorBlindMode === mode.value ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600')
                      }
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('generator')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'generator'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Palette size={16} className="inline mr-2" />
                生成器
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'favorites'
                    ? 'text-pink-600 bg-pink-50'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Heart size={16} className="inline mr-2" />
                收藏夹
                {savedPalettes.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-pink-100 text-pink-600 rounded-full">
                    {savedPalettes.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'projects'
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FolderPlus size={16} className="inline mr-2" />
                项目
              </button>
            </div>
          </div>
          </div>

        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'generator' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">推荐配色方案</h2>
                <p className="text-gray-500 text-sm">基于当前主色：{hslToHex(hsl.h, hsl.s, hsl.l)} · HSL({hsl.h}, {hsl.s}%, {hsl.l}%)</p>
              </div>
              
              {colorBlindMode !== 'normal' && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700">
                  <Eye size={16} className="inline mr-2" />
                  当前处于{COLOR_BLIND_MODES.find(m => m.value === colorBlindMode)?.label}模拟模式
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                {generatedPalettes.map((palette, index) => (
                  <PaletteCard
                    key={palette.rule + '-' + index}
                    colors={getDisplayColors(palette.colors)}
                    rule={palette.rule}
                    paletteIndex={index}
                    onSave={() => handleSavePalette(palette.colors, palette.rule)}
                    isSaved={savedPalettes.some(
                      sp => sp.colors.join(',') === palette.colors.join(',')
                    )}
                    showAdjustments={true}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div>
              <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">我的收藏</h2>
              <p className="text-gray-500 text-sm">已保存 {savedPalettes.length} 个配色方案</p>
            </div>

            {savedPalettes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl">
                <Heart size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">还没有收藏的配色方案</p>
                <p className="text-gray-400 text-sm mt-1">在生成器中点击爱心图标保存方案</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                {savedPalettes.map((palette) => (
                  <PaletteCard
                    key={palette.id}
                    colors={getDisplayColors(palette.colors)}
                    rule={palette.harmonyRule}
                    isSaved={true}
                    savedData={{
                      id: palette.id,
                      name: palette.name,
                      tags: palette.tags,
                      createdAt: palette.createdAt
                    }}
                    onDelete={() => handleDeletePalette(palette.id)}
                    showAdjustments={false}
                  />
                ))}
              </div>
            )}
          </div>

          {activeTab === 'projects' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">项目协作</h2>
                  <p className="text-gray-500 text-sm">管理团队项目，共享配色方案</p>
                </div>
                <button
                  onClick={() => setShowNewProject(!showNewProject)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  <Plus size={16} className="inline mr-2" />
                  创建项目
                </button>
              </div>

              {showNewProject && (
                <div className="mb-6 p-4 bg-white rounded-xl p-4 animate-expandDown">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="项目名称"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <textarea
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="项目描述（可选）"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateProject}
                      disabled={!newProjectName.trim()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      创建
                    </button>
                    <button
                      onClick={() => {
                      setShowNewProject(false);
                      setNewProjectName('');
                      setNewProjectDesc('');
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  </div>
                </div>
              )}

              {projects.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                  <FolderPlus size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">还没有创建项目</p>
                  <p className="text-gray-400 text-sm mt-1">点击上方按钮创建第一个协作项目</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      palettes={savedPalettes}
                      onInvite={(email) => handleInviteMember(project.id, email)}
                      onAddComment={(paletteId, colorIndex, content) =>
                        handleAddComment(project.id, paletteId, colorIndex, content)
                      }
                      onAddPalette={(paletteId) => handleAddPaletteToProject(project.id, paletteId)}
                      availablePalettes={savedPalettes}
                      currentUserEmail={currentUser.email}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
