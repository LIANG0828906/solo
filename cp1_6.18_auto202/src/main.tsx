import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import GardenGrid from './GardenGrid';
import './styles/global.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element with id "root"');
}

createRoot(rootElement).render(
  <StrictMode>
    <GardenGrid />
  </StrictMode>
);
