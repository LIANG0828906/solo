import { motion, AnimatePresence } from 'framer-motion';
import type { Medicine } from '../types';

interface MedicineDrawerProps {
  medicines: Medicine[];
  isAnimating: boolean;
}

const MedicineDrawer = ({ medicines, isAnimating }: MedicineDrawerProps) => {
  const displayedMedicines = medicines.slice(0, 8);

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <AnimatePresence>
        {displayedMedicines.map((medicine, index) => (
          <motion.div
            key={medicine.id}
            className="relative w-[100px] h-[120px] wood-texture rounded-lg overflow-hidden card-shadow"
            animate={
              isAnimating
                ? {
                    y: [0, -60, 0],
                    transition: {
                      duration: 0.6,
                      delay: index * 0.3,
                      ease: 'easeInOut',
                    },
                  }
                : { y: 0 }
            }
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
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MedicineDrawer;
