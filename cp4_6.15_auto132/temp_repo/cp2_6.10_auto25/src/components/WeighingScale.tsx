import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { calculateGrams, formatDosageDisplay } from '../utils/conversion';
import type { Medicine, PrescriptionItem } from '../types';

const WeighingScale: React.FC = () => {
  const {
    currentWeighingMedicine,
    currentDosage,
    setCurrentDosage,
    setCurrentWeighingMedicine,
    addPrescriptionItem,
    decoctionState,
  } = useStore();

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [localDosage, setLocalDosage] = useState({
    liang: 0,
    qian: 0,
    fen: 0,
    li: 0,
  });

  useEffect(() => {
    setLocalDosage(currentDosage);
  }, [currentDosage]);

  const grams = calculateGrams(
    localDosage.liang,
    localDosage.qian,
    localDosage.fen,
    localDosage.li
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    try {
      const medicineData = e.dataTransfer.getData('medicine');
      if (medicineData) {
        const medicine: Medicine = JSON.parse(medicineData);
        setCurrentWeighingMedicine(medicine);
      }
    } catch (err) {
      console.error('拖拽数据解析失败', err);
    }
  };

  const handleDosageChange = (field: keyof typeof localDosage, value: number) => {
    const newValue = Math.max(0, Math.min(9, value));
    const newDosage = { ...localDosage, [field]: newValue };
    setLocalDosage(newDosage);
    setCurrentDosage(newDosage);
  };

  const handleAddToPrescription = () => {
    if (!currentWeighingMedicine) return;
    if (grams <= 0) return;

    const item: PrescriptionItem = {
      id: `${currentWeighingMedicine.id}-${Date.now()}`,
      medicine: currentWeighingMedicine,
      dosage: {
        ...localDosage,
        grams,
      },
      hasConflict: false,
    };

    addPrescriptionItem(item);
    setLocalDosage({ liang: 0, qian: 0, fen: 0, li: 0 });
  };

  const isDisabled = !currentWeighingMedicine || grams <= 0 || decoctionState.isDecocting;

  return (
    <div className="flex flex-col items-center">
      <h2 className="brush-font text-2xl text-[#5d3a1a] mb-4">铜秤</h2>

      <div
        className={`relative transition-all duration-300 ${
          currentWeighingMedicine ? 'scale-swing' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="relative">
          <div className="w-48 h-2 bg-gradient-to-r from-[#d4a574] via-[#b87333] to-[#8b5a2b] rounded-full mx-auto relative">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div
                key={i}
                className="absolute top-0 w-0.5 bg-[#5d3a1a]"
                style={{
                  left: `${i * 10}%`,
                  height: i % 5 === 0 ? '12px' : '6px',
                  transform: 'translateY(-50%)',
                }}
              />
            ))}
          </div>

          <div
            className={`absolute top-1/2 -translate-y-1/2 w-16 h-16 copper-plate rounded-full flex items-center justify-center transition-all ${
              isDraggingOver ? 'scale-110 ring-4 ring-[#b22222] ring-opacity-50' : ''
            }`}
            style={{ left: '-20px' }}
          >
            {currentWeighingMedicine ? (
              <div
                className="w-10 h-10 rounded-full border-2 border-[#d4a574]"
                style={{ backgroundColor: currentWeighingMedicine.color }}
              />
            ) : (
              <span className="text-[#5d3a1a] text-xs text-center opacity-50">
                拖拽药材
              </span>
            )}
          </div>

          <div
            className="stone-weight absolute top-1/2 -translate-y-1/2 w-8 h-10 rounded-lg"
            style={{ right: '10px' }}
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#8b5a2b] rounded-full"></div>
          </div>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1 h-8 bg-[#5d3a1a]"></div>
        </div>
      </div>

      {currentWeighingMedicine && (
        <div className="paper-texture rounded-lg p-4 mt-6 w-full max-w-sm">
          <div className="text-center mb-4">
            <span className="brush-font text-xl text-[#5d3a1a]">
              {currentWeighingMedicine.name}
            </span>
            <span className="text-sm text-[#8b5a2b] ml-2">
              [{currentWeighingMedicine.processing}]
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {(['liang', 'qian', 'fen', 'li'] as const).map((field, idx) => {
              const labels = ['两', '钱', '分', '厘'];
              return (
                <div key={field} className="flex flex-col items-center">
                  <input
                    type="number"
                    min="0"
                    max="9"
                    value={localDosage[field]}
                    onChange={(e) => handleDosageChange(field, parseInt(e.target.value) || 0)}
                    className="input-unit w-12 h-12 text-center text-xl rounded"
                    disabled={decoctionState.isDecocting}
                  />
                  <span className="text-sm text-[#8b5a2b] mt-1">{labels[idx]}</span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center border-t border-[#d4a574] pt-3">
            <div>
              <span className="text-sm text-[#8b5a2b]">换算：</span>
              <span className="brush-font text-lg text-[#b22222] ml-1">
                {grams.toFixed(3)} 克
              </span>
            </div>
            <div className="text-sm text-[#6b4e3a]">
              {formatDosageDisplay(
                localDosage.liang,
                localDosage.qian,
                localDosage.fen,
                localDosage.li
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              className="flex-1 py-2 bg-[#6b4e3a] text-white rounded hover:bg-[#5d3a1a] transition-colors"
              onClick={() => {
                setCurrentWeighingMedicine(null);
                setLocalDosage({ liang: 0, qian: 0, fen: 0, li: 0 });
              }}
              disabled={decoctionState.isDecocting}
            >
              取消
            </button>
            <button
              className="flex-1 btn-ancient py-2 rounded"
              onClick={handleAddToPrescription}
              disabled={isDisabled}
            >
              加入药方
            </button>
          </div>
        </div>
      )}

      {!currentWeighingMedicine && (
        <div className="paper-texture rounded-lg p-4 mt-6 w-full max-w-sm text-center">
          <p className="text-[#8b5a2b] text-sm">
            从药柜拖拽药材至秤盘，或点击药材抽屉选择"取出称量"
          </p>
        </div>
      )}
    </div>
  );
};

export default WeighingScale;
