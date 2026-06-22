import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Circle,
  Cylinder,
  CircleDot,
  Play,
  Pause,
  Save,
  Plus,
  Trash2,
  MapPin,
  Move,
  Edit3,
  Copy,
  Check,
  X,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import type { ExhibitType } from '@/types';
import { useSceneStore } from '@/store/useSceneStore';

function GlassPanel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-exhibit-secondary/60 backdrop-blur-md rounded-xl border border-white/10 shadow-lg ${className}`}
      style={{ backdropFilter: 'blur(8px)' }}
    >
      {children}
    </div>
  );
}

function Button({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
  active = false,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  active?: boolean;
  className?: string;
}) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 rounded-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    default:
      'bg-exhibit-accent/50 hover:bg-exhibit-accent/70 text-white border border-white/10',
    primary:
      'bg-exhibit-highlight/20 hover:bg-exhibit-highlight/30 text-exhibit-highlight border border-exhibit-highlight/30',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30',
    ghost:
      'bg-transparent hover:bg-white/5 text-gray-300 border border-transparent',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const activeClasses = active
    ? 'ring-2 ring-exhibit-highlight ring-offset-2 ring-offset-exhibit-bg'
    : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${activeClasses} ${className}`}
    >
      {children}
    </button>
  );
}

function SceneSelector() {
  const scenes = useSceneStore((s) => s.scenes);
  const currentSceneId = useSceneStore((s) => s.currentSceneId);
  const setCurrentSceneId = useSceneStore((s) => s.setCurrentSceneId);
  const loadScene = useSceneStore((s) => s.loadScene);
  const createEmptyScene = useSceneStore((s) => s.createEmptyScene);
  const [isLoading, setIsLoading] = useState(false);

  const fetchScenes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/scenes');
      const data = await response.json();
      data.forEach((scene: any) => loadScene(scene));
    } catch (error) {
      console.error('Failed to fetch scenes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadScene]);

  useEffect(() => {
    fetchScenes();
  }, [fetchScenes]);

  const handleSceneChange = (sceneId: string) => {
    setCurrentSceneId(sceneId);
  };

  return (
    <GlassPanel className="p-4">
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
        <Box size={18} className="text-exhibit-highlight" />
        场景管理
      </h3>
      <div className="space-y-3">
        <div>
          <label className="text-gray-400 text-xs mb-1 block">选择场景</label>
          <select
            value={currentSceneId || ''}
            onChange={(e) => handleSceneChange(e.target.value)}
            className="w-full bg-exhibit-bg/80 text-white rounded-lg px-3 py-2 border border-white/10 focus:border-exhibit-highlight focus:outline-none transition-colors duration-200 text-sm"
            disabled={isLoading}
          >
            <option value="" disabled>
              {isLoading ? '加载中...' : '请选择场景'}
            </option>
            {scenes.map((scene) => (
              <option key={scene.id} value={scene.id}>
                {scene.name}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={createEmptyScene} variant="ghost" size="sm" className="w-full">
          <Plus size={14} />
          创建空场景
        </Button>
      </div>
    </GlassPanel>
  );
}

function AddExhibitPanel() {
  const addExhibit = useSceneStore((s) => s.addExhibit);

  const exhibitTypes: { type: ExhibitType; icon: React.ReactNode; label: string }[] = [
    { type: 'cube', icon: <Box size={18} />, label: '立方体' },
    { type: 'sphere', icon: <CircleDot size={18} />, label: '球体' },
    { type: 'cylinder', icon: <Cylinder size={18} />, label: '柱体' },
    { type: 'torus', icon: <Circle size={18} />, label: '环体' },
  ];

  return (
    <GlassPanel className="p-4">
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
        <Plus size={18} className="text-exhibit-highlight" />
        添加展品
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {exhibitTypes.map(({ type, icon, label }) => (
          <Button
            key={type}
            onClick={() => addExhibit(type)}
            variant="default"
            size="sm"
            className="w-full"
          >
            {icon}
            {label}
          </Button>
        ))}
      </div>
    </GlassPanel>
  );
}

function NumberInput({
  label,
  icon,
  value,
  onChange,
  step = 0.1,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-500 w-5">{icon}</span>
      <label className="text-gray-400 text-xs w-8">{label}</label>
      <input
        type="number"
        step={step}
        value={Number(value.toFixed(2))}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="flex-1 bg-exhibit-bg/80 text-white rounded-md px-2 py-1.5 text-sm border border-white/10 focus:border-exhibit-highlight focus:outline-none transition-colors duration-200"
      />
    </div>
  );
}

function ExhibitPropertiesPanel() {
  const currentScene = useSceneStore((s) => s.getCurrentScene());
  const selectedExhibitId = useSceneStore((s) => s.selectedExhibitId);
  const updateExhibit = useSceneStore((s) => s.updateExhibit);
  const removeExhibit = useSceneStore((s) => s.removeExhibit);
  const setSelectedExhibitId = useSceneStore((s) => s.setSelectedExhibitId);

  const selectedExhibit = currentScene?.exhibits.find(
    (e) => e.id === selectedExhibitId
  );

  if (!selectedExhibit) {
    return (
      <GlassPanel className="p-4">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Edit3 size={18} className="text-exhibit-highlight" />
          展品属性
        </h3>
        <p className="text-gray-500 text-sm text-center py-4">
          请选择一个展品以编辑属性
        </p>
      </GlassPanel>
    );
  }

  const handlePositionChange = (axis: number, value: number) => {
    const newPosition = [...selectedExhibit.position] as [number, number, number];
    newPosition[axis] = value;
    updateExhibit(selectedExhibit.id, { position: newPosition });
  };

  const handleRotationChange = (axis: number, value: number) => {
    const newRotation = [...selectedExhibit.rotation] as [number, number, number];
    newRotation[axis] = value;
    updateExhibit(selectedExhibit.id, { rotation: newRotation });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateExhibit(selectedExhibit.id, { color: e.target.value });
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateExhibit(selectedExhibit.id, { opacity: parseFloat(e.target.value) });
  };

  const handleScaleChange = (value: number) => {
    updateExhibit(selectedExhibit.id, { scale: Math.max(0.1, value) });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateExhibit(selectedExhibit.id, { name: e.target.value });
  };

  return (
    <GlassPanel className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Edit3 size={18} className="text-exhibit-highlight" />
          展品属性
        </h3>
        <Button
          onClick={() => {
            removeExhibit(selectedExhibit.id);
            setSelectedExhibitId(null);
          }}
          variant="danger"
          size="sm"
        >
          <Trash2 size={14} />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-gray-400 text-xs mb-1 block">展品名称</label>
          <input
            type="text"
            value={selectedExhibit.name}
            onChange={handleNameChange}
            className="w-full bg-exhibit-bg/80 text-white rounded-md px-3 py-2 text-sm border border-white/10 focus:border-exhibit-highlight focus:outline-none transition-colors duration-200"
          />
        </div>

        <div>
          <label className="text-gray-400 text-xs mb-2 block">位置</label>
          <div className="space-y-1.5">
            <NumberInput
              label="X"
              icon={<span className="text-red-400 text-xs font-bold">X</span>}
              value={selectedExhibit.position[0]}
              onChange={(v) => handlePositionChange(0, v)}
            />
            <NumberInput
              label="Y"
              icon={<span className="text-green-400 text-xs font-bold">Y</span>}
              value={selectedExhibit.position[1]}
              onChange={(v) => handlePositionChange(1, v)}
            />
            <NumberInput
              label="Z"
              icon={<span className="text-blue-400 text-xs font-bold">Z</span>}
              value={selectedExhibit.position[2]}
              onChange={(v) => handlePositionChange(2, v)}
            />
          </div>
        </div>

        <div>
          <label className="text-gray-400 text-xs mb-2 block">旋转 (弧度)</label>
          <div className="space-y-1.5">
            <NumberInput
              label="X"
              icon={<RotateCcw size={12} className="text-red-400" />}
              value={selectedExhibit.rotation[0]}
              step={0.1}
              onChange={(v) => handleRotationChange(0, v)}
            />
            <NumberInput
              label="Y"
              icon={<RotateCcw size={12} className="text-green-400" />}
              value={selectedExhibit.rotation[1]}
              step={0.1}
              onChange={(v) => handleRotationChange(1, v)}
            />
            <NumberInput
              label="Z"
              icon={<RotateCcw size={12} className="text-blue-400" />}
              value={selectedExhibit.rotation[2]}
              step={0.1}
              onChange={(v) => handleRotationChange(2, v)}
            />
          </div>
        </div>

        <div>
          <label className="text-gray-400 text-xs mb-2 block">缩放</label>
          <NumberInput
            label="S"
            icon={<Box size={12} className="text-yellow-400" />}
            value={selectedExhibit.scale}
            step={0.1}
            onChange={handleScaleChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">颜色</label>
            <input
              type="color"
              value={selectedExhibit.color}
              onChange={handleColorChange}
              className="w-full h-10 rounded-md cursor-pointer border border-white/10 bg-transparent"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">
              透明度: {selectedExhibit.opacity.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedExhibit.opacity}
              onChange={handleOpacityChange}
              className="w-full h-10 accent-exhibit-highlight"
            />
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

function PathPanel() {
  const currentScene = useSceneStore((s) => s.getCurrentScene());
  const editorMode = useSceneStore((s) => s.editorMode);
  const setEditorMode = useSceneStore((s) => s.setEditorMode);
  const isPlaying = useSceneStore((s) => s.isPlayingPath);
  const setIsPlayingPath = useSceneStore((s) => s.setIsPlayingPath);
  const clearPath = useSceneStore((s) => s.clearPath);

  const pathPoints = currentScene?.path || [];

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlayingPath(false);
    } else {
      setIsPlayingPath(true);
    }
  };

  const toggleDrawMode = () => {
    setEditorMode(editorMode === 'drawPath' ? 'select' : 'drawPath');
  };

  return (
    <GlassPanel className="p-4">
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
        <MapPin size={18} className="text-exhibit-highlight" />
        漫游路径
      </h3>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Button
            onClick={toggleDrawMode}
            variant={editorMode === 'drawPath' ? 'primary' : 'default'}
            size="sm"
            className="flex-1"
            active={editorMode === 'drawPath'}
          >
            {editorMode === 'drawPath' ? <X size={14} /> : <MapPin size={14} />}
            {editorMode === 'drawPath' ? '取消绘制' : '绘制路径'}
          </Button>
          <Button
            onClick={handlePlayPause}
            variant="primary"
            size="sm"
            className="flex-1"
            disabled={pathPoints.length < 2}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? '暂停' : '播放'}
          </Button>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">路径点数</span>
          <span className="text-white">{pathPoints.length}</span>
        </div>

        <Button
          onClick={clearPath}
          variant="danger"
          size="sm"
          className="w-full"
          disabled={pathPoints.length === 0}
        >
          <Trash2 size={14} />
          清除路径
        </Button>

        {editorMode === 'drawPath' && (
          <p className="text-exhibit-highlight text-xs text-center bg-exhibit-highlight/10 rounded-lg py-2 px-3">
            点击地面添加路径关键点
          </p>
        )}
      </div>
    </GlassPanel>
  );
}

function AnalysisPanel() {
  const analysisResults = useSceneStore((s) => s.analysisResults);
  const isPlaying = useSceneStore((s) => s.isPlayingPath);
  const selectedExhibitId = useSceneStore((s) => s.selectedExhibitId);
  const setSelectedExhibitId = useSceneStore((s) => s.setSelectedExhibitId);

  const getProgressColor = (percentage: number) => {
    const r = Math.floor((percentage / 100) * 255);
    const g = Math.floor(((100 - percentage) / 100) * 255);
    return `rgb(${r}, ${g}, 50)`;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}m ${secs}s`;
  };

  return (
    <GlassPanel className="p-4">
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
        <Move size={18} className="text-exhibit-highlight" />
        视线分析结果
      </h3>

      {!isPlaying && analysisResults.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">
          点击播放路径开始分析
        </p>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-exhibit-accent scrollbar-track-transparent">
        {analysisResults.map((result, index) => (
          <div
            key={result.exhibitId}
            onClick={() => setSelectedExhibitId(result.exhibitId)}
            className={`p-3 rounded-lg cursor-pointer transition-all duration-150 group ${
              selectedExhibitId === result.exhibitId
                ? 'bg-exhibit-highlight/20 border border-exhibit-highlight/30'
                : 'bg-exhibit-bg/50 hover:bg-exhibit-bg/70 border border-transparent'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-sm font-medium truncate ${
                  result.isOccluded ? 'text-exhibit-occlusion' : 'text-white'
                }`}
              >
                {result.exhibitName}
              </span>
              {result.isOccluded && (
                <span className="text-xs px-2 py-0.5 bg-exhibit-occlusion/20 text-exhibit-occlusion rounded-full">
                  遮挡中
                </span>
              )}
            </div>
            <div className="h-2 bg-exhibit-bg rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${result.occlusionPercentage}%`,
                  backgroundColor: getProgressColor(result.occlusionPercentage),
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>遮挡: {result.occlusionPercentage.toFixed(1)}%</span>
              <span>时长: {formatDuration(result.occlusionDuration)}</span>
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function SavePanel() {
  const currentScene = useSceneStore((s) => s.getCurrentScene());
  const isSaving = useSceneStore((s) => s.isSaving);
  const saveProgress = useSceneStore((s) => s.saveProgress);
  const setIsSaving = useSceneStore((s) => s.setIsSaving);
  const setSaveProgress = useSceneStore((s) => s.setSaveProgress);
  const setShareUrl = useSceneStore((s) => s.setShareUrl);
  const shareUrl = useSceneStore((s) => s.shareUrl);
  const setErrorMessage = useSceneStore((s) => s.setErrorMessage);
  const errorMessage = useSceneStore((s) => s.errorMessage);

  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    if (!currentScene) return;

    setIsSaving(true);
    setSaveProgress(0);
    setShareUrl(null);
    setErrorMessage(null);

    const progressInterval = setInterval(() => {
      setSaveProgress(Math.min(saveProgress + 20, 90));
    }, 100);

    try {
      const response = await fetch('/api/scenes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: currentScene.name,
          exhibits: currentScene.exhibits,
          path: currentScene.path,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save scene');
      }

      const data = await response.json();
      clearInterval(progressInterval);
      setSaveProgress(100);

      setTimeout(() => {
        setIsSaving(false);
        setShareUrl(data.shareUrl);
      }, 300);
    } catch (error) {
      clearInterval(progressInterval);
      setIsSaving(false);
      setSaveProgress(0);
      setErrorMessage('保存失败，请稍后重试');
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <GlassPanel className="p-4">
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
        <Save size={18} className="text-exhibit-highlight" />
        保存与分享
      </h3>

      <div className="space-y-3">
        <Button
          onClick={handleSave}
          variant="primary"
          className="w-full"
          disabled={!currentScene || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save size={16} />
              保存场景
            </>
          )}
        </Button>

        {isSaving && (
          <div className="space-y-2">
            <div className="h-2 bg-exhibit-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-exhibit-highlight transition-all duration-200"
                style={{ width: `${saveProgress}%` }}
              />
            </div>
            <p className="text-gray-400 text-xs text-center">{saveProgress}%</p>
          </div>
        )}

        {shareUrl && !isSaving && (
          <div className="bg-exhibit-bg/80 rounded-lg p-3 border border-exhibit-highlight/30">
            <p className="text-green-400 text-sm mb-2 flex items-center gap-1">
              <Check size={14} />
              保存成功！
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-exhibit-accent/30 text-gray-300 rounded-md px-3 py-2 text-sm border border-white/10 truncate"
              />
              <Button onClick={handleCopyLink} variant="primary" size="sm">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
          </div>
        )}

        {errorMessage && !isSaving && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <X size={14} />
              {errorMessage}
            </p>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}

export default function UIOverlay() {
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  return (
    <>
      <div className="hidden lg:block fixed top-0 right-0 h-full w-[30%] min-w-[380px] p-4 overflow-y-auto z-10">
        <div className="space-y-4">
          <SceneSelector />
          <AddExhibitPanel />
          <ExhibitPropertiesPanel />
          <PathPanel />
          <AnalysisPanel />
          <SavePanel />
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20">
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="w-full h-8 bg-exhibit-secondary/80 backdrop-blur-md rounded-t-xl border-t border-x border-white/10 flex items-center justify-center transition-transform duration-300"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div
            className={`w-12 h-1 bg-gray-500 rounded-full transition-transform duration-300 ${
              isPanelOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        <div
          className={`bg-exhibit-secondary/95 backdrop-blur-md rounded-t-xl border-t border-x border-white/10 transition-all duration-300 overflow-hidden ${
            isPanelOpen ? 'max-h-[70vh]' : 'max-h-0'
          }`}
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div className="p-4 overflow-y-auto max-h-[70vh] space-y-4">
            <SceneSelector />
            <AddExhibitPanel />
            <ExhibitPropertiesPanel />
            <PathPanel />
            <AnalysisPanel />
            <SavePanel />
          </div>
        </div>
      </div>
    </>
  );
}
