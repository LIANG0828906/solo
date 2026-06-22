import { Toaster } from 'react-hot-toast';
import { RadioProvider } from './context/RadioContext';
import { RadioUI } from './components/RadioUI';

export default function App() {
  return (
    <RadioProvider>
      <RadioUI />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#1A1A1A',
            color: '#C0FFC0',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#C0FFC0',
              secondary: '#1A1A1A',
            },
          },
        }}
      />
    </RadioProvider>
  );
}
