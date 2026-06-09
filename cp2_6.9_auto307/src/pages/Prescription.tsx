import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { useMedicineStore } from '../store/medicineStore';
import PrescriptionPanel from '../components/PrescriptionPanel';
import MedicineDrawer from '../components/MedicineDrawer';
import type { Medicine } from '../types';

const Prescription = () => {
  const {
    medicines,
    prescriptionItems,
    isAnimating,
    completedItems,
    showBanner,
    addPrescriptionItem,
    getTotalPrice,
  } = useMedicineStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [draggedMedicine, setDraggedMedicine] = useState<Medicine | null>(null);

  const filteredMedicines = medicines.filter(
    (med) =>
      med.name.includes(searchTerm) ||
      med.traditionalName.includes(searchTerm) ||
      med.category.includes(searchTerm)
  );

  const handleDragStart = useCallback((medicine: Medicine) => {
    setDraggedMedicine(medicine);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedMedicine(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (draggedMedicine && !isAnimating) {
        addPrescriptionItem(draggedMedicine, 10);
        setDraggedMedicine(null);
      }
    },
    [draggedMedicine, isAnimating, addPrescriptionItem]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleQuickAdd = useCallback(
    (medicine: Medicine) => {
      if (!isAnimating) {
        addPrescriptionItem(medicine, 10);
      }
    },
    [isAnimating, addPrescriptionItem]
  );

  const totalPrice = getTotalPrice();

  return (
    <div className="max-w-7xl mx-auto p-6">
      {isAnimating && (
        <motion.div
          className="mb-6 bg-white/50 rounded-lg p-6 card-shadow"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-bold text-[#3e2723] mb-4 text-center traditional-font">
            正在抓药...
          </h3>
          <MedicineDrawer medicines={medicines} isAnimating={isAnimating} />
        </motion.div>
      )}

      <div className="flex gap-6 responsive-layout">
        <div className="flex-1 bg-white/50 rounded-lg p-4 card-shadow">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8d6e63]/50" />
            <input
              type="text"
              placeholder="搜索药材名称、繁体名或分类..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#f5f0e0] border border-[#c9a96e]/30 rounded-lg focus:outline-none focus:border-[#8d6e63] transition-colors"
            />
          </div>

          <div className="overflow-y-auto max-h-[500px] space-y-2 pr-2">
            {filteredMedicines.map((medicine, index) => (
              <motion.div
                key={medicine.id}
                className="flex items-center gap-4 p-3 bg-[#f5f0e0] rounded-lg border border-[#c9a96e]/20 hover:border-[#8d6e63]/50 transition-all cursor-grab active:cursor-grabbing group"
                draggable={!isAnimating}
                onDragStart={() => handleDragStart(medicine)}
                onDragEnd={handleDragEnd}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ x: 5 }}
              >
                <div className="w-12 h-12 wood-texture rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-[#3e2723] traditional-font">
                    {medicine.traditionalName.charAt(0)}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#3e2723] traditional-font">
                      {medicine.traditionalName}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-[#c9a96e]/20 rounded text-[#5d4037]">
                      {medicine.category}
                    </span>
                    {medicine.stock < 100 && (
                      <span className="text-xs px-2 py-0.5 bg-[#f44336]/20 rounded text-[#f44336]">
                        库存不足
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-[#6d4c41]">
                    <span>库存: {medicine.stock}g</span>
                    <span>单价: ¥{medicine.unitPrice}/g</span>
                  </div>
                </div>

                <button
                  onClick={() => handleQuickAdd(medicine)}
                  disabled={isAnimating || medicine.stock <= 0}
                  className="p-2 bg-[#c9a96e] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#8d6e63] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </motion.div>
            ))}

            {filteredMedicines.length === 0 && (
              <div className="text-center py-12 text-[#8d6e63]/50">
                <Search className="w-12 h-12 mx-auto mb-3" />
                <p>未找到匹配的药材</p>
              </div>
            )}
          </div>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`transition-all ${
            draggedMedicine ? 'scale-[1.02]' : ''
          }`}
        >
          <PrescriptionPanel
            items={prescriptionItems}
            totalPrice={totalPrice}
            completedItems={completedItems}
            isAnimating={isAnimating}
            showBanner={showBanner}
          />
        </div>
      </div>
    </div>
  );
};

export default Prescription;
