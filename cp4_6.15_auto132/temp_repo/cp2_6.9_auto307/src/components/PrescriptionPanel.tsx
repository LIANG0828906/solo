import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Check, Scroll } from 'lucide-react';
import type { PrescriptionItem } from '../types';
import { useMedicineStore } from '../store/medicineStore';

interface PrescriptionPanelProps {
  items: PrescriptionItem[];
  totalPrice: number;
  completedItems: Set<string>;
  isAnimating: boolean;
  showBanner: boolean;
}

const PrescriptionPanel = ({
  items,
  totalPrice,
  completedItems,
  isAnimating,
  showBanner,
}: PrescriptionPanelProps) => {
  const {
    updatePrescriptionQuantity,
    removePrescriptionItem,
    submitPrescription,
    clearPrescription,
  } = useMedicineStore();

  const handleSubmit = () => {
    if (items.length === 0 || isAnimating) return;
    submitPrescription();
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {showBanner && (
          <motion.div
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-20 scroll-banner rounded-lg flex items-center justify-center z-50"
            initial={{ height: 0, opacity: 0, y: -20 }}
            animate={{ height: 80, opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <Scroll className="w-6 h-6 text-[#d4a373] mr-2" />
            <span className="text-xl font-bold text-[#f5efe0] traditional-font">
              药方已配齐
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-[400px] h-[600px] paper-texture rounded-lg card-shadow p-4 flex flex-col responsive-panel">
        <div className="text-center mb-4 pb-3 border-b-2 border-[#c9a96e]/30">
          <h2 className="text-xl font-bold text-[#3e2723] traditional-font">
            處方箋
          </h2>
          <p className="text-xs text-[#6d4c41] mt-1">
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <AnimatePresence mode="popLayout">
            {items.length === 0 ? (
              <motion.div
                className="h-full flex flex-col items-center justify-center text-[#8d6e63]/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Scroll className="w-16 h-16 mb-4" />
                <p className="text-sm">拖拽药材到此处配方</p>
              </motion.div>
            ) : (
              items.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-white/40 rounded-lg border border-[#c9a96e]/20"
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      completedItems.has(item.id)
                        ? 'bg-[#4caf50] success-pulse'
                        : 'bg-[#c9a96e]/30'
                    }`}
                  >
                    {completedItems.has(item.id) ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-xs font-bold text-[#5d4037]">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="font-bold text-[#3e2723] traditional-font">
                      {item.traditionalName}
                    </p>
                    <p className="text-xs text-[#6d4c41]">
                      ¥{item.unitPrice}/g
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updatePrescriptionQuantity(
                          item.id,
                          parseInt(e.target.value) || 0
                        )
                      }
                      disabled={isAnimating}
                      className="w-16 px-2 py-1 border border-[#c9a96e]/50 rounded text-center text-sm bg-white focus:outline-none focus:border-[#8d6e63]"
                    />
                    <span className="text-xs text-[#6d4c41]">g</span>
                  </div>

                  <button
                    onClick={() => removePrescriptionItem(item.id)}
                    disabled={isAnimating}
                    className="p-1.5 text-[#f44336] hover:bg-[#f44336]/10 rounded transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="text-right min-w-[60px]">
                    <p className="text-sm font-bold text-[#8d6e63]">
                      ¥{(item.quantity * item.unitPrice).toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 pt-4 border-t-2 border-[#c9a96e]/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#5d4037]">总计：</span>
            <motion.span
              className="text-2xl font-bold text-[#c9a96e]"
              key={totalPrice}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              ¥{totalPrice.toFixed(2)}
            </motion.span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={clearPrescription}
              disabled={items.length === 0 || isAnimating}
              className="flex-1 py-2.5 bg-[#8d6e63]/20 text-[#5d4037] rounded-lg font-medium hover:bg-[#8d6e63]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              清空
            </button>
            <button
              onClick={handleSubmit}
              disabled={items.length === 0 || isAnimating}
              className="flex-1 py-2.5 bg-[#8d6e63] text-[#f5efe0] rounded-lg font-medium hover:bg-[#5d4037] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnimating ? '抓药中...' : '抓药'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionPanel;
