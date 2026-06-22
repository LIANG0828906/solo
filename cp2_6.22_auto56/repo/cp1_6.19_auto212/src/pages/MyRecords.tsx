import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CheckCircle, Clock, Filter } from 'lucide-react';
import CategoryIcon from '@/components/CategoryIcon';
import StatusBadge from '@/components/StatusBadge';
import Empty from '@/components/Empty';
import { useStore } from '@/store';
import type { Item, ItemStatus } from '@/types';
import { COLOR_PALETTE } from '@/types';

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
}

const typeLabels: Record<Item['type'], { text: string; bg: string; color: string }> = {
  lost: { text: '失物', bg: '#E3F2FD', color: '#1976D2' },
  found: { text: '拾物', bg: '#FFF3E0', color: '#E65100' },
};

function ItemCard({ item, onMarkComplete }: { item: Item; onMarkComplete: (id: string) => void }) {
  const typeConfig = typeLabels[item.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl p-5"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <CategoryIcon category={item.category} size={24} />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold" style={{ color: 'var(--text)' }}>
                {item.name}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: typeConfig.bg, color: typeConfig.color }}
              >
                {typeConfig.text}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <MapPin size={14} />
              {item.location}
            </div>
          </div>
        </div>
        <StatusBadge status={item.status} />
      </div>

      {item.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {item.colors.map((color) => (
            <span
              key={color}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: COLOR_PALETTE[color],
                color:
                  COLOR_PALETTE[color] === '#FFFFFF' || COLOR_PALETTE[color] === '#FFD54F'
                    ? '#333'
                    : '#fff',
                border: COLOR_PALETTE[color] === '#FFFFFF' ? '1px solid #E0E0E0' : 'none',
              }}
            >
              {color}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            <Clock size={12} className="inline mr-1" />
            {formatDate(item.createdAt)}
          </span>
          {item.status === 'matched' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onMarkComplete(item.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: '#81C784' }}
            >
              <CheckCircle size={14} />
              确认完成
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

type FilterType = 'all' | 'lost' | 'found';
type FilterStatus = 'all' | ItemStatus;

export default function MyRecords() {
  const getCurrentUserItems = useStore((state) => state.getCurrentUserItems);
  const markItemCompleted = useStore((state) => state.markItemCompleted);

  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  const items = getCurrentUserItems();

  const filteredItems = items
    .filter((item) => typeFilter === 'all' || item.type === typeFilter)
    .filter((item) => statusFilter === 'all' || item.status === statusFilter)
    .sort((a, b) => b.createdAt - a.createdAt);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'lost', label: '失物' },
    { key: 'found', label: '拾物' },
  ];

  const statusFilters: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: '全部状态' },
    { key: 'pending', label: '待匹配' },
    { key: 'matched', label: '已匹配' },
    { key: 'completed', label: '已完成' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
          我的记录
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          您登记的失物与拾物记录，共 {items.length} 条
        </p>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={16} className="text-gray-400" />
          {filters.map((f) => (
            <motion.button
              key={f.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTypeFilter(f.key)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: typeFilter === f.key ? 'var(--primary)' : '#fff',
                color: typeFilter === f.key ? '#fff' : 'var(--text)',
                border: `1px solid ${typeFilter === f.key ? 'var(--primary)' : 'var(--border)'}`,
              }}
            >
              {f.label}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {statusFilters.map((f) => (
            <motion.button
              key={f.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStatusFilter(f.key)}
              className="px-3 py-1.5 rounded-lg text-sm transition-all"
              style={{
                backgroundColor: statusFilter === f.key ? '#F5F5F5' : 'transparent',
                color: 'var(--text)',
                border: `1px solid ${statusFilter === f.key ? '#BDBDBD' : 'transparent'}`,
              }}
            >
              {f.label}
            </motion.button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <Empty />
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} onMarkComplete={markItemCompleted} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
