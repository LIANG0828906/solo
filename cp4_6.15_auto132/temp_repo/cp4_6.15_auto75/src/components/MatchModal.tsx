import { useState } from 'react';
import { X, Search, Sparkles, SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { postMatch } from '@/utils/api';
import { toast } from '@/hooks/useToast';
import type { MatchResult } from '@/types';
import ItemCard from './ItemCard';

interface MatchModalProps {
  open: boolean;
  onClose: () => void;
  onClaimed: () => void;
}

export default function MatchModal({ open, onClose, onClaimed }: MatchModalProps) {
  const [description, setDescription] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleClose = () => {
    if (isSearching) return;
    setDescription('');
    setResults(null);
    setHasSearched(false);
    onClose();
  };

  const handleSearch = async () => {
    if (!description.trim()) {
      toast('请输入失物特征描述', 'error');
      return;
    }
    if (description.trim().length < 4) {
      toast('描述太短，请详细描述物品特征', 'error');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      const data = await postMatch(description.trim());
      setResults(data);
      if (data.length === 0) {
        toast('未找到匹配的物品，试试换个描述方式', 'info');
      } else {
        const highCount = data.filter(r => r.isHighMatch).length;
        if (highCount > 0) {
          toast(`找到 ${data.length} 个结果，其中 ${highCount} 个高度匹配！`, 'success');
        } else {
          toast(`找到 ${data.length} 个相关结果`, 'info');
        }
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : '匹配失败，请重试', 'error');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleBack = () => {
    setResults(null);
    setHasSearched(false);
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-opacity duration-300',
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      )}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div
        className={cn(
          'relative w-full sm:max-w-2xl bg-[#FFF8F0] sm:rounded-2xl rounded-t-3xl shadow-2xl',
          'max-h-[90vh] overflow-hidden flex flex-col',
          'transition-transform duration-300 ease-out',
          open ? 'translate-y-0 sm:scale-100' : 'translate-y-full sm:translate-y-0 sm:scale-95'
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-white/60">
          <div className="flex items-center gap-3">
            {results !== null && (
              <button
                onClick={handleBack}
                disabled={isSearching}
                className="p-2 -ml-2 rounded-full hover:bg-orange-100 transition-colors text-gray-500 hover:text-gray-700"
              >
                ←
              </button>
            )}
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-[#FFA726] to-amber-400 rounded-full" />
              {results !== null ? '匹配结果' : '智能匹配认领'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSearching}
            className="p-2 rounded-full hover:bg-orange-100 transition-colors text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {results === null ? (
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="relative p-5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFA726] flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-200/60">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">AI 智能匹配</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    描述您丢失物品的特征（颜色、材质、特殊标记等），
                    <br />
                    系统会自动从数据库中找出最相似的物品。
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                物品特征描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例如：黑色折叠雨伞，手柄有红色绳结，伞面有白色小花图案..."
                rows={5}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 focus:border-[#FFA726] outline-none transition-colors bg-white resize-none text-gray-700 leading-relaxed"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSearch();
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">提示：描述越详细，匹配越准确</p>
                <p className="text-xs text-gray-400">{description.length}/500</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">快速示例</p>
              <div className="flex flex-wrap gap-2">
                {[
                  '黑色手机壳有划痕',
                  '棕色皮质钱包带拉链',
                  '红色折叠雨伞手柄磨损',
                  '银色钥匙串有小熊挂件',
                  '蓝色笔记本写有张三',
                ].map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setDescription(ex)}
                    className="px-3 py-1.5 rounded-full text-xs bg-white border border-orange-200 text-gray-600 hover:border-[#FFA726] hover:bg-orange-50 transition-all"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <SearchX className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无匹配结果</h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  没有找到与描述匹配的物品，尝试修改描述关键词或发布失物信息。
                </p>
                <button
                  onClick={handleBack}
                  className="mt-6 px-6 py-2 rounded-xl text-sm font-semibold text-white bg-[#FFA726] hover:bg-orange-500 transition-colors shadow-md"
                >
                  重新描述
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pb-2">
                {results.map((result, i) => (
                  <ItemCard
                    key={result.item.id}
                    item={result.item}
                    index={i}
                    matchScore={result.score}
                    isHighMatch={result.isHighMatch}
                    onClaimed={() => {
                      onClaimed();
                      const idx = results.findIndex(r => r.item.id === result.item.id);
                      if (idx >= 0) {
                        const newResults = [...results];
                        newResults[idx] = { ...newResults[idx], item: { ...newResults[idx].item, isClaimed: true } };
                        setResults(newResults);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {results === null && (
          <div className="px-6 py-4 border-t border-orange-100 bg-white/60">
            <button
              onClick={handleSearch}
              disabled={isSearching || !description.trim()}
              className={cn(
                'w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200',
                'bg-gradient-to-r from-[#FFA726] to-amber-500 shadow-lg shadow-orange-200/50',
                'hover:shadow-xl hover:brightness-105 active:scale-[0.98]',
                'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100'
              )}
            >
              <Search className={cn('w-5 h-5', isSearching && 'animate-spin')} />
              {isSearching ? '智能匹配中...' : '开始匹配'}
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              支持 Ctrl+Enter 快捷提交
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
