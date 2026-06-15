import { useState, useMemo, useEffect } from 'react';
import { Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Activity } from '@/types';
import {
  getFactor,
  ACTIVITY_TYPE_LABELS,
} from '@/constants/emissionFactors';
import { formatNumber } from '@/utils/calculations';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ActivityListProps {
  activities: Activity[];
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
  filterType?: string;
  filterSubtype?: string;
  compact?: boolean;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 20;

const ActivityList = ({
  activities,
  onEdit,
  onDelete,
  filterType,
  filterSubtype,
  compact = false,
  pageSize = DEFAULT_PAGE_SIZE,
}: ActivityListProps) => {
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);

  useEffect(() => {
    setPage(1);
  }, [filterType, filterSubtype]);

  const filtered = useMemo(() => {
    const result = activities.filter((a) => {
      if (filterType && a.type !== filterType) return false;
      if (filterSubtype && a.subtype !== filterSubtype) return false;
      return true;
    });
    result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return result;
  }, [activities, filterType, filterSubtype]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(pageStart, pageStart + pageSize);

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget);
      setDeleteTarget(null);
    }
  };

  if (filtered.length === 0) {
    return (
      <div className="card p-8 sm:p-12 text-center">
        <div className="text-5xl mb-4 opacity-40">🌱</div>
        <h4 className="text-lg font-semibold text-gray-700 mb-2">
          暂无活动记录
        </h4>
        <p className="text-sm text-gray-500">
          开始记录您的日常活动，追踪您的碳足迹吧！
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="card overflow-hidden">
        {!compact && (
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-800">活动记录列表</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                共 {filtered.length} 条记录
              </p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 text-gray-600">
              <tr>
                <th className="px-4 sm:px-5 py-3 text-left font-medium w-1" />
                <th className="px-3 sm:px-4 py-3 text-left font-medium">
                  活动
                </th>
                <th className="px-3 sm:px-4 py-3 text-left font-medium hidden sm:table-cell">
                  日期
                </th>
                <th className="px-3 sm:px-4 py-3 text-right font-medium">
                  数量
                </th>
                <th className="px-3 sm:px-4 py-3 text-right font-medium">
                  碳排放
                </th>
                <th className="px-3 sm:px-4 py-3 text-center font-medium w-[110px]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((act, idx) => {
                const factor = getFactor(act.type, act.subtype);
                const dateStr = parseISO(act.date);
                const globalIdx = pageStart + idx;
                const rowBg = globalIdx % 2 === 0 ? 'bg-white' : 'bg-primary-50/35';
                return (
                  <tr
                    key={act.id}
                    className={`${rowBg} border-t border-gray-50 hover:bg-primary-50/50 transition-colors`}
                  >
                    <td className="pl-4 sm:pl-5 py-3.5">
                      <div
                        className="w-1.5 h-10 rounded-full"
                        style={{ backgroundColor: factor?.color || '#666' }}
                      />
                    </td>
                    <td className="px-3 sm:px-4 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: `${factor?.color}15` }}
                        >
                          {factor?.icon || '📊'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-800 truncate">
                            {factor?.label || act.subtype}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {ACTIVITY_TYPE_LABELS[act.type]}
                            <span className="sm:hidden ml-2">
                              · {format(dateStr, 'MM-dd')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3.5 text-gray-600 hidden sm:table-cell whitespace-nowrap">
                      {format(dateStr, 'yyyy年MM月dd日', { locale: zhCN })}
                    </td>
                    <td className="px-3 sm:px-4 py-3.5 text-right tabular-nums">
                      <span className="font-medium text-gray-700">
                        {formatNumber(act.value, 1)}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">
                        {factor?.unit || ''}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3.5 text-right tabular-nums">
                      <span
                        className="font-bold"
                        style={{ color: factor?.color || '#666' }}
                      >
                        {formatNumber(act.emission, 2)}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">kg</span>
                    </td>
                    <td className="px-3 sm:px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEdit(act)}
                          className="p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          aria-label="编辑"
                          title="编辑"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(act)}
                          className="p-2 rounded-lg text-gray-500 hover:text-danger-500 hover:bg-danger-50 transition-colors"
                          aria-label="删除"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500">
              第 {currentPage} / {totalPages} 页
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm font-medium text-gray-700 tabular-nums">
                {currentPage}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-danger-50 flex items-center justify-center">
                <Trash2 className="w-7 h-7 text-danger-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                确认删除记录
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                您确定要删除这条
                <span className="font-medium text-danger-500 mx-1">
                  {getFactor(deleteTarget.type, deleteTarget.subtype)?.label}
                </span>
                活动记录吗？
                <br />
                此操作不可撤销。
              </p>
            </div>
            <div className="px-6 pb-6 flex items-center gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 btn-danger"
                autoFocus
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ActivityList;
