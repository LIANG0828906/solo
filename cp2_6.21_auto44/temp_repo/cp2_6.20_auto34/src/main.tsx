import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useMixerStore } from './stores/mixerStore';

export const eventBus = {
  on: (event: string, callback: (data?: unknown) => void) => {
    window.addEventListener(event, (e) => callback((e as CustomEvent).detail));
  },
  off: (event: string, callback: (data?: unknown) => void) => {
    window.removeEventListener(event, callback);
  },
  emit: (event: string, data?: unknown) => {
    window.dispatchEvent(new CustomEvent(event, { detail: data }));
  },
};

const initAudioOnUserInteraction = async () => {
  const { initMasterBus } = useMixerStore.getState();
  await initMasterBus();
  document.removeEventListener('click', initAudioOnUserInteraction);
  document.removeEventListener('keydown', initAudioOnUserInteraction);
  document.removeEventListener('touchstart', initAudioOnUserInteraction);
};

document.addEventListener('click', initAudioOnUserInteraction);
document.addEventListener('keydown', initAudioOnUserInteraction);
document.addEventListener('touchstart', initAudioOnUserInteraction);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
