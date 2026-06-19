import { motion } from 'framer-motion';
import { Pickaxe } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import styles from './ToolBar.module.css';
import { cn } from '@/lib/utils';

const MAX_SLOTS = 10;

export default function ToolBar() {
  const { seedInventory, selectedSeedIndex, selectSeed } = useGameStore();

  const handleSlotClick = (index: number) => {
    if (seedInventory[index]?.count && seedInventory[index]!.count > 0) {
      selectSeed(selectedSeedIndex === index ? null : index);
    }
  };

  const renderSlots = () => {
    const slots = [];
    for (let i = 0; i < MAX_SLOTS; i++) {
      const seed = seedInventory[i];
      const isSelected = selectedSeedIndex === i;
      const hasSeed = seed && seed.count > 0;

      slots.push(
        <motion.div
          key={i}
          className={cn(
            styles.slot,
            isSelected && styles.selected,
            !hasSeed && styles.disabled
          )}
          onClick={() => handleSlotClick(i)}
          whileHover={hasSeed ? { scale: 1.05 } : {}}
          whileTap={hasSeed ? { scale: 0.95 } : {}}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {isSelected && (
            <motion.div
              className={styles.selectionGlow}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              style={{
                boxShadow: '0 0 12px 2px rgba(255, 215, 0, 0.6)',
              }}
            />
          )}

          <div className={styles.slotIcon}>
            {seed ? (
              <motion.div
                className={styles.seedIcon}
                style={{ backgroundColor: seed.color }}
                initial={isSelected ? { rotate: -10, scale: 0.8 } : {}}
                animate={isSelected ? { rotate: 0, scale: 1 } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              />
            ) : selectedSeedIndex === null ? (
              <Pickaxe className={styles.hoeIcon} size="100%" />
            ) : (
              <div className={styles.emptySlot} />
            )}
          </div>

          <span className={styles.slotCount}>
            {seed ? seed.count : 0}
          </span>
        </motion.div>
      );
    }
    return slots;
  };

  return (
    <div className={styles.toolbarContainer}>
      <h3 className={styles.toolbarTitle}>种子背包</h3>
      <div className={styles.slotContainer}>{renderSlots()}</div>
    </div>
  );
}
