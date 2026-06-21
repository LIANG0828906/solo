import React from 'react';
import { UploadPanel } from '@/components/UploadPanel';
import { TranscriptPanel } from '@/components/TranscriptPanel';
import styles from './App.module.css';

const App: React.FC = () => {
  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <div className={styles.leftPanel}>
          <UploadPanel />
        </div>
        <div className={styles.rightPanel}>
          <TranscriptPanel />
        </div>
      </div>
    </div>
  );
};

export default App;
