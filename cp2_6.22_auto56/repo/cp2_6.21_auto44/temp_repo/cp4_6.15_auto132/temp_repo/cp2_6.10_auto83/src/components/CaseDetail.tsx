import React from 'react';
import { motion } from 'framer-motion';
import { ScrollText, Users, Package, CheckCircle2, Circle } from 'lucide-react';
import { useStore } from '@/store';

export const CaseDetail: React.FC = () => {
  const { currentCase, toggleWitness, toggleEvidence } = useStore();

  if (!currentCase) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <ScrollText size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">請從左側選擇案卷</p>
          <p className="text-sm mt-2">點擊案卷查看狀紙詳情</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-amber-900">
        <ScrollText className="text-amber-500" size={20} />
        <h2 className="text-lg font-bold text-amber-200">
          {currentCase.caseNumber} - {currentCase.plaintiff}
        </h2>
        {currentCase.isDifficult && (
          <span className="text-red-400 text-xs border border-red-600 px-2 py-0.5 rounded">
            疑難案件
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        <div className="antique-card p-4">
          <h3 className="text-sm text-amber-400 mb-3 flex items-center gap-2">
            <ScrollText size={16} />
            狀紙全文
          </h3>
          <div className="paper-bg p-6 rounded-lg overflow-x-auto">
            <div className="vertical-text h-64 text-sm leading-loose">
              {currentCase.paperContent}
            </div>
          </div>
        </div>

        <div className="antique-card p-4">
          <h3 className="text-sm text-amber-400 mb-3 flex items-center gap-2">
            <Users size={16} />
            人證 ({currentCase.witnesses.length})
          </h3>
          <div className="flex flex-wrap gap-4">
            {currentCase.witnesses.map(witness => (
              <div key={witness.id} className="flex flex-col items-center">
                <div
                  className={`witness-avatar ${witness.selected ? 'selected' : ''}`}
                  onClick={() => toggleWitness(currentCase.id, witness.id)}
                >
                  {witness.avatar}
                </div>
                <span className="text-xs text-gray-300 mt-1">{witness.name}</span>
                <div className="flex items-center gap-1 mt-1">
                  {witness.selected ? (
                    <CheckCircle2 size={12} className="text-green-500" />
                  ) : (
                    <Circle size={12} className="text-gray-600" />
                  )}
                  <span className="text-[10px] text-gray-500">
                    {witness.selected ? '已採信' : '未採信'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 max-w-24 text-center line-clamp-2">
                  {witness.testimony}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="antique-card p-4">
          <h3 className="text-sm text-amber-400 mb-3 flex items-center gap-2">
            <Package size={16} />
            物證 ({currentCase.evidences.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {currentCase.evidences.map(evidence => (
              <div
                key={evidence.id}
                className={`evidence-icon ${evidence.selected ? 'selected' : ''}`}
                onClick={() => toggleEvidence(currentCase.id, evidence.id)}
              >
                <span className="text-2xl">{evidence.icon}</span>
                <span className="text-[10px] text-gray-300 mt-1 text-center px-1">
                  {evidence.name}
                </span>
                <div className="flex items-center gap-1 mt-1">
                  {evidence.selected ? (
                    <CheckCircle2 size={10} className="text-green-500" />
                  ) : (
                    <Circle size={10} className="text-gray-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {(currentCase.defendantInjured || currentCase.testimonyConflict) && (
          <div className="antique-card p-4 border-l-4 border-red-700">
            <h3 className="text-sm text-red-400 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              案情疑點
            </h3>
            <ul className="text-xs text-gray-300 space-y-1">
              {currentCase.defendantInjured && (
                <li>• 被告聲稱有傷，可能有冤抑</li>
              )}
              {currentCase.testimonyConflict && (
                <li>• 證人之間證詞存在矛盾</li>
              )}
            </ul>
            <p className="text-[10px] text-red-400 mt-2">
              ⚠️ 判決後可能觸發喊冤機制
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
