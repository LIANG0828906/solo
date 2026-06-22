import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  RefreshCcw,
  Undo2,
  Redo2,
  Eye,
  Layers,
  GitCompare,
  Save,
  Menu,
  X,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Editor2D } from './modules/editor/Editor2D';
import { useEditorStore } from './modules/editor/editorStore';
import { Preview3D } from './modules/preview/Preview3D';
import { CompareView } from './modules/compare/CompareView';
import {
  TEMPLATES,
  TemplateName,
  generateTemplate,
  SavedScheme,
} from './utils/templates';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

type ViewMode = 'editor' | 'preview3d' | 'compare';

const ToolbarButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger' | 'primary';
}> = ({ icon, label, onClick, disabled, variant = 'default' }) => {
  const variants = {
    default: 'hover:bg-white/10 text-gray-200',
    danger: 'hover:bg-red-500/20 text-red-300 hover:text-red-200',
    primary: 'hover:bg-blue-500/20 text-blue-300 hover:text-blue-200',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group flex flex-col items-center justify-center gap-1.5 w-full py-3.5 px-2 rounded-2xl backdrop-blur-md transition-all duration-200 ease-out ${
        variants[variant]
      } ${
        disabled
          ? 'opacity-40 cursor-not-allowed hover:scale-100'
          : 'hover:scale-110 active:scale-95'
      }`}
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
      title={label}
    >
      <div className="w-5 h-5">{icon}</div>
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
  );
};

const App: React.FC = () => {
  const {
    buildings,
    selectedId,
    addBuilding,
    removeBuilding,
    clearAll,
    undo,
    redo,
    loadBuildings,
    historyIndex,
    history,
  } = useEditorStore();

  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [activeTemplate, setActiveTemplate] = useState<TemplateName | null>(null);
  const [savedSchemes, setSavedSchemes] = useState<SavedScheme[]>([]);
  const [compareTarget, setCompareTarget] = useState<SavedScheme | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSchemeModal, setShowSchemeModal] = useState(false);
  const [schemeName, setSchemeName] = useState('');

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleApplyTemplate = (name: TemplateName) => {
    const templateBuildings = generateTemplate(name);
    loadBuildings(templateBuildings);
    setActiveTemplate(name);
  };

  const handleSaveScheme = () => {
    if (!schemeName.trim()) return;
    const newScheme: SavedScheme = {
      id: uuidv4(),
      name: schemeName.trim(),
      buildings: [...buildings],
      createdAt: Date.now(),
    };
    setSavedSchemes((prev) => [newScheme, ...prev]);
    setShowSchemeModal(false);
    setSchemeName('');
  };

  const handleLoadScheme = (scheme: SavedScheme) => {
    loadBuildings(scheme.buildings);
    setShowMobileMenu(false);
  };

  const handleStartCompare = (scheme: SavedScheme) => {
    setCompareTarget(scheme);
    setViewMode('compare');
    setShowMobileMenu(false);
  };

  const viewModeButtons = useMemo(
    () => [
      {
        mode: 'editor' as ViewMode,
        icon: <Building2 className="w-5 h-5" />,
        label: '编辑',
      },
      {
        mode: 'preview3d' as ViewMode,
        icon: <Eye className="w-5 h-5" />,
        label: '3D预览',
      },
      {
        mode: 'compare' as ViewMode,
        icon: <GitCompare className="w-5 h-5" />,
        label: '对比',
      },
    ],
    []
  );

  return (
    <div
      className="w-screen h-screen overflow-hidden font-sans flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <header
        className="flex items-center justify-between px-6 py-4 flex-shrink-0 z-50"
        style={{
          background: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, #0f3460 0%, #16213e 100%)',
              boxShadow:
                '0 4px 20px rgba(15, 52, 96, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            <Sparkles className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              City Skyline Studio
            </h1>
            <p className="text-xs text-gray-400 -mt-0.5">
              城市天际线可视化设计工具
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 p-1.5 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {viewModeButtons.map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => {
                if (mode === 'compare' && savedSchemes.length === 0) return;
                if (mode === 'compare' && !compareTarget && savedSchemes.length > 0) {
                  setCompareTarget(savedSchemes[0]);
                }
                setViewMode(mode);
              }}
              disabled={mode === 'compare' && savedSchemes.length === 0}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                viewMode === mode
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              } ${mode === 'compare' && savedSchemes.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
              style={{
                background:
                  viewMode === mode
                    ? 'linear-gradient(135deg, rgba(15, 52, 96, 0.8), rgba(15, 52, 96, 0.4))'
                    : 'transparent',
                boxShadow:
                  viewMode === mode
                    ? '0 2px 12px rgba(15, 52, 96, 0.4)'
                    : 'none',
              }}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSchemeModal(true)}
            disabled={buildings.length === 0}
            className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              buildings.length === 0
                ? 'opacity-40 cursor-not-allowed text-gray-400'
                : 'text-white hover:scale-105'
            }`}
            style={{
              background:
                buildings.length > 0
                  ? 'linear-gradient(135deg, #0f3460, #165d8c)'
                  : 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow:
                buildings.length > 0
                  ? '0 4px 16px rgba(15, 52, 96, 0.5)'
                  : 'none',
            }}
          >
            <Save className="w-4 h-4" />
            保存方案
          </button>

          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            {showMobileMenu ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <aside
          className={`flex-shrink-0 flex flex-col gap-3 p-4 overflow-y-auto transition-all duration-300 z-40 ${
            showMobileMenu
              ? 'absolute inset-y-0 left-0 translate-x-0 shadow-2xl'
              : 'md:translate-x-0 -translate-x-full md:static'
          }`}
          style={{
            width: '200px',
            background:
              'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-2">
              编辑操作
            </p>
            <ToolbarButton
              icon={<Plus className="w-5 h-5" />}
              label="添加建筑"
              onClick={() => addBuilding()}
              variant="primary"
            />
            <ToolbarButton
              icon={<Trash2 className="w-5 h-5" />}
              label="删除选中"
              onClick={() => selectedId && removeBuilding(selectedId)}
              disabled={!selectedId}
              variant="danger"
            />
            <ToolbarButton
              icon={<RefreshCcw className="w-5 h-5" />}
              label="清空画布"
              onClick={clearAll}
              disabled={buildings.length === 0}
              variant="danger"
            />
          </div>

          <div
            className="h-px"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          />

          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-2">
              历史记录
            </p>
            <div className="grid grid-cols-2 gap-2">
              <ToolbarButton
                icon={<Undo2 className="w-5 h-5" />}
                label="撤销"
                onClick={undo}
                disabled={!canUndo}
              />
              <ToolbarButton
                icon={<Redo2 className="w-5 h-5" />}
                label="重做"
                onClick={redo}
                disabled={!canRedo}
              />
            </div>
          </div>

          <div
            className="h-px"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          />

          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-2 flex items-center gap-1.5">
              <Layers className="w-3 h-3" />
              预设模板
            </p>
            <div className="space-y-2">
              {(Object.keys(TEMPLATES) as TemplateName[]).map((name) => {
                const tpl = TEMPLATES[name];
                const isActive = activeTemplate === name;
                return (
                  <button
                    key={name}
                    onClick={() => handleApplyTemplate(name)}
                    className={`w-full p-3 rounded-xl text-left transition-all duration-200 hover:scale-[1.02] ${
                      isActive ? '' : 'hover:bg-white/5'
                    }`}
                    style={{
                      background: isActive
                        ? `linear-gradient(135deg, ${tpl.color}30, ${tpl.color}10)`
                        : 'rgba(255,255,255,0.05)',
                      border: isActive
                        ? `1px solid ${tpl.color}80`
                        : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: isActive
                        ? `0 4px 16px ${tpl.color}30`
                        : 'none',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{tpl.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-semibold truncate"
                          style={{ color: isActive ? tpl.color : '#e5e7eb' }}
                        >
                          {tpl.displayName}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate mt-0.5">
                          {tpl.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="h-px"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          />

          <div className="space-y-2 pb-4">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-2">
              已保存方案
            </p>
            {savedSchemes.length === 0 ? (
              <div
                className="p-4 rounded-xl text-center"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <p className="text-[11px] text-gray-500">
                  暂无保存的方案
                </p>
                <p className="text-[10px] text-gray-600 mt-1">
                  点击"保存方案"创建
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedSchemes.map((scheme) => (
                  <div
                    key={scheme.id}
                    className="p-3 rounded-xl group"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {scheme.name}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {dayjs(scheme.createdAt).format('MM-DD HH:mm')}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleLoadScheme(scheme)}
                        className="flex-1 text-[10px] px-2 py-1.5 rounded-lg text-blue-300 hover:bg-blue-500/20 transition-all font-medium"
                      >
                        加载
                      </button>
                      <button
                        onClick={() => handleStartCompare(scheme)}
                        className="flex-1 text-[10px] px-2 py-1.5 rounded-lg text-pink-300 hover:bg-pink-500/20 transition-all font-medium"
                      >
                        对比
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-500">
                      <Building2 className="w-3 h-3" />
                      {scheme.buildings.length} 栋建筑
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {showMobileMenu && (
          <div
            className="md:hidden absolute inset-0 z-30 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
          />
        )}

        <main className="flex-1 p-4 overflow-hidden relative">
          {viewMode === 'editor' && <Editor2D />}

          {viewMode === 'preview3d' && <Preview3D buildings={buildings} />}

          {viewMode === 'compare' && compareTarget && (
            <CompareView
              leftBuildings={buildings}
              rightBuildings={compareTarget.buildings}
              leftTitle="当前方案"
              rightTitle={compareTarget.name}
              onClose={() => setViewMode('editor')}
            />
          )}

          {viewMode === 'compare' && !compareTarget && (
            <div className="w-full h-full rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px dashed rgba(255,255,255,0.1)',
              }}
            >
              <div className="text-center px-8">
                <GitCompare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg text-gray-300 mb-2">请选择对比方案</h3>
                <p className="text-sm text-gray-500">
                  从左侧工具栏"已保存方案"中选择一项进行对比
                </p>
                {savedSchemes.length > 0 && (
                  <button
                    onClick={() => {
                      setCompareTarget(savedSchemes[0]);
                    }}
                    className="mt-6 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #e94560, #c73e54)',
                    }}
                  >
                    与第一个方案对比
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {showSchemeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowSchemeModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl p-8"
            style={{
              background:
                'linear-gradient(135deg, rgba(26, 26, 46, 0.98), rgba(22, 33, 62, 0.98))',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, #0f3460, #165d8c)',
                }}
              >
                <Save className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">保存方案</h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  为当前天际线方案命名
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  方案名称
                </label>
                <input
                  type="text"
                  value={schemeName}
                  onChange={(e) => setSchemeName(e.target.value)}
                  placeholder="例如：我的曼哈顿天际线"
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  autoFocus
                />
              </div>

              <div
                className="p-4 rounded-xl flex items-center justify-between"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-300">建筑数量</span>
                </div>
                <span className="text-lg font-bold text-white">
                  {buildings.length}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-7">
              <button
                onClick={() => {
                  setShowSchemeModal(false);
                  setSchemeName('');
                }}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-all hover:bg-white/5"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSaveScheme}
                disabled={!schemeName.trim()}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                  schemeName.trim()
                    ? 'text-white hover:scale-[1.02] active:scale-[0.98]'
                    : 'text-gray-500 cursor-not-allowed'
                }`}
                style={{
                  background: schemeName.trim()
                    ? 'linear-gradient(135deg, #0f3460, #165d8c)'
                    : 'rgba(255,255,255,0.06)',
                  boxShadow: schemeName.trim()
                    ? '0 8px 24px rgba(15, 52, 96, 0.5)'
                    : 'none',
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.01); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #64b4ff;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(100, 180, 255, 0.6);
          border: 2px solid #0f3460;
          transition: transform 0.15s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #64b4ff;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(100, 180, 255, 0.6);
          border: 2px solid #0f3460;
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.03);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.15);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.25);
        }
      `}</style>
    </div>
  );
};

export default App;
