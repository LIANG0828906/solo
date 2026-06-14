import React from 'react';
import type { Version } from '../types';

interface VersionHistoryProps {
  versions: Version[];
  onCompare: (baseId: string, targetId: string) => void;
  onSaveVersion: (description?: string) => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({
  versions,
  onCompare,
  onSaveVersion,
}) => {
  const [description, setDescription] = React.useState('');
  const [selectedBase, setSelectedBase] = React.useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = React.useState<string | null>(null);

  const handleSave = () => {
    onSaveVersion(description.trim() || undefined);
    setDescription('');
  };

  const handleCompare = () => {
    if (selectedBase && selectedTarget) {
      onCompare(selectedBase, selectedTarget);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-800">版本历史</h3>
        <p className="text-xs text-gray-500 mt-1">共 {versions.length} 个版本</p>
      </div>
      <div className="p-3 border-b border-gray-200 space-y-2">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="版本描述（可选）"
          className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          className="w-full text-sm px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={handleSave}
        >
          保存新版本
        </button>
      </div>
      {versions.length >= 2 && (
        <div className="p-3 border-b border-gray-200 space-y-2 bg-gray-50">
          <p className="text-xs text-gray-600 font-medium">版本对比</p>
          <div className="flex gap-2">
            <select
              className="flex-1 text-xs px-2 py-1.5 border border-gray-300 rounded"
              value={selectedBase || ''}
              onChange={(e) => setSelectedBase(e.target.value || null)}
            >
              <option value="">选择基准版本</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.version}
                </option>
              ))}
            </select>
            <select
              className="flex-1 text-xs px-2 py-1.5 border border-gray-300 rounded"
              value={selectedTarget || ''}
              onChange={(e) => setSelectedTarget(e.target.value || null)}
            >
              <option value="">选择目标版本</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.version}
                </option>
              ))}
            </select>
          </div>
          <button
            className={`w-full text-xs px-3 py-1.5 rounded transition-colors ${
              selectedBase && selectedTarget
                ? 'bg-purple-500 text-white hover:bg-purple-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={handleCompare}
            disabled={!selectedBase || !selectedTarget}
          >
            对比版本
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {versions.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            暂无版本记录
          </div>
        ) : (
          versions.map((version) => (
            <div
              key={version.id}
              className="p-3 rounded-md border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">
                  v{version.version}
                </span>
                <span className="text-xs text-gray-500">
                  {version.createdBy}
                </span>
              </div>
              {version.description && (
                <p className="text-xs text-gray-600 mt-1">
                  {version.description}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {new Date(version.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VersionHistory;
