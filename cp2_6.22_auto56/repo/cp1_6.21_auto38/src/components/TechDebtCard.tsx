import { Reorder, motion } from 'framer-motion';
import { Trash2, Check } from 'lucide-react';
import { TechDebtItem, SeverityLevel, ItemStatus } from '@/types';

const severityColors: Record<SeverityLevel, string> = {
  critical: '#E53935',
  high: '#FB8C00',
  medium: '#FDD835',
  low: '#C0CA33',
};

const severityLabels: Record<SeverityLevel, string> = {
  critical: '严重',
  high: '高',
  medium: '中',
  low: '低',
};

interface TechDebtCardProps {
  item: TechDebtItem;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ItemStatus) => void;
}

export default function TechDebtCard({ item, onDelete, onStatusChange }: TechDebtCardProps) {
  const isCompleted = item.status === 'completed';

  const handleStatusClick = () => {
    const statusCycle: ItemStatus[] = ['todo', 'in-progress', 'completed'];
    const currentIndex = statusCycle.indexOf(item.status);
    const nextIndex = (currentIndex + 1) % statusCycle.length;
    onStatusChange(item.id, statusCycle[nextIndex]);
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  return (
    <Reorder.Item
      value={item}
      as="div"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileDrag={{
        scale: 1.05,
        boxShadow: '0 8px 25px rgba(189, 189, 189, 0.3)',
        transition: { duration: 0.2 },
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
        duration: 0.3,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      style={{
        backgroundColor: '#2D2D2D',
        borderRadius: '12px',
        cursor: 'grab',
        overflow: 'hidden',
        position: 'relative',
        willChange: 'transform',
      }}
      className="group"
    >
      <div
        className="absolute top-0 left-0 w-1.5 h-full"
        style={{ backgroundColor: severityColors[item.severity] }}
      />

      {isCompleted && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 left-3 z-10 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#4CAF50' }}
        >
          <Check size={14} className="text-white" />
        </motion.div>
      )}

      <div className="p-4 pl-6">
        <div className="flex justify-between items-start mb-2">
          <h3
            className={`font-semibold text-[#E0E0E0] ${
              isCompleted ? 'line-through opacity-60' : ''
            }`}
            style={{ fontSize: '15px' }}
          >
            {truncateText(item.title, 30)}
          </h3>
          <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: severityColors[item.severity] + '20',
                color: severityColors[item.severity],
              }}
            >
              {severityLabels[item.severity]}
            </span>
        </div>

        <p
          className={`text-sm text-[#9E9E9E] mb-3 line-clamp-2 ${
            isCompleted ? 'line-through opacity-60' : ''
          }`}
          style={{ fontSize: '13px' }}
        >
          {truncateText(item.description, 60)}
        </p>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-1 rounded-md bg-[#1E1E1E] text-[#9E9E9E]">
            ⏱️ {item.estimatedHours}h
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStatusClick}
            className="text-xs px-2 py-1 rounded-md bg-[#1E1E1E] text-[#9E9E9E] hover:text-[#E0E0E0] transition-colors"
          >
            {item.status === 'todo'
              ? '待处理'
              : item.status === 'in-progress'
              ? '进行中'
              : '已完成'}
          </motion.button>
        </div>

        {item.codeReferences.length > 0 && (
          <div className="pt-3 border-t border-[#3D3D3D]">
            {item.codeReferences.map((ref, index) => (
              <div key={index} className="text-xs text-[#9E9E9E] font-mono">
                📁 {truncateText(ref.filePath, 25)}
                {ref.lineNumber && `:${ref.lineNumber}`}
              </div>
            ))}
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.1, color: '#E53935' }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[#3D3D3D]"
          style={{ color: '#9E9E9E' }}
        >
          <Trash2 size={16} />
        </motion.button>
      </div>
    </Reorder.Item>
  );
}
