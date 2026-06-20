import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { openDB, seedRecipesIfEmpty } from './data';

async function bootstrap() {
  try {
    await openDB();
    await seedRecipesIfEmpty();
  } catch (err) {
    console.error('Failed to initialize IndexedDB:', err);
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
