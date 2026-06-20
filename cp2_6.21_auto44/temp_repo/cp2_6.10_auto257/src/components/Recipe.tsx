import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Shield, Users, Compass, Trash2, Check, X } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { api } from '../services/api';
import type { Herb, RecipeSlot } from '../types';

const SLOT_CONFIG: Record<keyof RecipeSlot, { label: string; icon: typeof Crown; description: string; color: string }> = {
  monarch: { label: '君', icon: Crown, description: '主病之谓君', color: '#c0392b' },
  minister: { label: '臣', icon: Shield, description: '佐君之谓臣', color: '#d4a351' },
  assistant: { label: '佐', icon: Users, description: '应臣之谓佐', color: '#7a9e7a' },
  guide: { label: '使', icon: Compass, description: '引经之谓使', color: '#2d5a3d' },
};

interface CollectedHerbProps {
  herb: Herb;
  onDragStart: (herb: Herb) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

function CollectedHerb({ herb, onDragStart, onDragEnd, isDragging }: CollectedHerbProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('recipeHerbId', herb.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(herb);
  };

  return (
    <motion.div
      layout
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      whileHover={{ y: -2 }}
      className={`herb-card p-2 cursor-grab ${isDragging ? 'dragging' : ''}`}
      style={{ borderColor: herb.color + '60' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{herb.image}</span>
        <div>
          <p className="font-kai text-sm" style={{ color: herb.color }}>{herb.name}</p>
          <p className="text-xs text-ink/50">{herb.nature}</p>
        </div>
      </div>
    </motion.div>
  );
}

interface RecipeSlotProps {
  slotKey: keyof RecipeSlot;
  herb: Herb | null;
  onDrop: (herbId: string) => void;
  onRemove: () => void;
}

function RecipeSlotComponent({ slotKey, herb, onDrop, onRemove }: RecipeSlotProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const config = SLOT_CONFIG[slotKey];
  const Icon = config.icon;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const herbId = e.dataTransfer.getData('recipeHerbId');
    if (herbId) {
      onDrop(herbId);
    }
  };

  return (
    <motion.div
      layout
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bamboo-slip p-3 min-h-24 relative ${
        isDragOver ? 'ring-2 ring-pine bg-pine/10' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: config.color }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <span className="font-kai text-xl" style={{ color: config.color }}>{config.label}</span>
          <p className="text-xs text-ink/50">{config.description}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {herb ? (
          <motion.div
            key={herb.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center justify-between p-2 bg-paper rounded border border-earth/30"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{herb.image}</span>
              <div>
                <p className="font-kai text-sm" style={{ color: herb.color }}>{herb.name}</p>
                <p className="text-xs text-ink/50">{herb.effect.slice(0, 8)}...</p>
              </div>
            </div>
            <button
              onClick={onRemove}
              className="p-1 hover:bg-vermilion/20 rounded text-vermilion transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-12 flex items-center justify-center border-2 border-dashed border-earth/30 rounded"
          >
            <span className="text-ink/40 text-sm">拖拽药材至此</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function Recipe() {
  const { 
    collectedHerbs, 
    recipeSlots, 
    addToRecipe, 
    removeFromRecipe, 
    clearRecipe,
    completeRecipe,
    setFeedback 
  } = useGameStore();
  const [draggingHerb, setDraggingHerb] = useState<Herb | null>(null);
  const [submitResult, setSubmitResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleDropToSlot = (slot: keyof RecipeSlot, herbId: string) => {
    const herb = collectedHerbs.find(h => h.id === herbId);
    if (herb) {
      addToRecipe(slot, herb);
    }
  };

  const handleSubmit = async () => {
    const recipe = {
      id: `recipe-${Date.now()}`,
      name: '自定义方剂',
      monarch: recipeSlots.monarch ? [recipeSlots.monarch.id] : [],
      minister: recipeSlots.minister ? [recipeSlots.minister.id] : [],
      assistant: recipeSlots.assistant ? [recipeSlots.assistant.id] : [],
      guide: recipeSlots.guide ? [recipeSlots.guide.id] : [],
      effect: '辨证施治',
    };

    const result = await api.submitRecipe(recipe);
    setSubmitResult({ type: result.valid ? 'success' : 'error', message: result.message });
    setFeedback(result.valid ? 'success' : 'error', result.message, null);

    if (result.valid) {
      completeRecipe();
    }

    setTimeout(() => setSubmitResult(null), 2000);
  };

  const isComplete = recipeSlots.monarch && recipeSlots.minister;

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="scroll-panel p-4 h-full flex flex-col"
    >
      <div className="text-center mb-4 pb-3 border-b-2 border-earth/30">
        <h2 className="font-kai text-xl text-ink mb-1">方剂调制</h2>
        <p className="text-earth text-xs">君臣佐使，配伍有方</p>
      </div>

      <div className="mb-4">
        <h3 className="font-kai text-sm text-ink/70 mb-2">已采集药材</h3>
        {collectedHerbs.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {collectedHerbs.map(herb => (
              <CollectedHerb
                key={herb.id}
                herb={herb}
                onDragStart={setDraggingHerb}
                onDragEnd={() => setDraggingHerb(null)}
                isDragging={draggingHerb?.id === herb.id}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-ink/50 text-sm bg-ink/5 rounded">
            尚未采集药材，请先完成辨认任务
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <h3 className="font-kai text-sm text-ink/70 mb-2">配伍槽位</h3>
        <div className="space-y-2">
          {(Object.keys(SLOT_CONFIG) as Array<keyof RecipeSlot>).map(slotKey => (
            <RecipeSlotComponent
              key={slotKey}
              slotKey={slotKey}
              herb={recipeSlots[slotKey]}
              onDrop={(herbId) => handleDropToSlot(slotKey, herbId)}
              onRemove={() => removeFromRecipe(slotKey)}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {submitResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mt-3 p-3 rounded-lg text-center text-sm ${
              submitResult.type === 'success'
                ? 'bg-pine/20 text-pine border border-pine/30'
                : 'bg-vermilion/20 text-vermilion border border-vermilion/30'
            }`}
          >
            {submitResult.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex gap-2">
        <button
          onClick={clearRecipe}
          className="flex-1 py-2 px-3 border border-earth/40 rounded text-ink/70 hover:bg-earth/10 transition-colors flex items-center justify-center gap-1 text-sm"
        >
          <Trash2 className="w-4 h-4" />
          清空
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isComplete}
          className={`flex-1 py-2 px-3 rounded transition-all flex items-center justify-center gap-1 text-sm ${
            isComplete
              ? 'btn-ancient'
              : 'bg-ink/10 text-ink/40 cursor-not-allowed'
          }`}
        >
          <Check className="w-4 h-4" />
          成方
        </button>
      </div>

      <div className="mt-3 p-2 bg-ink/5 rounded text-xs text-ink/60">
        <p>💡 提示：君药、臣药为必填</p>
      </div>
    </motion.div>
  );
}
