import { useRef, useState, useEffect } from 'react';
import {
  Square,
  Triangle,
  MousePointer2,
  Trash2,
  Undo2,
  Redo2,
  Save,
  Download,
  Upload,
} from 'lucide-react';
import type { HazardZone } from '@/types/shared';
import { useEditorStore } from '@/stores/useEditorStore';
import Modal from './Modal';
import { saveTemplate } from '@/api';
import { listTemplates as listTemplatesApi } from '@/api';

interface ControlPanelProps {
  hazards: HazardZone[];
}

export default function ControlPanel({ hazards }: ControlPanelProps) {
  const toolMode = useEditorStore((s) => s.toolMode);
  const setToolMode = useEditorStore((s) => s.setToolMode);
  const commitLevel = useEditorStore((s) => s.commitLevel);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const replaceLevel = useEditorStore((s) => s.replaceLevel);
  const getLevel = useEditorStore((s) => s.getLevel);
  const canUndo = useEditorStore((s) => s.canUndo);
  const canRedo = useEditorStore((s) => s.canRedo);
  const setTemplateList = useEditorStore((s) => s.setTemplateList);
  const level = useEditorStore((s) => s.history.present);

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastHazardIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (hazards.length > 0) {
      lastHazardIdRef.current = hazards[hazards.length - 1].id;
      const timer = setTimeout(() => {
        lastHazardIdRef.current = null;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hazards]);

  const handleVxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vx = Number(e.target.value);
    commitLevel((lvl) => ({
      ...lvl,
      jumpParams: { ...lvl.jumpParams, vx },
    }));
  };

  const handleVyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vy = Number(e.target.value);
    commitLevel((lvl) => ({
      ...lvl,
      jumpParams: { ...lvl.jumpParams, vy },
    }));
  };

  const tools = [
    { icon: Square, mode: 'place_platform' as const, label: '放置平台' },
    { icon: Triangle, mode: 'place_spike' as const, label: '放置尖刺' },
    { icon: MousePointer2, mode: 'select' as const, label: '选择/编辑' },
    { icon: Trash2, mode: 'delete' as const, label: '删除' },
  ];

  const handleSave = async () => {
    if (!templateName.trim()) return;
    try {
      await saveTemplate(templateName.trim(), getLevel());
      const list = await listTemplatesApi();
      setTemplateList(list);
      setSaveModalOpen(false);
      setTemplateName('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(getLevel(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `level-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        replaceLevel(parsed);
      } catch (err) {
        console.error('Import failed', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const isUndoDisabled = !canUndo();
  const isRedoDisabled = !canRedo();

  return (
    <div className="glass-panel h-full w-full p-4 flex flex-col gap-4 overflow-hidden">
      <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2">控制面板</h2>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white/80">跳跃参数</h3>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-white/70">水平速度</span>
            <span className="text-white font-mono">{level.jumpParams.vx} px/s</span>
          </div>
          <input
            type="range"
            min={0}
            max={500}
            value={level.jumpParams.vx}
            onChange={handleVxChange}
            className="custom-slider w-full"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-white/70">垂直速度</span>
            <span className="text-white font-mono">{level.jumpParams.vy} px/s</span>
          </div>
          <input
            type="range"
            min={0}
            max={500}
            value={level.jumpParams.vy}
            onChange={handleVyChange}
            className="custom-slider w-full"
          />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white/80">工具</h3>
        <div className="grid grid-cols-2 gap-2">
          {tools.map((t) => {
            const Icon = t.icon;
            const active = toolMode === t.mode;
            return (
              <button
                key={t.mode}
                onClick={() => setToolMode(t.mode)}
                title={t.label}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-white transition-all duration-200 ease hover:bg-white/10 ${
                  active ? 'border-2 border-green-400 bg-green-400/10' : 'border-2 border-transparent'
                }`}
              >
                <Icon size={18} />
                <span className="text-xs">{t.label}</span>
              </button>
            );
          })}

          <button
            onClick={undo}
            disabled={isUndoDisabled}
            title="撤销 (Ctrl+Z)"
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-white transition-all duration-200 ease hover:bg-white/10 border-2 border-transparent ${
              isUndoDisabled ? 'opacity-50 cursor-not-allowed grayscale' : ''
            }`}
          >
            <Undo2 size={18} />
            <span className="text-xs">撤销</span>
          </button>

          <button
            onClick={redo}
            disabled={isRedoDisabled}
            title="重做 (Ctrl+Shift+Z)"
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-white transition-all duration-200 ease hover:bg-white/10 border-2 border-transparent ${
              isRedoDisabled ? 'opacity-50 cursor-not-allowed grayscale' : ''
            }`}
          >
            <Redo2 size={18} />
            <span className="text-xs">重做</span>
          </button>

          <button
            onClick={() => setSaveModalOpen(true)}
            title="保存"
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-white transition-all duration-200 ease hover:bg-white/10 border-2 border-transparent"
          >
            <Save size={18} />
            <span className="text-xs">保存</span>
          </button>

          <button
            onClick={handleExport}
            title="导出"
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-white transition-all duration-200 ease hover:bg-white/10 border-2 border-transparent"
          >
            <Download size={18} />
            <span className="text-xs">导出</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            title="导入"
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-white transition-all duration-200 ease hover:bg-white/10 border-2 border-transparent col-span-2"
          >
            <Upload size={18} />
            <span className="text-xs">导入</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col space-y-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white/80">危险区域</h3>
          <span className="px-2 py-0.5 rounded-full bg-red-500/30 text-red-300 text-xs font-medium">
            {hazards.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ maxHeight: '200px' }}>
          {hazards.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-4">暂无危险区域</p>
          ) : (
            hazards.map((hz) => {
              const isLatest = lastHazardIdRef.current === hz.id;
              return (
                <div
                  key={hz.id}
                  className={`flex items-start gap-2 px-3 py-2 rounded-lg bg-white/5 text-sm ${
                    isLatest ? 'animate-red-pulse' : ''
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: '#e74c3c' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-xs">
                      {hz.type === 'spike_hit' ? '尖刺碰撞' : '越界'}
                    </div>
                    <div className="text-white/50 font-mono text-xs">
                      ({Math.round(hz.collisionX)}, {Math.round(hz.collisionY)})
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Modal
        open={saveModalOpen}
        title="保存模板"
        onClose={() => {
          setSaveModalOpen(false);
          setTemplateName('');
        }}
        footer={
          <>
            <button
              onClick={() => {
                setSaveModalOpen(false);
                setTemplateName('');
              }}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!templateName.trim()}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              保存
            </button>
          </>
        }
      >
        <label className="block text-sm text-white/70 mb-2">模板名称</label>
        <input
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="输入模板名称..."
          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white outline-none focus:border-white/40 transition-colors"
          autoFocus
        />
      </Modal>

      <style>{`
        @keyframes red-pulse {
          0%, 100% { background-color: rgba(231, 76, 60, 0.3); }
          50% { background-color: rgba(231, 76, 60, 0.6); }
        }
        .animate-red-pulse {
          animation: red-pulse 1s ease-in-out 2;
        }
        .custom-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          outline: none;
          cursor: pointer;
        }
        .custom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #667eea;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        .custom-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #667eea;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
