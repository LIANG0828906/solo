import { createRoot } from 'react-dom/client';
import GameUI from './gameUI';

const container = document.getElementById('root');
if (!container) {
  throw new Error('找不到根元素 #root');
}

createRoot(container).render(<GameUI />);
