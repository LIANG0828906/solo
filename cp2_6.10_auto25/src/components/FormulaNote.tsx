import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { checkCompatibility } from '../services/api';
import { formatDosageDisplay, calculateTotalGrams } from '../utils/conversion';

const FormulaNote: React.FC = () => {
  const {
    prescriptionItems,
    removePrescriptionItem,
    updatePrescriptionItemConflicts,
    isShaking,
    setIsShaking,
    decoctionState,
  } = useStore();

  useEffect(() => {
    if (prescriptionItems.length < 2) {
      updatePrescriptionItemConflicts([]);
      return;
    }

    const medicineIds = prescriptionItems.map(item => item.medicine.id);
    
    const checkConflicts = async () => {
      try {
        const result = await checkCompatibility(medicineIds);
        if (result.conflicts.length > 0) {
          updatePrescriptionItemConflicts(result.conflicts);
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 400);
        } else {
          updatePrescriptionItemConflicts([]);
        }
      } catch (err) {
        console.error('配伍禁忌检测失败', err);
      }
    };

    checkConflicts();
  }, [prescriptionItems, updatePrescriptionItemConflicts, setIsShaking]);

  const totalGrams = calculateTotalGrams(prescriptionItems);

  const getRoleLabel = (index: number): string => {
    if (index === 0) return '君';
    if (index === 1) return '臣';
    if (index >= 2 && index < prescriptionItems.length - 1) return '佐';
    return '使';
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case '君': return 'text-[#b22222]';
      case '臣': return 'text-[#8b4513]';
      case '佐': return 'text-[#5d3a1a]';
      case '使': return 'text-[#6b4e3a]';
      default: return 'text-[#5d3a1a]';
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="brush-font text-2xl text-[#5d3a1a] mb-4">药方笺</h2>

      <motion.div
        className={`paper-texture rounded-lg p-4 w-full max-w-md min-h-[400px] relative ${
          isShaking ? 'shake-x' : ''
        }`}
        animate={isShaking ? { x: [-5, 5, -5, 5, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center mb-4 border-b-2 border-dashed border-[#d4a574] pb-3">
          <h3 className="brush-font text-3xl text-[#5d3a1a]">太医院药方</h3>
          <p className="text-xs text-[#8b5a2b] mt-1">
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {prescriptionItems.length === 0 ? (
          <div className="text-center py-12 text-[#8b5a2b] opacity-60">
            <p className="brush-font text-xl">药材未备</p>
            <p className="text-sm mt-2">从药柜取出药材并称量后加入药方</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin pr-2">
            {prescriptionItems.map((item, index) => {
              const role = getRoleLabel(index);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`relative flex items-center justify-between p-2 rounded ${
                    item.hasConflict ? 'bg-red-100 bg-opacity-30' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className={`text-xs font-bold ${getRoleColor(role)}`}>
                      [{role}]
                    </span>
                    <div
                      className="w-6 h-6 rounded border border-[#d4a574]"
                      style={{ backgroundColor: item.medicine.color }}
                    />
                    <span className="brush-font text-lg text-[#5d3a1a]">
                      {item.medicine.name}
                    </span>
                    <span className="text-xs text-[#8b5a2b]">
                      [{item.medicine.processing}]
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[#6b4e3a]">
                      {formatDosageDisplay(
                        item.dosage.liang,
                        item.dosage.qian,
                        item.dosage.fen,
                        item.dosage.li
                      )}
                    </span>
                    <span className="text-sm text-[#b22222]">
                      {item.dosage.grams.toFixed(2)}g
                    </span>

                    <AnimatePresence>
                      {item.hasConflict && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="relative"
                        >
                          <span className="text-[#cc0000] text-2xl font-bold conflict-mark">
                            ×
                          </span>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-[#cc0000] text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                            相恶，忌用
                            {item.conflictInfo && (
                              <div className="text-[10px] opacity-80 mt-0.5">
                                {item.conflictInfo}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!decoctionState.isDecocting && (
                      <button
                        onClick={() => removePrescriptionItem(item.id)}
                        className="text-[#8b5a2b] hover:text-[#b22222] transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {prescriptionItems.length > 0 && (
          <div className="mt-4 pt-3 border-t-2 border-dashed border-[#d4a574]">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#8b5a2b]">共 {prescriptionItems.length} 味</span>
              <span className="brush-font text-xl text-[#b22222]">
                总计：{totalGrams.toFixed(2)} 克
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default FormulaNote;
