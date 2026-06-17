import React from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { RestaurantPanel } from './components/RestaurantPanel';
import { OrderPanel } from './components/OrderPanel';
import { useLunchMateStore } from './store';
import './index.css';

const App: React.FC = () => {
  const {
    restaurants,
    addItemToOrder,
    reorderItems,
  } = useLunchMateStore();

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    if (source.droppableId === 'menu-items' && destination.droppableId === 'order-items') {
      const allMenuItems = restaurants.flatMap((r) => r.menuItems);
      const menuItem = allMenuItems.find((m) => m.id === result.draggableId);
      if (menuItem) {
        addItemToOrder(menuItem);
      }
      return;
    }

    if (source.droppableId === 'order-items' && destination.droppableId === 'order-items') {
      if (source.index !== destination.index) {
        reorderItems(source.index, destination.index);
      }
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="app-container">
        <header className="app-header">
          <h1>🍱 LunchMate</h1>
          <p className="app-subtitle">拼单凑单，优惠共享</p>
        </header>
        <div className="app-body">
          <div className="left-panel-wrapper">
            <Droppable droppableId="menu-items">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  <RestaurantPanel />
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
          <div className="divider" />
          <div className="right-panel-wrapper">
            <OrderPanel />
          </div>
        </div>
      </div>
    </DragDropContext>
  );
};

export default App;
