import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './ui/App';
import { RoomStateProvider } from './domain/roomState';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RoomStateProvider>
      <App />
    </RoomStateProvider>
  </React.StrictMode>
);
