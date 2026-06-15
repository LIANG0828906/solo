import React from 'react';
import ObjectiveCard from '../components/ObjectiveCard';
import type { Objective } from '../../types';

interface ObjectiveListProps {
  objectives: Objective[];
  loading: boolean;
  onConfidenceChange: (objectiveId: string, krId: string, value: number) => void;
  onCreateClick: () => void;
}

const ObjectiveList: React.FC<ObjectiveListProps> = ({ objectives, loading, onConfidenceChange, onCreateClick }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1a237e] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">目标列表</h2>
          <p className="text-gray-500 mt-1">共 {objectives.length} 个目标</p>
        </div>
      </div>

      {objectives.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">暂无目标</h3>
          <p className="text-gray-400 mb-4">点击上方按钮创建第一个目标</p>
          <button
            onClick={onCreateClick}
            className="px-6 py-2.5 bg-[#1a237e] text-white rounded-lg font-medium btn hover:bg-[#3949ab]"
          >
            创建目标
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {objectives.map((objective, index) => (
            <div key={objective.id} style={{ animationDelay: `${index * 0.1}s` }}>
              <ObjectiveCard
                objective={objective}
                onConfidenceChange={onConfidenceChange}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ObjectiveList;
