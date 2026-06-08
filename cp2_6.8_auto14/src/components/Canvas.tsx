import React from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import ModuleCard, { type CanvasModule } from './ModuleCard';
import type { ModuleStyle } from '../data/moduleDefs';
import { moduleDefs } from '../data/moduleDefs';
import { v4 as uuidv4 } from 'uuid';
import type { Theme } from '../styles/themes';

interface CanvasProps {
  modules: CanvasModule[];
  onModulesChange: (modules: CanvasModule[]) => void;
  theme: Theme;
}

function DroppableCanvas({ children, theme }: { children: React.ReactNode; theme: Theme }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
  });

  return (
    <div
      ref={setNodeRef}
      className="canvas"
      style={{
        backgroundColor: theme.canvasBg,
        outline: isOver ? `2px dashed ${theme.accent}` : 'none',
        outlineOffset: '-8px',
      }}
    >
      {children}
    </div>
  );
}

const Canvas: React.FC<CanvasProps> = ({ modules, onModulesChange, theme }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getModuleDefByType = (type: string) => {
    return moduleDefs.find((m) => m.type === type);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeData = active.data.current;
    if (activeData?.type === 'sidebar-item') {
      return;
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeData = active.data.current;

    if (activeData?.type === 'sidebar-item') {
      const moduleType = activeData.moduleType as string;
      const def = getModuleDefByType(moduleType);
      if (def) {
        if (modules.length >= 20) {
          return;
        }
        const newModule: CanvasModule = {
          id: uuidv4(),
          type: moduleType,
          style: { ...def.defaultStyle } as ModuleStyle,
        };
        onModulesChange([...modules, newModule]);
      }
      return;
    }

    if (active.id !== over?.id) {
      const oldIndex = modules.findIndex((m) => m.id === active.id);
      const newIndex = modules.findIndex((m) => m.id === over?.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onModulesChange(arrayMove(modules, oldIndex, newIndex));
      }
    }
  };

  const handleDelete = (id: string) => {
    onModulesChange(modules.filter((m) => m.id !== id));
  };

  const handleEdit = (id: string, style: ModuleStyle) => {
    onModulesChange(
      modules.map((m) => (m.id === id ? { ...m, style } : m))
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <DroppableCanvas theme={theme}>
        {modules.length === 0 ? (
          <div className="canvas-empty" style={{ color: theme.moduleText }}>
            <span className="canvas-empty-icon">📝</span>
            <span>从左侧拖拽模块到这里开始搭建你的博客首页</span>
          </div>
        ) : (
          <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            <div className="sortable-container">
              {modules.map((mod) => (
                <ModuleCard
                  key={mod.id}
                  module={mod}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  theme={theme}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </DroppableCanvas>
    </DndContext>
  );
};

export default Canvas;
