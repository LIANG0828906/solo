import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle, Clock, User } from 'lucide-react';
import type { CaseEntry } from '@/types';
import { useStore } from '@/store';

const getCaseTagClass = (caseType: CaseEntry['caseType']) => {
  switch (caseType) {
    case 'homicide': return 'tag-homicide';
    case 'land': return 'tag-land';
    case 'marriage': return 'tag-marriage';
    default: return '';
  }
};

const getCaseTypeLabel = (caseType: CaseEntry['caseType']) => {
  switch (caseType) {
    case 'homicide': return '命案';
    case 'land': return '田土';
    case 'marriage': return '戶婚';
    default: return '';
  }
};

const getUrgencyLabel = (urgency: CaseEntry['urgency']) => {
  switch (urgency) {
    case 'high': return '緊急';
    case 'medium': return '普通';
    case 'low': return '輕緩';
    default: return '';
  }
};

interface CaseItemProps {
  caseData: CaseEntry;
  isSelected: boolean;
  onClick: () => void;
}

const CaseItem = memo(({ caseData, isSelected, onClick }: CaseItemProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={`antique-card p-3 cursor-pointer mb-2 ${
        isSelected ? 'ring-2 ring-red-800' : ''
      } ${caseData.isDifficult ? 'difficult-case' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-bold text-amber-200">{caseData.caseNumber}</span>
        <span className={`case-tag ${getCaseTagClass(caseData.caseType)}`}>
          {getCaseTypeLabel(caseData.caseType)}
        </span>
      </div>
      
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-1 text-gray-300">
          <User size={12} />
          <span>原告：{caseData.plaintiff}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <Clock size={12} />
          <span>{caseData.receiveTime}</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle 
            size={12} 
            className={caseData.urgency === 'high' ? 'text-red-500' : caseData.urgency === 'medium' ? 'text-yellow-500' : 'text-green-500'}
          />
          <span className={caseData.urgency === 'high' ? 'text-red-400' : caseData.urgency === 'medium' ? 'text-yellow-400' : 'text-green-400'}>
            {getUrgencyLabel(caseData.urgency)}
          </span>
          {caseData.isDifficult && (
            <span className="ml-2 text-red-400 text-[10px] border border-red-600 px-1 rounded">
              疑難
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});

CaseItem.displayName = 'CaseItem';

interface CaseListProps {
  isDrawerOpen?: boolean;
  onCloseDrawer?: () => void;
}

export const CaseList: React.FC<CaseListProps> = ({ isDrawerOpen, onCloseDrawer }) => {
  const { cases, currentCase, setCurrentCase } = useStore();

  const pendingCases = cases.filter(c => c.status === 'pending');
  const reviewCases = cases.filter(c => c.status === 'review');
  const closedCases = cases.filter(c => c.status === 'closed');

  const handleCaseClick = (caseData: CaseEntry) => {
    setCurrentCase(caseData);
    if (onCloseDrawer) {
      onCloseDrawer();
    }
  };

  return (
    <div 
      className={`case-list-desktop case-list-drawer ${isDrawerOpen ? 'open' : ''} 
        h-full overflow-y-auto p-3 bg-gray-900/95`}
    >
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-amber-900">
        <FileText className="text-amber-500" size={20} />
        <h2 className="text-lg font-bold text-amber-200">待辦案卷</h2>
        <span className="ml-auto text-xs text-gray-400">{cases.length}件</span>
      </div>

      {reviewCases.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm text-red-400 mb-2 flex items-center gap-1">
            <AlertTriangle size={14} />
            發回重審 ({reviewCases.length})
          </h3>
          {reviewCases.map(caseData => (
            <CaseItem
              key={caseData.id}
              caseData={caseData}
              isSelected={currentCase?.id === caseData.id}
              onClick={() => handleCaseClick(caseData)}
            />
          ))}
        </div>
      )}

      {pendingCases.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm text-amber-300 mb-2">
            待審 ({pendingCases.length})
          </h3>
          {pendingCases.map(caseData => (
            <CaseItem
              key={caseData.id}
              caseData={caseData}
              isSelected={currentCase?.id === caseData.id}
              onClick={() => handleCaseClick(caseData)}
            />
          ))}
        </div>
      )}

      {closedCases.length > 0 && (
        <div>
          <h3 className="text-sm text-gray-500 mb-2">
            已結 ({closedCases.length})
          </h3>
          {closedCases.map(caseData => (
            <CaseItem
              key={caseData.id}
              caseData={caseData}
              isSelected={currentCase?.id === caseData.id}
              onClick={() => handleCaseClick(caseData)}
            />
          ))}
        </div>
      )}

      {cases.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <FileText size={32} className="mx-auto mb-2 opacity-50" />
          <p>暫無案卷</p>
        </div>
      )}
    </div>
  );
};
