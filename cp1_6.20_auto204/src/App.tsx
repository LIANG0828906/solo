import { useState, useCallback } from 'react';
import Dashboard from './pages/Dashboard';
import OrderDraft from './pages/OrderDraft';
import type { RestockSuggestion } from './api';

type Page = 'dashboard' | 'order-draft';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [orderItems, setOrderItems] = useState<RestockSuggestion[]>([]);

  const navigateToOrder = useCallback((items: RestockSuggestion[]) => {
    setOrderItems(items);
    setCurrentPage('order-draft');
  }, []);

  const navigateToDashboard = useCallback(() => {
    setCurrentPage('dashboard');
  }, []);

  return (
    <>
      {currentPage === 'dashboard' && <Dashboard onNavigateToOrder={navigateToOrder} />}
      {currentPage === 'order-draft' && (
        <OrderDraft
          initialItems={orderItems}
          onBack={navigateToDashboard}
        />
      )}
    </>
  );
}

export default App;
