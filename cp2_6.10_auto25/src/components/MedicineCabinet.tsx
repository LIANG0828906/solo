import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Medicine } from '../types';

const MedicineCabinet: React.FC = () => {
  const {
    medicines,
    activeDrawer,
    setActiveDrawer,
    currentWeighingMedicine,
    setCurrentWeighingMedicine,
  } = useStore();

  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

  const cabinetGrid = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
  ];

  const handleDragStart = (e: React.DragEvent, medicine: Medicine) => {
    e.dataTransfer.setData('medicine', JSON.stringify(medicine));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrawerClick = (index: number) => {
    const medicine = medicines[index];
    if (!medicine) return;
    
    if (activeDrawer === medicine.id) {
      setActiveDrawer(null);
      setSelectedMedicine(null);
    } else {
      setActiveDrawer(medicine.id);
      setSelectedMedicine(medicine);
    }
  };

  const handleCloseDetail = () => {
    setActiveDrawer(null);
    setSelectedMedicine(null);
  };

  const handleDragToScale = (medicine: Medicine) => {
    setCurrentWeighingMedicine(medicine);
    setActiveDrawer(null);
    setSelectedMedicine(null);
  };

  const getNatureColor = (nature: string) => {
    switch (nature) {
      case '寒': return 'text-blue-600';
      case '热': return 'text-red-600';
      case '温': return 'text-orange-600';
      case '凉': return 'text-cyan-600';
      default: return 'text-gray-600';
    }
  };

  const getFlavorColor = (flavor: string) => {
    if (flavor.includes('甘')) return 'text-yellow-700';
    if (flavor.includes('苦')) return 'text-amber-800';
    if (flavor.includes('辛')) return 'text-red-500';
    if (flavor.includes('酸')) return 'text-green-600';
    if (flavor.includes('咸')) return 'text-purple-600';
    return 'text-gray-600';
  };

  return (
    <div className="flex flex-col items-center h-full">
      <h2 className="brush-font text-2xl text-[#5d3a1a] mb-4">药柜</h2>
      
      <div className="wood-texture p-4 rounded-lg relative">
        <div className="absolute top-2 left-2 right-2 h-2 bg-gradient-to-b from-[#8b5a2b] to-[#5d3a1a] rounded"></div>
        <div className="absolute bottom-2 left-2 right-2 h-2 bg-gradient-to-t from-[#8b5a2b] to-[#5d3a1a] rounded"></div>
        
        <div className="grid grid-cols-2 gap-3 py-2">
          {cabinetGrid.map((row, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {row.map((colIndex) => {
                const medicine = medicines[rowIndex * 2 + colIndex];
                if (!medicine) return <div key={colIndex} className="w-28 h-24" />;
                
                const isActive = activeDrawer === medicine.id;
                
                return (
                  <div key={medicine.id} className="relative">
                    <motion.div
                      className="drawer-front rounded cursor-pointer relative w-28 h-24 flex flex-col items-center justify-center"
                      onClick={() => handleDrawerClick(rowIndex * 2 + colIndex)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, medicine)}
                    >
                      <div className="drawer-handle w-8 h-3 rounded-full mb-2"></div>
                      <div className="medicine-label px-3 py-1 rounded text-lg">
                        {medicine.name}
                      </div>
                      <div className="absolute bottom-1 text-xs text-[#d4c4a8] opacity-70">
                        {medicine.processing}
                      </div>
                    </motion.div>
                    
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="absolute top-full left-0 right-0 mt-1 z-50 overflow-hidden"
                        >
                          <div className="drawer-front rounded-b p-3 min-w-[200px]">
                            <div
                              className="w-16 h-16 rounded-lg mx-auto mb-2 border-2 border-[#d4a574]"
                              style={{ backgroundColor: medicine.color }}
                              title="药材断面颜色"
                            />
                            <p className="text-[#d4c4a8] text-xs text-center mb-2">
                              {medicine.nature} · {medicine.flavor}
                            </p>
                            <button
                              className="btn-ancient w-full py-1 text-sm rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDragToScale(medicine);
                              }}
                            >
                              取出称量
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedMedicine && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="paper-texture rounded-lg p-4 mt-4 w-full max-w-xs"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="brush-font text-2xl text-[#5d3a1a]">
                {selectedMedicine.name}
                <span className="text-sm ml-2 text-[#8b5a2b]">
                  [{selectedMedicine.processing}]
                </span>
              </h3>
              <button
                onClick={handleCloseDetail}
                className="text-[#8b5a2b] hover:text-[#b22222] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Info size={16} className="text-[#8b5a2b] flex-shrink-0" />
                <div
                  className="w-12 h-12 rounded border-2 border-[#d4a574] flex-shrink-0"
                  style={{ backgroundColor: selectedMedicine.color }}
                  title="药材断面颜色示意"
                />
                <span className="text-xs text-[#6b4e3a]">
                  断面 {selectedMedicine.color}
                </span>
              </div>

              <p className="text-sm text-[#5d3a1a] leading-relaxed">
                {selectedMedicine.description}
              </p>

              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-[#8b5a2b]">性味：</span>
                  <span className={getNatureColor(selectedMedicine.nature)}>
                    {selectedMedicine.nature}
                  </span>
                  <span className={getFlavorColor(selectedMedicine.flavor)}>
                    {selectedMedicine.flavor}
                  </span>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-[#8b5a2b]">归经：</span>
                <span className="text-[#5d3a1a]">{selectedMedicine.meridian}</span>
              </div>

              <button
                className="btn-ancient w-full py-2 rounded mt-2"
                onClick={() => handleDragToScale(selectedMedicine)}
              >
                取出至秤盘
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {currentWeighingMedicine && (
        <div className="paper-texture rounded-lg p-3 mt-4 w-full text-center">
          <p className="text-[#8b5a2b] text-sm">
            当前称量：<span className="brush-font text-xl text-[#b22222]">{currentWeighingMedicine.name}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default MedicineCabinet;
