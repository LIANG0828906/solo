import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BroadcastSync } from '@/utils/BroadcastSync';

const broadcastSync = new BroadcastSync();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App broadcastSync={broadcastSync} />
  </React.StrictMode>
);
