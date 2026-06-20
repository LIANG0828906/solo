import { AnimatePresence, motion } from 'framer-motion';
import substitutionRules from '../server/substitutionRules';

interface Ingredient {
  id: string;
  name: string;
  amount: string;
}

interface SubstitutionPanelProps {
  ingredientName: string;
  currentIngredients: Ingredient[];
  onSelect: (originalName: string, replacement: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const SubstitutionPanel: React.FC<SubstitutionPanelProps> = ({
  ingredientName,
  onSelect,
  onClose,
  isOpen,
}) => {
  const findSubstitutes = (name: string): string[] => {
    if (substitutionRules[name]) {
      return substitutionRules[name].slice(0, 3);
    }
    for (const key of Object.keys(substitutionRules)) {
      if (key.includes(name) || name.includes(key)) {
        return substitutionRules[key].slice(0, 3);
      }
    }
    return [];
  };

  const substitutes = findSubstitutes(ingredientName);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-end justify-center z-50 pointer-events-none">
            <motion.div
              className="w-full max-w-[600px] bg-white rounded-t-2xl pointer-events-auto"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
              <div className="px-6 py-4">
                <h2 className="text-xl font-bold mb-2">
                  🔄 替换「{ingredientName}」
                </h2>
                <p className="text-gray-600 text-sm mb-6">
                  以下是常见替代食材，点击选择即可替换：
                </p>
                {substitutes.length > 0 ? (
                  <div className="space-y-3 mb-6">
                    {substitutes.map((sub, index) => (
                      <motion.button
                        key={index}
                        className="w-full p-4 bg-white rounded-xl shadow-md border border-gray-100 flex items-center justify-between text-left hover:shadow-lg"
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => {
                          onSelect(ingredientName, sub);
                          onClose();
                        }}
                      >
                        <span className="text-base font-medium">{sub}</span>
                        <span className="text-sm text-blue-500 font-medium">
                          → 用这个替换
                        </span>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-xl p-6 mb-6">
                    <p className="text-gray-500 text-center">
                      暂无替换建议，可以尝试其他食材~
                    </p>
                  </div>
                )}
                <button
                  className="w-full py-3 bg-white border border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors mb-6"
                  onClick={onClose}
                >
                  取消
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SubstitutionPanel;
