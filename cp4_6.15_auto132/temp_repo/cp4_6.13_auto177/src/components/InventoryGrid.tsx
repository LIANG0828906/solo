import { useDrop, useDrag } from 'react-dnd';
import { Inventory, RESOURCE_METAS, ResourceType } from '../types';

interface InventoryGridProps {
  inventory: Inventory;
  onDrop: (slotIndex: number, resource: ResourceType) => void;
  onSwap: (fromIdx: number, toIdx: number) => void;
}

interface InventorySlotProps {
  slot: { id: number; resource: ResourceType | null; count: number };
  onDrop: (slotIndex: number, resource: ResourceType) => void;
  onSwap: (fromIdx: number, toIdx: number) => void;
}

function InventorySlot({ slot, onDrop, onSwap }: InventorySlotProps) {
  const meta = slot.resource ? RESOURCE_METAS[slot.resource] : null;

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'INVENTORY_SLOT',
      item: { sourceType: 'inventory', slotId: slot.id, resource: slot.resource },
      canDrag: slot.resource !== null && slot.count > 0,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [slot.id, slot.resource, slot.count]
  );

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ['DEPOT_RESOURCE', 'INVENTORY_SLOT'],
      drop: (item: { sourceType: string; resource?: ResourceType; slotId?: number }) => {
        if (item.sourceType === 'depot' && item.resource) {
          onDrop(slot.id, item.resource);
        } else if (item.sourceType === 'inventory' && item.slotId !== undefined) {
          if (item.slotId !== slot.id) {
            onSwap(item.slotId, slot.id);
          }
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [slot.id, onDrop, onSwap]
  );

  const slotClasses = [
    'inventory-slot',
    isOver && canDrop ? 'drag-over' : '',
    isDragging ? 'dragging' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={slotClasses}
    >
      {meta && slot.count > 0 && (
        <>
          <div
            className="resource-icon"
            style={{ backgroundColor: meta.color }}
          />
          <span className="resource-count">{slot.count}</span>
        </>
      )}
    </div>
  );
}

export default function InventoryGrid({ inventory, onDrop, onSwap }: InventoryGridProps) {
  return (
    <div className="inventory-section">
      <div className="section-title">背包 (6×2)</div>
      <div className="inventory-grid">
        {inventory.map((slot) => (
          <InventorySlot
            key={slot.id}
            slot={slot}
            onDrop={onDrop}
            onSwap={onSwap}
          />
        ))}
      </div>
    </div>
  );
}
