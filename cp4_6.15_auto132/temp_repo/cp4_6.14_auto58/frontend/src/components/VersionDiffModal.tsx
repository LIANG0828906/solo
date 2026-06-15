import React from 'react';
import type { DiffSegment } from '../types';

interface VersionDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  diffs: DiffSegment[];
  baseVersion?: string;
  targetVersion?: string;
}

const VersionDiffModal: React.FC<VersionDiffModalProps> = ({
  isOpen,
  onClose,
  diffs,
  baseVersion,
  targetVersion,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-4/5 max-w-4xl max-h-[80vh] flex flex-col animate-fade-in">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            版本对比
            {baseVersion && targetVersion && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                {baseVersion} → {targetVersion}
              </span>
            )}
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 font-mono text-sm">
          {diffs.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              暂无差异数据
            </div>
          ) : (
            <div className="space-y-0.5">
              {diffs.map((segment, index) => (
                <div
                  key={index}
                  className={`px-3 py-1 rounded ${
                    segment.type === 'added'
                      ? 'bg-green-100 text-green-800'
                      : segment.type === 'removed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="inline-block w-12 text-gray-400 text-xs">
                    {segment.lineNumber}
                  </span>
                  <span className="inline-block w-6 text-center">
                    {segment.type === 'added'
                      ? '+'
                      : segment.type === 'removed'
                      ? '-'
                      : ' '}
                  </span>
                  <span>{segment.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionDiffModal;
