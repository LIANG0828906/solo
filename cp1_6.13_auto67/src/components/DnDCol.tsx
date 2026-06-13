import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, DragUpdate } from 'react-beautiful-dnd';
import { Exhibit, Booth } from '../types';

interface DnDColProps {
  exhibits: Exhibit[];
  booths: Booth[];
  onAssign: (boothId: string, exhibitIds: string[]) => void;
  onHighlightBooth: (boothId: string) => void;
  onRemoveExhibit: (boothId: string, exhibitId: string) => void;
  renderExhibitCard: (exhibit: Exhibit, index: number, isDragging: boolean) => React.ReactNode;
  onEditExhibit: (exhibit: Exhibit) => void;
  onDeleteExhibit: (id: string) => void;
}

const MAX_EXHIBITS_PER_BOOTH = 4;

const DnDCol: React.FC<DnDColProps> = ({
  exhibits,
  booths,
  onAssign,
  onHighlightBooth,
  onRemoveExhibit,
  renderExhibitCard,
  onEditExhibit,
  onDeleteExhibit,
}) => {
  const [dragOverBooth, setDragOverBooth] = useState<string | null>(null);

  const getExhibitById = useCallback(
    (id: string) => exhibits.find((e) => e.id === id),
    [exhibits]
  );

  const handleDragEnd = (result: DropResult) => {
    setDragOverBooth(null);
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId === destination.droppableId) return;

    const draggedExhibitId = result.draggableId;
    const destinationBoothId = destination.droppableId.replace('booth-', '');

    if (source.droppableId === 'unassigned-exhibits' && destinationBoothId) {
      const targetBooth = booths.find((b) => b.id === destinationBoothId);
      if (!targetBooth) return;
      if (targetBooth.exhibitIds.length >= MAX_EXHIBITS_PER_BOOTH) return;
      if (targetBooth.exhibitIds.includes(draggedExhibitId)) return;
      const newExhibitIds = [...targetBooth.exhibitIds, draggedExhibitId];
      onAssign(destinationBoothId, newExhibitIds);
      onHighlightBooth(destinationBoothId);
    }

    if (source.droppableId.startsWith('booth-') && destination.droppableId.startsWith('booth-')) {
      const sourceBoothId = source.droppableId.replace('booth-', '');
      const destBoothId = destination.droppableId.replace('booth-', '');
      if (sourceBoothId === destBoothId) return;

      const destBooth = booths.find((b) => b.id === destBoothId);
      if (!destBooth) return;
      if (destBooth.exhibitIds.length >= MAX_EXHIBITS_PER_BOOTH) return;

      const sourceBooth = booths.find((b) => b.id === sourceBoothId);
      const newSourceExhibitIds = sourceBooth?.exhibitIds.filter((id) => id !== draggedExhibitId) || [];
      const newDestExhibitIds = [...destBooth.exhibitIds, draggedExhibitId];
      onAssign(sourceBoothId, newSourceExhibitIds);
      onAssign(destBoothId, newDestExhibitIds);
      onHighlightBooth(destBoothId);
    }

    if (source.droppableId.startsWith('booth-') && destination.droppableId === 'unassigned-exhibits') {
      const sourceBoothId = source.droppableId.replace('booth-', '');
      const sourceBooth = booths.find((b) => b.id === sourceBoothId);
      if (!sourceBooth) return;
      const newExhibitIds = sourceBooth.exhibitIds.filter((id) => id !== draggedExhibitId);
      onAssign(sourceBoothId, newExhibitIds);
    }
  };

  const handleDragOver = (result: DragUpdate) => {
    if (result.destination?.droppableId?.startsWith('booth-')) {
      setDragOverBooth(result.destination.droppableId.replace('booth-', ''));
    } else {
      setDragOverBooth(null);
    }
  };

  const unassignedExhibits = exhibits.filter((e) => !e.boothId);

  return (
    <DragDropContext onDragEnd={handleDragEnd} onDragUpdate={handleDragOver}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <div className="admin-sidebar">
          <div className="admin-sidebar-header">
            <div className="admin-sidebar-title">展品库 ({unassignedExhibits.length})</div>
          </div>
          <Droppable droppableId="unassigned-exhibits">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="exhibit-list"
                style={{
                  backgroundColor: snapshot.isDraggingOver ? 'rgba(99, 102, 241, 0.05)' : undefined,
                }}
              >
                {unassignedExhibits.map((exhibit, index) => (
                  <Draggable key={exhibit.id} draggableId={exhibit.id} index={index}>
                    {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        ...provided.draggableProps.style,
                        opacity: snapshot.isDragging ? 0.6 : 1,
                      }}
                    >
                      {renderExhibitCard(exhibit, index, snapshot.isDragging)}
                      {!snapshot.isDragging && (
                        <div
                          style={{
                            display: 'flex',
                            gap: '4px',
                            padding: '0 12px 12px',
                            marginTop: '-8px',
                          }}
                        >
                          <button
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            onClick={() => onEditExhibit(exhibit)}
                          >
                            编辑
                          </button>
                          <button
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => onDeleteExhibit(exhibit.id)}
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {unassignedExhibits.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      color: '#6b7280',
                      padding: '40px 20px',
                      fontSize: '13px',
                    }}
                  >
                    暂无未分配展品
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </div>

        <div className="admin-main">
          <div className="admin-header">
            <h1>ExpoFlow · 展位布局</h1>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>
              从左侧拖拽展品到展位 · 每个展位最多4个展品
            </div>
          </div>
          <div className="admin-canvas">
            <div className="booth-grid">
              {booths.map((booth) => (
                <Droppable key={booth.id} droppableId={`booth-${booth.id}`}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`booth-card ${snapshot.isDraggingOver ? 'drag-over' : ''} ${dragOverBooth === booth.id ? 'drag-over' : ''}`}
                    >
                      <div className="booth-header">
                        <div className="booth-number">{booth.number}</div>
                        <div className="booth-title">
                          <div className="booth-name">{booth.name}</div>
                          <div className="booth-count">
                            {booth.exhibitIds.length} / {MAX_EXHIBITS_PER_BOOTH} 件展品
                          </div>
                        </div>
                      </div>
                      {booth.exhibitIds.length > 0 ? (
                        <div className="booth-exhibits">
                          {booth.exhibitIds.map((eid) => {
                            const ex = getExhibitById(eid);
                            if (!ex) return null;
                            return (
                              <Draggable key={eid} draggableId={eid} index={0}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="booth-exhibit-mini"
                                  >
                                    <img src={ex.imageUrl} alt={ex.name} loading="lazy" />
                                    <div className="mini-name">{ex.name}</div>
                                    <button
                                      className="remove-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveExhibit(booth.id, ex.id);
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      ) : (
                        <div className="booth-empty">拖拽展品到此处</div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
};

export default DnDCol;
