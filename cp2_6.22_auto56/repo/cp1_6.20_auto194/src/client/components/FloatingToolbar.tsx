import { ShoppingCart, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FloatingToolbarProps {
  selectedCount: number;
  onClear: () => void;
}

export const FloatingToolbar = ({ selectedCount, onClear }: FloatingToolbarProps) => {
  const navigate = useNavigate();

  if (selectedCount === 0) return null;

  const handleGenerate = () => {
    navigate('/shopping-list');
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 fade-in">
      <div className="card p-4 flex items-center gap-4" style={{ backgroundColor: 'var(--primary)' }}>
        <div className="relative">
          <ShoppingCart size={24} style={{ color: 'var(--text)' }} />
          <span
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {selectedCount}
          </span>
        </div>
        <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
          已选 {selectedCount} 个食谱
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-secondary text-sm"
            onClick={handleGenerate}
            style={{ padding: '6px 12px', minHeight: '36px', minWidth: 'auto' }}
          >
            生成清单
          </button>
          <button
            className="btn p-2"
            onClick={onClear}
            style={{ backgroundColor: 'rgba(0,0,0,0.1)', minHeight: '36px', minWidth: '36px' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
