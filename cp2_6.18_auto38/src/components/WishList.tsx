import React, { memo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Wish, useWishStore } from '../store';
import { WishCard } from './WishCard';

interface WishListProps {
  wishes: Wish[];
  enableDrag?: boolean;
  emptyText?: string;
}

function WishListComponent({ wishes, enableDrag = true, emptyText = '暂无愿望清单' }: WishListProps) {
  const { reorderWishes, deleteWish } = useWishStore();

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    reorderWishes(result.source.index, result.destination.index);
  };

  if (wishes.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          color: '#95a5a6'
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎁</div>
        <p style={{ fontSize: 16, margin: 0 }}>{emptyText}</p>
      </div>
    );
  }

  const listContent = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 280px)',
        gap: 24,
        justifyContent: 'center',
        padding: 8
      }}
      className="wish-grid"
    >
      {wishes.map((wish, index) => (
        <Draggable key={wish.id} draggableId={wish.id} index={index} isDragDisabled={!enableDrag}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={{
                ...provided.draggableProps.style,
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <WishCard
                wish={wish}
                isDragging={snapshot.isDragging}
                onDelete={wish.isOwn ? () => deleteWish(wish.id) : undefined}
              />
            </div>
          )}
        </Draggable>
      ))}
    </div>
  );

  if (!enableDrag) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 280px)',
          gap: 24,
          justifyContent: 'center',
          padding: 8
        }}
        className="wish-grid"
      >
        {wishes.map((wish) => (
          <div key={wish.id} style={{ display: 'flex', justifyContent: 'center' }}>
            <WishCard
              wish={wish}
              onDelete={wish.isOwn ? () => deleteWish(wish.id) : undefined}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="wish-list" direction="vertical">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {listContent}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export const WishList = memo(WishListComponent);
