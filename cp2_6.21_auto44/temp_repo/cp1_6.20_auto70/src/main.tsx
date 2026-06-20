import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppContext } from './types';
import BookModule from './BookModule';
import NoteModule from './NoteModule';
import './index.css';

function App() {
  const [selectedBookId, setSelectedBookId] = React.useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const triggerRefresh = React.useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const contextValue = React.useMemo(() => ({
    selectedBookId,
    setSelectedBookId,
    refreshTrigger,
    triggerRefresh,
  }), [selectedBookId, refreshTrigger, triggerRefresh]);

  return React.createElement(
    AppContext.Provider,
    { value: contextValue },
    selectedBookId
      ? React.createElement(NoteModule)
      : React.createElement(BookModule)
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  React.createElement(React.StrictMode, null, React.createElement(App))
);
