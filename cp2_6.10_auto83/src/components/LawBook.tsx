import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, RotateCcw, X, Quote } from 'lucide-react';
import type { LawArticle, Department } from '@/types';
import { useStore } from '@/store';
import { highlightLawText } from '@/utils/judgementValidator';

const departments: Department[] = ['吏', '戶', '禮', '兵', '刑', '工'];

const getStrokeGroups = () => {
  const groups = [];
  for (let i = 1; i <= 20; i += 3) {
    groups.push(`${i}-${i + 2}畫`);
  }
  return groups;
};

const strokeGroups = getStrokeGroups();

interface LawCardProps {
  law: LawArticle;
  keyword: string;
  isCited: boolean;
  onCite: () => void;
}

const LawCard: React.FC<LawCardProps> = ({ law, keyword, isCited, onCite }) => {
  const highlightedContent = useMemo(() => 
    highlightLawText(law.content, keyword),
    [law.content, keyword]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="antique-card p-3 mb-2"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-amber-300 font-bold text-sm">{law.title}</h4>
          <div className="flex gap-2 mt-1">
            <span className="text-[10px] bg-amber-900/50 text-amber-400 px-2 py-0.5 rounded">
              {law.department}部
            </span>
            <span className="text-[10px] bg-gray-700 text-gray-400 px-2 py-0.5 rounded">
              {law.strokeCount}畫
            </span>
          </div>
        </div>
        <button
          onClick={onCite}
          disabled={isCited}
          className={`antique-btn text-xs ${
            isCited ? 'opacity-50 cursor-not-allowed' : 'antique-btn-primary'
          }`}
        >
          {isCited ? '已援引' : '援引'}
        </button>
      </div>
      
      <p 
        className="text-xs text-gray-300 leading-relaxed mb-2"
        dangerouslySetInnerHTML={{ __html: highlightedContent }}
      />
      
      <div className="flex flex-wrap gap-1">
        {law.keywords.map((kw, idx) => (
          <span
            key={idx}
            className={`text-[10px] px-2 py-0.5 rounded ${
              keyword && kw.includes(keyword)
                ? 'bg-yellow-600/30 text-yellow-300'
                : 'bg-gray-700/50 text-gray-400'
            }`}
          >
            {kw}
          </span>
        ))}
      </div>
      
      {law.penalty.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-700">
          <p className="text-[10px] text-red-400">
            量刑：{law.penalty.join('、')}
          </p>
        </div>
      )}
    </motion.div>
  );
};

interface LawBookProps {
  isMobile?: boolean;
}

