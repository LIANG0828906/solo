import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Filter, Calendar, ChevronDown, Trash2, Undo2 } from 'lucide-react';
import VirtualList from '@/components/VirtualList';
import Skeleton from '@/components/Skeleton';
import { cn } from '@/lib/utils';
import { Transaction as SharedTransaction, Category as SharedCategory } from '@/types';

type Category = 'all' | SharedCategory;

interface Transaction extends SharedTransaction {
  icon: string;
  description: string;
}

const categories: { value: Category; label: string }[] = [
  { value: 'all', label: '全部分类' },
  { value: '餐饮', label: '餐饮' },
  { value: '交通', label: '交通' },
  { value: '购物', label: '购物' },
  { value: '娱乐', label: '娱乐' },
  { value: '医疗', label: '医疗' },
  { value: '教育', label: '教育' },
  { value: '其他', label: '其他' },
];

const categoryIcons: Record<SharedCategory, string> = {
  '餐饮': '🍔',
  '交通': '🚗',
  '购物': '🛍️',
  '娱乐': '🎮',
  '医疗': '💊',
  '教育': '📚',
  '其他': '📦',
};

const paymentMethods: SharedTransaction['paymentMethod'][] = ['现金', '微信', '支付宝', '银行卡', '信用卡'];

const generateMockTransactions = (): Transaction[] => {
  const cats: SharedCategory[] = ['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '其他'];
  const descs: Record<SharedCategory, string[]> = {
    '餐饮': ['午餐', '晚餐', '早餐', '下午茶', '外卖', '火锅', '烧烤', '奶茶'],
    '交通': ['地铁', '打车', '加油', '公交', '停车费', '高铁', '机票', '共享单车'],
    '购物': ['日用品', '衣服', '电子产品', '零食', '家居', '化妆品', '书籍', '运动装备'],
    '娱乐': ['电影', '游戏', '健身房', 'KTV', '演唱会', '旅游', '酒吧', '游乐场'],
    '医疗': ['药品', '挂号', '体检', '牙医', '保健品', '眼科', '中医', '疫苗'],
    '教育': ['书籍', '课程', '培训', '文具', '会员', '考试费', '资料', '讲座'],
    '其他': ['礼物', '捐赠', '水电费', '网费', '话费', '房租', '维修', '保险'],
  };

  const transactions: Transaction[] = [];
  const now = new Date();

  for (let i = 0; i < 1000; i++) {
    const cat = cats[Math.floor(Math.random() * cats.length)];
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 180));
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

    transactions.push({
      id: `tx-${i}`,
      category: cat,
      amount: Math.round((Math.random() * 500 + 5) * 100) / 100,
      description: descs[cat][Math.floor(Math.random() * descs[cat].length)],
      date: date.toISOString(),
      icon: categoryIcons[cat],
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
    });
  }

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  if (diff < 7) return `${diff}天前`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [pendingDeletions, setPendingDeletions] = useState<Set<string>>(new Set());
  const deletionTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const pullStartY = useRef<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const data = generateMockTransactions();
      setTransactions(data);
      setFilteredTransactions(data);
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      deletionTimers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    let result = transactions.filter((t) => !pendingDeletions.has(t.id));

    if (selectedCategory !== 'all') {
      result = result.filter((t) => t.category === selectedCategory);
    }

    if (dateRange.start) {
      const start = new Date(dateRange.start).getTime();
      result = result.filter((t) => new Date(t.date).getTime() >= start);
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end).getTime() + 24 * 60 * 60 * 1000;
      result = result.filter((t) => new Date(t.date).getTime() <= end);
    }

    setFilteredTransactions(result);
  }, [selectedCategory, dateRange, transactions, pendingDeletions]);

  const handleDelete = useCallback((id: string) => {
    setPendingDeletions((prev) => new Set(prev).add(id));

    const timer = setTimeout(() => {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setPendingDeletions((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      deletionTimers.current.delete(id);
    }, 3000);

    deletionTimers.current.set(id, timer);
  }, []);

  const handleUndo = useCallback((id: string) => {
    const timer = deletionTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      deletionTimers.current.delete(id);
    }
    setPendingDeletions((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    deletionTimers.current.forEach((timer) => clearTimeout(timer));
    deletionTimers.current.clear();
    setPendingDeletions(new Set());
    setTimeout(() => {
      const data = generateMockTransactions();
      setTransactions(data);
      setRefreshing(false);
    }, 1000);
  };

  const handlePullStart = (clientY: number) => {
    if (containerRef.current?.scrollTop === 0) {
      pullStartY.current = clientY;
    }
  };

  const handlePullMove = (clientY: number) => {
    if (pullStartY.current !== null) {
      const diff = clientY - pullStartY.current;
      if (diff > 0) {
        setPullDistance(Math.min(diff * 0.5, 100));
      }
    }
  };

  const handlePullEnd = () => {
    if (pullDistance > 60) {
      handleRefresh();
    }
    setPullDistance(0);
    pullStartY.current = null;
  };

  const totalCount = filteredTransactions.length;
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  const renderItem = useCallback(
    (tx: Transaction, index: number) => {
      const isPendingDeletion = pendingDeletions.has(tx.id);

      return (
        <div
          className={cn(
            'group h-full flex items-center gap-4 px-6 py-3 border-b border-gray-100 dark:border-navy-400/20 last:border-0 hover:bg-mint-50/50 dark:hover:bg-navy-400/20 transition-colors active:scale-[0.98] duration-150',
            isPendingDeletion && 'animate-slide-out'
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-navy-400/30 dark:to-navy-400/50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shrink-0">
            {tx.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-navy-500 dark:text-white truncate">
              {tx.description}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 dark:bg-navy-400/30 mr-2 text-xs">
                {tx.category}
              </span>
              {formatDate(tx.date)}
            </p>
          </div>
          <div className="text-right flex items-center gap-2 shrink-0">
            <p className="text-lg font-bold text-red-500">
              -¥{tx.amount.toFixed(2)}
            </p>
            {isPendingDeletion ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUndo(tx.id);
                }}
                className="opacity-100 p-2 rounded-lg bg-mint-500 text-white hover:bg-mint-600 transition-colors shadow-md"
                title="撤销删除"
              >
                <Undo2 size={16} />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(tx.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/20 text-red-500 hover:text-red-600 transition-all"
                title="删除"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      );
    },
    [pendingDeletions, handleDelete, handleUndo]
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 h-screen overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-navy-500 dark:to-navy-600"
      onMouseDown={(e) => handlePullStart(e.clientY)}
      onMouseMove={(e) => handlePullMove(e.clientY)}
      onMouseUp={handlePullEnd}
      onMouseLeave={handlePullEnd}
      onTouchStart={(e) => handlePullStart(e.touches[0].clientY)}
      onTouchMove={(e) => handlePullMove(e.touches[0].clientY)}
      onTouchEnd={handlePullEnd}
    >
      <div
        className={cn(
          'flex items-center justify-center transition-all duration-200 overflow-hidden',
          pullDistance > 0 ? 'opacity-100' : 'opacity-0 h-0'
        )}
        style={{ height: pullDistance }}
      >
        <RefreshCw
          className={cn(
            'text-mint-500 transition-transform duration-300',
            refreshing && 'animate-spin',
            pullDistance > 60 && 'rotate-180'
          )}
          size={24}
        />
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-300">
          {refreshing ? '刷新中...' : pullDistance > 60 ? '释放刷新' : '下拉刷新'}
        </span>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-navy-500 dark:text-white mb-6">交易仪表盘</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {loading ? (
            <>
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </>
          ) : (
            <>
              <div className="bg-white/70 dark:bg-navy-400/30 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 dark:border-navy-400/20 hover:scale-[1.02] transition-transform duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">总交易笔数</p>
                    <p className="text-3xl font-bold text-navy-500 dark:text-white">{totalCount}</p>
                    <p className="text-xs text-mint-600 dark:text-mint-300 mt-1">笔交易记录</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center shadow-lg shadow-mint-500/30">
                    <span className="text-white text-2xl">📊</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 dark:bg-navy-400/30 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 dark:border-navy-400/20 hover:scale-[1.02] transition-transform duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">总支出金额</p>
                    <p className="text-3xl font-bold text-navy-500 dark:text-white">
                      ¥{totalAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">累计消费</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-navy-400 to-navy-600 flex items-center justify-center shadow-lg shadow-navy-500/30">
                    <span className="text-white text-2xl">💰</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="bg-white/70 dark:bg-navy-400/30 backdrop-blur-xl rounded-2xl p-4 mb-6 shadow-lg border border-white/50 dark:border-navy-400/20">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Filter size={16} className="text-gray-500 dark:text-gray-300" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">分类筛选</span>
              </div>
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-500/50 border border-gray-200 dark:border-navy-400/30 text-left hover:border-mint-400 dark:hover:border-mint-400/50 transition-colors"
              >
                <span className="text-navy-500 dark:text-white font-medium">
                  {categories.find((c) => c.value === selectedCategory)?.label}
                </span>
                <ChevronDown
                  size={18}
                  className={cn(
                    'text-gray-500 transition-transform',
                    showCategoryDropdown && 'rotate-180'
                  )}
                />
              </button>
              {showCategoryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-navy-500 rounded-xl shadow-xl border border-gray-200 dark:border-navy-400/30 z-20 overflow-hidden animate-scale-in">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => {
                        setSelectedCategory(cat.value);
                        setShowCategoryDropdown(false);
                      }}
                      className={cn(
                        'w-full px-4 py-3 text-left transition-colors',
                        selectedCategory === cat.value
                          ? 'bg-mint-50 dark:bg-mint-500/20 text-mint-600 dark:text-mint-300'
                          : 'text-navy-500 dark:text-white hover:bg-gray-50 dark:hover:bg-navy-400/30'
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-gray-500 dark:text-gray-300" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">日期范围</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-500/50 border border-gray-200 dark:border-navy-400/30 text-navy-500 dark:text-white focus:border-mint-400 dark:focus:border-mint-400/50 outline-none transition-colors"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-500/50 border border-gray-200 dark:border-navy-400/30 text-navy-500 dark:text-white focus:border-mint-400 dark:focus:border-mint-400/50 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-mint-500 to-mint-600 text-white font-medium shadow-lg shadow-mint-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RefreshCw size={18} className={cn(refreshing && 'animate-spin')} />
                刷新
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-navy-400/30 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 dark:border-navy-400/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-navy-400/30">
            <h2 className="font-semibold text-navy-500 dark:text-white">交易记录</h2>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                  <Skeleton variant="circular" width={48} height={48} />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 dark:text-gray-300">暂无交易记录</p>
            </div>
          ) : (
            <VirtualList
              items={filteredTransactions}
              itemHeight={80}
              height={500}
              overscan={8}
              className="h-[500px]"
              renderItem={renderItem}
            />
          )}
        </div>
      </div>
    </div>
  );
}
