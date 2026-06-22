import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { usePawnStore } from '../store/pawnStore';
import { getItemIcon } from './ItemIcons';
import type { PawnItem, PawnStatus } from '../types';

const statusLabels: Record<PawnStatus, { label: string; color: string }> = {
  active: { label: '在当', color: '#d4af37' },
  redeemed: { label: '已赎当', color: '#50a860' },
  dead: { label: '死当', color: '#c04040' },
  sold: { label: '已售出', color: '#8b5e3c' }
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

const Book: React.FC = () => {
  const { items, redeem } = usePawnStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<PawnStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        const matchesSearch = 
          item.guestName.includes(searchTerm) ||
          item.itemName.includes(searchTerm) ||
          item.description.includes(searchTerm);
        const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.pawnDate).getTime() - new Date(a.pawnDate).getTime());
  }, [items, searchTerm, filterStatus]);

  const handleRedeem = (itemId: string) => {
    if (confirm('确认赎当？将收取当本+利息。')) {
      redeem(itemId);
    }
  };

  const calculateInterest = (item: PawnItem): number => {
    const months = 6;
    return Math.round(item.pawnAmount * item.monthlyInterest * months);
  };

  return (
    <div className="h-full bg-[#f5e6c8] flex flex-col">
      <div className="p-4 bg-[#8b5e3c] text-[#f5e6c8]">
        <h2 className="text-2xl font-brush font-bold text-center mb-3">恒升当 · 流水账</h2>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8b5e3c]" />
            <input
              type="text"
              placeholder="搜索客人、物品..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded bg-[#f5e6c8] text-[#2a1f18] placeholder-[#8b5e3c] text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded bg-[#f5e6c8] text-[#8b5e3c] hover:bg-[#e8d5a3] transition-colors"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#6b4226]">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    filterStatus === 'all'
                      ? 'bg-[#c04040] text-white'
                      : 'bg-[#f5e6c8] text-[#8b5e3c] hover:bg-[#e8d5a3]'
                  }`}
                >
                  全部
                </button>
                {Object.entries(statusLabels).map(([status, info]) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status as PawnStatus)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      filterStatus === status
                        ? 'bg-[#c04040] text-white'
                        : 'bg-[#f5e6c8] text-[#8b5e3c] hover:bg-[#e8d5a3]'
                    }`}
                  >
                    {info.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-[#e8d5a3]">
            <tr className="text-[#8b5e3c] text-sm">
              <th className="py-3 px-2 text-left font-bold">日期</th>
              <th className="py-3 px-2 text-left font-bold">客人</th>
              <th className="py-3 px-2 text-left font-bold">物品</th>
              <th className="py-3 px-2 text-right font-bold">当本</th>
              <th className="py-3 px-2 text-center font-bold">状态</th>
              <th className="py-3 px-2 text-center font-bold">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#8b5e3c]">
                  暂无记录
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <React.Fragment key={item.id}>
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b border-[#e8d5a3] hover:bg-[#f0e0b8] cursor-pointer transition-colors"
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  >
                    <td className="py-3 px-2 text-sm text-[#2a1f18]">
                      {formatDate(item.pawnDate)}
                    </td>
                    <td className="py-3 px-2 text-sm text-[#2a1f18] font-medium">
                      {item.guestName}
                    </td>
                    <td className="py-3 px-2 text-sm text-[#2a1f18]">
                      <div className="flex items-center gap-2">
                        {React.createElement(getItemIcon(item.itemType), { size: 24 })}
                        <span>{item.itemName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-right font-bold text-[#c04040]">
                      {item.pawnAmount}文
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className="inline-block px-2 py-1 rounded text-xs font-bold"
                        style={{
                          backgroundColor: statusLabels[item.status].color + '30',
                          color: statusLabels[item.status].color
                        }}
                      >
                        {statusLabels[item.status].label}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {item.status === 'active' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRedeem(item.id);
                            }}
                            className="px-2 py-1 bg-[#50a860] text-white text-xs rounded hover:bg-[#409850] transition-colors"
                          >
                            赎当
                          </button>
                        )}
                        {expandedId === item.id ? (
                          <ChevronUp className="w-4 h-4 text-[#8b5e3c]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#8b5e3c]" />
                        )}
                      </div>
                    </td>
                  </motion.tr>
                  
                  <AnimatePresence>
                    {expandedId === item.id && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-[#f0e0b8]"
                      >
                        <td colSpan={6} className="py-0">
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-4"
                          >
                            <div className="bg-[#f5e6c8] border-2 border-[#c04040] rounded-lg p-4 relative overflow-hidden">
                              <div className="absolute top-2 right-2 w-20 h-20 opacity-20">
                                <div className="w-full h-full border-4 border-[#c04040] rounded-full flex items-center justify-center transform rotate-12">
                                  <span className="text-[#c04040] font-brush text-xl font-bold">恒升当</span>
                                </div>
                              </div>
                              
                              <div className="text-center mb-3">
                                <h3 className="text-xl font-brush font-bold text-[#c04040]">当票</h3>
                                <div className="text-xs text-[#8b5e3c]">票号: {item.id.slice(0, 8).toUpperCase()}</div>
                              </div>
                              
                              <div className="border-t border-b border-dashed border-[#8b5e3c] my-3 py-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-[#8b5e3c]">当户：</span>
                                    <span className="font-bold">{item.guestName}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#8b5e3c]">日期：</span>
                                    <span>{formatDate(item.pawnDate)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#8b5e3c]">当物：</span>
                                    <span className="font-bold">{item.itemName}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#8b5e3c]">材质：</span>
                                    <span>{item.material}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#8b5e3c]">年代：</span>
                                    <span>{item.era}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#8b5e3c]">品相：</span>
                                    <span>{item.condition}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mb-3">
                                <div className="text-xs text-[#8b5e3c] mb-1">物品描述：</div>
                                <div className="text-sm text-[#2a1f18]">{item.description}</div>
                                {item.flaws.length > 0 && (
                                  <div className="mt-2">
                                    <div className="text-xs text-[#c04040] mb-1">瑕疵说明：</div>
                                    <ul className="text-xs text-[#c04040] list-disc list-inside">
                                      {item.flaws.map((flaw, idx) => (
                                        <li key={idx}>{flaw}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              
                              <div className="border-t border-dashed border-[#8b5e3c] pt-3">
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <div className="text-xs text-[#8b5e3c]">当本</div>
                                    <div className="text-lg font-bold text-[#c04040]">{item.pawnAmount}文</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-[#8b5e3c]">月利</div>
                                    <div className="text-lg font-bold text-[#c04040]">2分</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-[#8b5e3c]">到期</div>
                                    <div className="text-sm font-bold text-[#c04040]">{formatDate(item.expireDate)}</div>
                                  </div>
                                </div>
                                
                                {item.status === 'active' && (
                                  <div className="mt-3 pt-3 border-t border-dashed border-[#8b5e3c]">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <div className="text-xs text-[#8b5e3c]">预计赎当金额</div>
                                        <div className="text-lg font-bold text-[#50a860]">
                                          {item.pawnAmount + calculateInterest(item)}文
                                          <span className="text-xs ml-1 opacity-70">
                                            (本{/*金*/}：{item.pawnAmount} + 利息：{calculateInterest(item)})
                                          </span>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleRedeem(item.id)}
                                        className="px-4 py-2 bg-[#50a860] text-white rounded font-bold hover:bg-[#409850] transition-colors"
                                      >
                                        办理赎当
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Book;