export const LawBook: React.FC<LawBookProps> = ({ isMobile = false }) => {
  const { laws, citedLaws, addCitedLaw } = useStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<'department' | 'stroke'>('department');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedStrokeGroup, setSelectedStrokeGroup] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const filteredLaws = useMemo(() => {
    let filtered = [...laws];

    if (searchKeyword) {
      filtered = filtered.filter(law =>
        law.title.includes(searchKeyword) ||
        law.content.includes(searchKeyword) ||
        law.keywords.some(k => k.includes(searchKeyword))
      );
    } else if (activeTab === 'department' && selectedDepartment) {
      filtered = filtered.filter(law => law.department === selectedDepartment);
    } else if (activeTab === 'stroke' && selectedStrokeGroup) {
      const [min, max] = selectedStrokeGroup.split('-').map(s => parseInt(s));
      filtered = filtered.filter(law => law.strokeCount >= min && law.strokeCount <= max);
    }

    return filtered;
  }, [laws, searchKeyword, activeTab, selectedDepartment, selectedStrokeGroup]);

  const handleCite = useCallback((law: LawArticle) => {
    addCitedLaw(law);
  }, [addCitedLaw]);

  const isLawCited = useCallback((lawId: string) => {
    return citedLaws.some(l => l.id === lawId);
  }, [citedLaws]);

  const handleClear = () => {
    setSearchKeyword('');
    setSelectedDepartment(null);
    setSelectedStrokeGroup(null);
  };

  const shelfContent = (
    <div className="shelf-3d">
      <motion.div
        className="shelf-grid"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-1">
          <div className="text-xs text-amber-500 text-center py-1 border-b border-amber-900">
            六部分類
          </div>
          {departments.map(dept => (
            <div
              key={dept}
              className={`shelf-cell ${selectedDepartment === dept && activeTab === 'department' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('department');
                setSelectedDepartment(dept === selectedDepartment ? null : dept);
                setSelectedStrokeGroup(null);
                setSearchKeyword('');
              }}
            >
              <span className="text-amber-200 text-lg font-bold">{dept}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <div className="text-xs text-amber-500 text-center py-1 border-b border-amber-900">
            筆畫索引
          </div>
          {strokeGroups.map(group => (
            <div
              key={group}
              className={`shelf-cell ${selectedStrokeGroup === group && activeTab === 'stroke' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('stroke');
                setSelectedStrokeGroup(group === selectedStrokeGroup ? null : group);
                setSelectedDepartment(null);
                setSearchKeyword('');
              }}
            >
              <span className="text-amber-200 text-xs">{group}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const lawListContent = (
    <div className="h-full overflow-y-auto pr-1">
      <AnimatePresence>
        {filteredLaws.length > 0 ? (
          filteredLaws.map(law => (
            <LawCard
              key={law.id}
              law={law}
              keyword={searchKeyword}
              isCited={isLawCited(law.id)}
              onCite={() => handleCite(law)}
            />
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-500 py-8"
          >
            <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">未找到相關律例</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (isMobile) {
    return (
      <div className="shelf-mobile w-full">
        <div className="flex gap-2">
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => {
                setSelectedDepartment(dept === selectedDepartment ? null : dept);
                setActiveTab('department');
              }}
              className={`antique-btn text-xs whitespace-nowrap ${
                selectedDepartment === dept ? 'antique-btn-primary' : ''
              }`}
            >
              {dept}部
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-amber-900">
        <BookOpen className="text-amber-500" size={20} />
        <h2 className="text-lg font-bold text-amber-200">大清律例</h2>
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="ml-auto antique-btn text-xs"
          title="翻轉書架"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        <input
          type="text"
          placeholder="輸入關鍵字：毆、盜、姦、殺..."
          value={searchKeyword}
          onChange={(e) => {
            setSearchKeyword(e.target.value);
            setSelectedDepartment(null);
            setSelectedStrokeGroup(null);
          }}
          className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-amber-900 rounded text-sm text-amber-100 placeholder-gray-500 focus:outline-none focus:border-amber-600"
        />
        {searchKeyword && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setActiveTab('department')}
          className={`flex-1 antique-btn text-xs ${activeTab === 'department' ? 'antique-btn-primary' : ''}`}
        >
          六部分類
        </button>
        <button
          onClick={() => setActiveTab('stroke')}
          className={`flex-1 antique-btn text-xs ${activeTab === 'stroke' ? 'antique-btn-primary' : ''}`}
        >
          筆畫索引
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex gap-3">
        <div className="w-1/2 overflow-y-auto pr-1 shelf-desktop">
          {shelfContent}
        </div>
        <div className="flex-1 overflow-hidden">
          {citedLaws.length > 0 && (
            <div className="mb-3 p-2 bg-red-900/20 border border-red-800 rounded">
              <div className="text-xs text-red-400 mb-2 flex items-center gap-1">
                <Quote size={12} />
                已援引 {citedLaws.length} 條律例
              </div>
              <div className="flex flex-wrap gap-1">
                {citedLaws.map(law => (
                  <span
                    key={law.id}
                    className="text-[10px] bg-red-900/50 text-red-300 px-2 py-0.5 rounded"
                  >
                    {law.title}
                  </span>
                ))}
              </div>
            </div>
          )}
          {lawListContent}
        </div>
      </div>
    </div>
  );
};
