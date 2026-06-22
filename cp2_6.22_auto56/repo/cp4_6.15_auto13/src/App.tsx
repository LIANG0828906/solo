import React, { useState, useEffect } from 'react';
import { Edit3, Eye, BarChart3, Download, Upload, Plus } from 'lucide-react';
import { useStore } from './store';
import { TabType } from './types';
import StorageEditor from './StorageEditor';
import ThreeViewer from './ThreeViewer';
import DataPanel from './DataPanel';
import { exportToJSON, importFromJSON } from './utils';

const App: React.FC = () => {
  const { activeTab, setActiveTab, units, importData, addUnit } = useStore();
  const [visibleTab, setVisibleTab] = useState<TabType>(activeTab);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab !== visibleTab) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setVisibleTab(activeTab);
        setIsTransitioning(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab, visibleTab]);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'editor', label: '编辑', icon: <Edit3 size={18} /> },
    { id: 'preview', label: '预览', icon: <Eye size={18} /> },
    { id: 'analysis', label: '分析', icon: <BarChart3 size={18} /> },
  ];

  const handleTabClick = (tab: TabType) => {
    if (tab !== activeTab && !isTransitioning) {
      setActiveTab(tab);
    }
  };

  const handleExport = () => {
    exportToJSON(units);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const data = await importFromJSON(file);
        if (Array.isArray(data)) {
          importData(data);
        }
      } catch (err) {
        alert('导入失败，请检查文件格式');
      }
    }
    e.target.value = '';
  };

  const renderContent = () => {
    const opacity = isTransitioning ? 0 : 1;
    const transform = isTransitioning ? 'translateY(10px)' : 'translateY(0)';
    const style = {
      opacity,
      transform,
      transition: 'opacity 300ms ease-in-out, transform 300ms ease-in-out',
    };

    switch (visibleTab) {
      case 'editor':
        return <div style={style}><StorageEditor /></div>;
      case 'preview':
        return <div style={style}><ThreeViewer /></div>;
      case 'analysis':
        return <div style={style}><DataPanel /></div>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#f5f5f5]">
      <header className="flex-shrink-0 bg-white shadow-sm z-50">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-800 hidden sm:block">
            🏠 家庭储物空间规划工具
          </h1>
          <h1 className="text-lg font-bold text-gray-800 sm:hidden">
            🏠 储物规划
          </h1>

          <div className="flex items-center gap-1 sm:gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`btn-transition flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => addUnit('cabinet')}
              className="btn-transition p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              title="添加柜子"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={handleImportClick}
              className="btn-transition p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              title="导入JSON"
            >
              <Upload size={18} />
            </button>
            <button
              onClick={handleExport}
              className="btn-transition p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              title="导出JSON"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  );
};

export default App;
