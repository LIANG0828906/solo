import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import App from './App';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#FFF5EE',
      100: '#F7E7CE',
      200: '#E2C9AD',
      300: '#D4A373',
      400: '#C48855',
      500: '#A66B3A',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'linear-gradient(180deg, #FFF5EE 0%, #F5E6D3 100%)',
        minH: '100vh',
        color: '#4A3728',
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>
);
