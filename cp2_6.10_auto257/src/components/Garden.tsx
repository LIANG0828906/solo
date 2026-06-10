import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { api } from '../services/api';
import type { Herb } from '../types';

interface HerbCardProps {
  herb: Herb;
  onDragStart: (herb: Herb) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  feedbackType: 'success' | 'error' | null;
}

function HerbCard({ herb, onDragStart, onDragEnd, isDragging, feedbackType }: HerbCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('herbId', herb.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(herb);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: isDragging ? 1.05 : 1,
        y: isDragging ? -8 : 0,
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`herb-card p-4 relative ${isDragging ? 'dragging z-50' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      style={{ borderColor: herb.color + '60' }}
    >
      <div 
        className="text-5xl text-center mb-2"
        style={{ filter: `drop-shadow(0 2px 4px ${herb.color}40)` }}
      >
        {herb.image}
      </div>
      <div className="text-center">
        <h3 className="font-kai text-xl text-ink" style={{ color: herb.color }}>
          {herb.name}
        </h3>
        <p className="text-xs text-ink/50">{herb.pinyin}</p>
        <div className="mt-2 flex justify-center gap-1 flex-wrap">
          <span 
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: herb.color + '20', color: herb.color }}
          >
            {herb.nature}
          </span>
          {herb.meridian.map(m => (
            <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-ink/10 text-ink/70">
              {m}经
            </span>
          ))}
        </div>
      </div>

      {feedbackType && (
        <div className={`ink-splash ${feedbackType}`} />
      )}

      {feedbackType === 'success' && (
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: -12 }}
          className="absolute top-2 right-2 seal text-sm"
        >
          妙
        </motion.div>
      )}

      {feedbackType === 'error' && (
        <motion.div
          animate={{ x: [-4, 4, -2, 2, 0] }}
          transition={{ duration: 0.4 }}
          className="absolute top-2 right-2 seal text-sm"
          style={{ animation: 'none' }}
        >
          误
        </motion.div>
      )}
    </motion.div>
  );
}

export function Garden() {
  const { availableHerbs, currentTask, submitHerb, feedback, correctCount, setEvent } = useGameStore();
  const [draggingHerb, setDraggingHerb] = useState<Herb | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const herbId = e.dataTransfer.getData('herbId');
    if (!herbId || !currentTask) return;

    const result = await api.submitHerb(currentTask.id, herbId);
    submitHerb(herbId, result.correct, result.message);

    const newCorrectCount = result.correct ? correctCount + 1 : correctCount;
    const eventResult = await api.getEvent(newCorrectCount);
    if (eventResult.event) {
      setTimeout(() => setEvent(eventResult.event!), 1000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex flex-col h-full"
    >
      <div className="text-center mb-4">
        <h2 className="font-kai text-3xl text-ink mb-1">药圃</h2>
        <p className="text-earth text-sm">百草园中寻良药，慧眼识真辨性味</p>
      </div>

      <div className="drop-zone mb-6 p-6 text-center" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        <motion.div
          animate={isDragOver ? { scale: 1.02 } : { scale: 1 }}
          className={`border-2 border-dashed rounded-lg p-8 ${
            isDragOver ? 'border-pine bg-pine/10' : 'border-earth/40'
          }`}
        >
          <div className="text-4xl mb-2">📜</div>
          <p className="font-kai text-lg text-ink/70">
            {isDragOver ? '松开鼠标，放入医案' : '拖拽草药至此，辨认入药'}
          </p>
          <p className="text-xs text-ink/50 mt-1">
            医案 · 随证治之
          </p>
        </motion.div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {availableHerbs.map((herb, index) => (
            <motion.div
              key={herb.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <HerbCard
                herb={herb}
                onDragStart={setDraggingHerb}
                onDragEnd={() => setDraggingHerb(null)}
                isDragging={draggingHerb?.id === herb.id}
                feedbackType={feedback.herbId === herb.id ? feedback.type : null}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {feedback.message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`mt-4 p-4 rounded-lg text-center font-kai text-lg ${
            feedback.type === 'success' 
              ? 'bg-pine/20 text-pine border border-pine/30' 
              : 'bg-vermilion/20 text-vermilion border border-vermilion/30'
          }`}
        >
          {feedback.message}
        </motion.div>
      )}
    </motion.div>
  );
}
