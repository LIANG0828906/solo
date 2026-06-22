import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MenuProvider } from './context/MenuContext';
import { OrderProvider } from './context/OrderContext';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MenuProvider>
      <OrderProvider>
        <App />
      </OrderProvider>
    </MenuProvider>
  </React.StrictMode>
);
