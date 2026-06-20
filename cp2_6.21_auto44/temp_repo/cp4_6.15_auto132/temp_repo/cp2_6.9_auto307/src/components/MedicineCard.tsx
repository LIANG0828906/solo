import { motion } from 'framer-motion';
import type { Medicine } from '../types';

interface MedicineCardProps {
  medicine: Medicine;
}

const MedicineCard = ({ medicine }: MedicineCardProps) => {
  return (
    <motion.div
      className="relative w-[100px] h-[120px] wood-texture rounded-lg cursor-pointer overflow-hidden"
      whileHover={{ x: 15 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <div className="absolute inset-0 border-2 border-[#8d6e63]/50 rounded-lg" />
      
      <div className="absolute top-1 left-1 right-1 h-6 bg-[#5d4037]/30 rounded flex items-center justify-center">
        <div className="w-8 h-1 bg-[#3e2723]/50 rounded-full" />
      </div>

      <div className="flex flex-col items-center justify-center h-full pt-6">
        <span className="text-lg font-bold text-[#3e2723] traditional-font mb-1">
          {medicine.traditionalName}
        </span>
        <span className="text-xs text-[#5d4037]">{medicine.category}</span>
      </div>

      <motion.div
        className="absolute inset-0 bg-[#8d6e63]/95 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg"
      >
        <div className="text-[#f5efe0] text-center p-2">
          <p className="text-sm font-bold mb-2">{medicine.traditionalName}</p>
          <p className="text-xs mb-1">库存: {medicine.stock}g</p>
          <p className="text-xs">单价: ¥{medicine.unitPrice}/g</p>
          {medicine.stock < 100 && (
            <span className="inline-block mt-2 px-2 py-0.5 bg-[#f44336] rounded text-[10px] text-white">
              库存不足
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MedicineCard;
