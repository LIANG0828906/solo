import { useState } from 'react';
import { Play, Pause, RotateCcw, Download } from 'lucide-react';
import type { SceneParams } from '@/types';
import { useSceneStore } from '@/store/sceneStore';
import PresetTab from '@/components/panel/PresetTab';
import PathTab from '@/components/panel/PathTab';
import ParamsTab from '@/components/panel/ParamsTab';

type TabType = 'preset' | 'path' | 'params';

interface PanelProps {
  params: SceneParams;
  isPlaying: boolean;
  progress: number;
}

const tabs: { key: TabType; label: string }[] = [
  { key: 'preset', label: '预设选择' },
  { key: 'path', label: '路径编辑' },
  { key: 'params', label: '参数调整' },
];

export default function Panel({ params, isPlaying, progress }: PanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('preset');
  const resetScene = useSceneStore((s) => s.resetScene);
  const setPlaying = useSceneStore((s) => s.setPlaying);
  const setProgress = useSceneStore((s) => s.setProgress);
  const exportConfig = useSceneStore((s) => s.exportConfig);
  const activePathId = useSceneStore((s) => s.activePathId);
  const paths = useSceneStore((s) => s.paths);

  const handleTogglePlay = () => {
    if (!activePathId && paths.length > 0) {
      useSceneStore.setState({ activePathId: paths[0].id });
    }
    if (progress >= 1) {
      setProgress(0);
    }
    setPlaying(!isPlaying);
  };

  const handleReset = () => {
    resetScene();
    setActiveTab('preset');
  };

  const handleExport = () => {
    exportConfig();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'preset':
        return <PresetTab />;
      case 'path':
        return <PathTab />;
      case 'params':
        return <ParamsTab />;
      default:
        return null;
    }
  };

  const canPlay = paths.length > 0;

  return (
    <div className="panel-wrapper">
      <div className="panel-header">
        <div className="panel-title">细胞运输模拟</div>
        <div className="panel-subtitle">3D交互式细胞内物质运输编辑器</div>
      </div>

      <div className="tab-buttons">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content" key={activeTab}>
        {renderTabContent()}
      </div>

      <div className="panel-footer">
        <button className="btn btn-secondary" onClick={handleReset} title="重置场景">
          <RotateCcw size={16} />
          重置
        </button>
        <button
          className={`btn ${isPlaying ? 'btn-pause' : 'btn-play'}`}
          onClick={handleTogglePlay}
          disabled={!canPlay}
          title={canPlay ? (isPlaying ? '暂停' : '播放') : '请先添加路径'}
          style={{ opacity: canPlay ? 1 : 0.5, cursor: canPlay ? 'pointer' : 'not-allowed' }}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          {isPlaying ? '暂停' : '播放'}
        </button>
        <button className="btn btn-primary" onClick={handleExport} title="导出JSON配置">
          <Download size={16} />
          导出
        </button>
      </div>
    </div>
  );
}
