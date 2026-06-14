import { useState } from 'react';
import { GripVertical, X, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { Step } from '../types';

interface DraggableStepListProps {
  steps: Step[];
  onChange: (steps: Step[]) => void;
}

export function DraggableStepList({ steps, onChange }: DraggableStepListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    if (e.dataTransfer.setDragImage) {
      const target = e.target as HTMLElement;
      e.dataTransfer.setDragImage(target, 20, 20);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newSteps = [...steps];
    const [draggedItem] = newSteps.splice(draggedIndex, 1);
    newSteps.splice(dropIndex, 0, draggedItem);

    const reorderedSteps = newSteps.map((step, idx) => ({
      ...step,
      order: idx + 1,
    }));

    onChange(reorderedSteps);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const addStep = () => {
    const newStep: Step = {
      id: uuidv4(),
      description: '',
      order: steps.length + 1,
    };
    onChange([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    const newSteps = steps
      .filter((_, i) => i !== index)
      .map((step, idx) => ({ ...step, order: idx + 1 }));
    onChange(newSteps);
  };

  const updateStep = (index: number, description: string) => {
    const newSteps = [...steps];
    newSteps[index].description = description;
    onChange(newSteps);
  };

  return (
    <div className="space-y-3">
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li
            key={step.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className="flex items-start gap-3 p-4 bg-white rounded-xl border-2 transition-all duration-200"
            style={{
              borderColor: dragOverIndex === index ? '#e67e22' : 'rgba(0, 0, 0, 0.06)',
              opacity: draggedIndex === index ? 0.3 : 1,
              transform: dragOverIndex === index ? 'scale(1.02)' : 'scale(1)',
              boxShadow: dragOverIndex === index ? '0 8px 24px rgba(230, 126, 34, 0.2)' : draggedIndex === index ? '0 4px 16px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
              cursor: 'grab',
            }}
            onMouseDown={(e) => {
              (e.currentTarget.style.cursor as string) = 'grabbing';
            }}
            onMouseUp={(e) => {
              (e.currentTarget.style.cursor as string) = 'grab';
            }}
          >
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm mt-0.5"
            >
              {step.order}
            </div>
            <div className="flex-1">
              <textarea
                value={step.description}
                onChange={(e) => updateStep(index, e.target.value)}
                placeholder="输入步骤描述..."
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 resize-none min-h-[60px]"
                style={{ borderRadius: '10px' }}
              />
            </div>
            <div className="flex items-center gap-1">
              <div
                className="p-2 text-gray-400 hover:text-gray-600 cursor-grab"
                onMouseDown={(e) => {
                  (e.currentTarget.style.cursor as string) = 'grabbing';
                }}
              >
                <GripVertical size={20} />
              </div>
              {steps.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={addStep}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
        style={{ borderRadius: '10px' }}
      >
        <Plus size={20} />
        添加步骤
      </button>
    </div>
  );
}
