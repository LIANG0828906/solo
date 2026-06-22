import { useDrag } from 'react-dnd';
import { RESOURCE_METAS, ResourceType } from '../types';

interface ResourceDepotProps {
  depotResources: Record<ResourceType, number>;
}

interface DepotItemProps {
  resource: ResourceType;
  remaining: number;
}

function DepotItem({ resource, remaining }: DepotItemProps) {
  const meta = RESOURCE_METAS[resource];
  const isEmpty = remaining <= 0;

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'DEPOT_RESOURCE',
      item: () => {
        if (isEmpty) return null;
        return { sourceType: 'depot', resource };
      },
      canDrag: !isEmpty,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [resource, isEmpty]
  );

  return (
    <div
      ref={drag}
      className={`depot-item ${isEmpty ? 'empty' : ''}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div
        className="depot-item-icon"
        style={{ backgroundColor: meta.color }}
      />
      <div className="depot-item-info">
        <span className="depot-item-name">{meta.name}</span>
        <span className="depot-item-count">剩余: {remaining}</span>
      </div>
    </div>
  );
}

export default function ResourceDepot({ depotResources }: ResourceDepotProps) {
  const resources = Object.keys(RESOURCE_METAS) as ResourceType[];

  return (
    <div className="resource-depot">
      <div className="section-title">资源仓库</div>
      <div className="depot-list">
        {resources.map((r) => (
          <DepotItem
            key={r}
            resource={r}
            remaining={depotResources[r] ?? 0}
          />
        ))}
      </div>
      <div className="depot-hint">拖拽资源到背包</div>
    </div>
  );
}
