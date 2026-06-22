import { useCallback } from 'react';
import { useStore } from '@/store';
import { Clock, RotateCcw, Save } from 'lucide-react';

export function VersionHistory() {
  const { versionHistory, restoreVersion, addVersion } = useStore();

  const handleRestore = useCallback(
    (versionId: string) => {
      if (window.confirm('确定要恢复到此版本吗？当前内容将被覆盖。')) {
        restoreVersion(versionId);
      }
    },
    [restoreVersion]
  );

  const handleManualSave = useCallback(() => {
    const description = window.prompt('请输入版本描述：', '手动保存');
    if (description !== null) {
      addVersion(description || '手动保存');
    }
  }, [addVersion]);

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#0F3460] bg-[#0F3460]/30">
        <h3 className="text-[#E0E0E0] font-medium">
          版本历史 <span className="text-[#E0E0E0]/50">({versionHistory.length})</span>
        </h3>
        <button
          onClick={handleManualSave}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#E94560] text-white rounded-lg text-sm hover:bg-[#E94560]/80 transition-all duration-200 hover:scale-105"
        >
          <Save size={14} />
          保存版本
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {versionHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Clock size={48} className="text-[#E0E0E0]/30 mb-4" />
            <p className="text-[#E0E0E0]/50 text-sm">暂无历史版本</p>
            <p className="text-[#E0E0E0]/30 text-xs mt-2">
              每10分钟或停止输入5分钟后自动保存
            </p>
          </div>
        ) : (
          versionHistory.map((version, index) => (
            <div
              key={version.id}
              className="bg-[#1A1A2E] rounded-lg p-4 border border-[#0F3460] hover:border-[#3498DB]/50 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[#3498DB]" />
                  <span className="text-[#E0E0E0] text-sm font-medium">
                    {formatTimestamp(version.timestamp)}
                  </span>
                  {index === 0 && (
                    <span className="px-2 py-0.5 bg-[#3498DB]/20 text-[#3498DB] text-xs rounded-full">
                      当前
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRestore(version.id)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-[#E0E0E0]/70 hover:text-[#E94560] hover:bg-[#E94560]/10 rounded transition-colors"
                >
                  <RotateCcw size={12} />
                  恢复
                </button>
              </div>
              <p className="text-[#E0E0E0]/70 text-sm">{version.description}</p>
              <div className="mt-2 text-xs text-[#E0E0E0]/30">
                {version.content.length} 字符
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-2 border-t border-[#0F3460] bg-[#0F3460]/20">
        <div className="flex items-center justify-between text-xs text-[#E0E0E0]/50">
          <span>自动保存: 10分钟间隔</span>
          <span>空闲保存: 5分钟</span>
        </div>
      </div>
    </div>
  );
}
