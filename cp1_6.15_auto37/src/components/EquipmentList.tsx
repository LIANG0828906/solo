import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  Wrench,
  Share2,
  FileText,
  Calendar,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { equipmentApi } from '../api';
import type { Equipment, EquipmentType, EquipmentStatus } from '../types';
import { cn } from '../lib/utils';

const equipmentTypeLabels: Record<EquipmentType | 'all', string> = {
  all: '全部',
  guitar: '吉他',
  bass: '贝斯',
  drums: '鼓',
  keyboard: '键盘',
  amplifier: '音响',
  other: '其他',
};

const equipmentStatusLabels: Record<EquipmentStatus, string> = {
  normal: '正常',
  repair: '维修中',
  borrowed: '已出借',
};

interface EquipmentRowProps {
  equipment: Equipment;
  onClick: () => void;
  delay: number;
  isHighlighted?: boolean;
}

function EquipmentRow({ equipment, onClick, delay, isHighlighted }: EquipmentRowProps) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'border-b border-white/5 cursor-pointer transition-all duration-200',
        'hover:bg-white/5',
        'opacity-0 animate-fade-in-up',
        isHighlighted && 'animate-flash'
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          {equipment.photo ? (
            <img
              src={equipment.photo}
              alt={equipment.name}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <FileText size={18} className="text-gray-400" />
            </div>
          )}
          <span className="font-medium text-white">{equipment.name}</span>
        </div>
      </td>
      <td className="py-4 px-4 text-gray-400">
        {equipmentTypeLabels[equipment.type]}
      </td>
      <td className="py-4 px-4 text-gray-400">{equipment.purchaseYear}</td>
      <td className="py-4 px-4">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            equipment.status === 'normal' && 'bg-green-500/20 text-green-400',
            equipment.status === 'repair' && 'bg-yellow-500/20 text-yellow-400',
            equipment.status === 'borrowed' && 'bg-red-500/20 text-red-400'
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              equipment.status === 'normal' && 'bg-green-400',
              equipment.status === 'repair' && 'bg-yellow-400',
              equipment.status === 'borrowed' && 'bg-red-400'
            )}
          />
          {equipmentStatusLabels[equipment.status]}
        </span>
      </td>
    </tr>
  );
}

interface EquipmentDetailPanelProps {
  equipment: Equipment | null;
  onClose: () => void;
}

function EquipmentDetailPanel({ equipment, onClose }: EquipmentDetailPanelProps) {
  if (!equipment) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-[#16213e] border-r border-white/10 h-full overflow-y-auto animate-slide-in-left">
        <div className="sticky top-0 bg-[#16213e] z-10 p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">设备详情</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {equipment.photo && (
            <div className="mb-6 rounded-2xl overflow-hidden">
              <img
                src={equipment.photo}
                alt={equipment.name}
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">{equipment.name}</h3>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-white/10 text-gray-300 text-sm">
                {equipmentTypeLabels[equipment.type]}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
                  equipment.status === 'normal' && 'bg-green-500/20 text-green-400',
                  equipment.status === 'repair' && 'bg-yellow-500/20 text-yellow-400',
                  equipment.status === 'borrowed' && 'bg-red-500/20 text-red-400'
                )}
              >
                {equipmentStatusLabels[equipment.status]}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">购买年份</p>
              <p className="text-lg font-semibold text-white">{equipment.purchaseYear}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">购买凭证</p>
              {equipment.purchaseReceiptUrl ? (
                <a
                  href={equipment.purchaseReceiptUrl}
                  className="text-lg font-semibold text-[#e94560] hover:underline"
                >
                  查看
                </a>
              ) : (
                <p className="text-lg font-semibold text-gray-500">无</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Wrench size={18} />
              维修记录
            </h4>
            {equipment.repairRecords.length > 0 ? (
              <div className="space-y-3">
                {equipment.repairRecords.map((record, index) => (
                  <div
                    key={index}
                    className="bg-white/5 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                      <Calendar size={14} />
                      <span>{record.date}</span>
                    </div>
                    <p className="text-white">{record.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">暂无维修记录</p>
            )}
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Share2 size={18} />
              出借记录
            </h4>
            {equipment.borrowRecords.length > 0 ? (
              <div className="space-y-3">
                {equipment.borrowRecords.map((record, index) => (
                  <div
                    key={index}
                    className="bg-white/5 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">{record.borrower}</span>
                      {record.returnDate ? (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <CheckCircle size={12} />
                          已归还
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-400 flex items-center gap-1">
                          <AlertTriangle size={12} />
                          借用中
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 flex items-center gap-2">
                      <span>{record.date}</span>
                      {record.returnDate && (
                        <>
                          <ArrowRight size={12} />
                          <span>{record.returnDate}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">暂无出借记录</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EquipmentList() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<EquipmentType | 'all'>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const filteredEquipment = useMemo(() => {
    let result = equipment;

    if (filterType !== 'all') {
      result = result.filter((e) => e.type === filterType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          equipmentTypeLabels[e.type].toLowerCase().includes(query)
      );
    }

    return result;
  }, [equipment, filterType, searchQuery]);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const data = await equipmentApi.getAll({ type: filterType, search: searchQuery });
        setEquipment(data);
      } catch (error) {
        console.error('Failed to fetch equipment:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();
  }, []);

  const handleStatusChange = async (id: string, status: EquipmentStatus) => {
    try {
      await equipmentApi.update(id, { status });
      const updated = equipment.map((e) =>
        e.id === id ? { ...e, status } : e
      );
      setEquipment(updated);
      setHighlightedId(id);
      setTimeout(() => setHighlightedId(null), 1000);
    } catch (error) {
      console.error('Failed to update equipment status:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="h-10 bg-white/5 rounded-xl mb-6 animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          乐器设备清单
        </h1>
        <p className="text-gray-400">管理乐队所有设备和器材</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="搜索设备..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#e94560]/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as EquipmentType | 'all')}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#e94560]/50 transition-colors appearance-none cursor-pointer"
          >
            {Object.entries(equipmentTypeLabels).map(([value, label]) => (
              <option key={value} value={value} className="bg-[#16213e]">
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card-glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                  设备名称
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                  类型
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                  购买年份
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                  状态
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipment.map((item, index) => (
                <EquipmentRow
                  key={item.id}
                  equipment={item}
                  onClick={() => setSelectedEquipment(item)}
                  delay={index * 30}
                  isHighlighted={highlightedId === item.id}
                />
              ))}
            </tbody>
          </table>
        </div>

        {filteredEquipment.length === 0 && (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">没有找到匹配的设备</p>
          </div>
        )}
      </div>

      <EquipmentDetailPanel
        equipment={selectedEquipment}
        onClose={() => setSelectedEquipment(null)}
      />
    </div>
  );
}
