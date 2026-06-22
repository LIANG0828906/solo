import { useState, createContext, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ActivityModule from './modules/activity/ActivityModule';
import AttendanceModule from './modules/attendance/AttendanceModule';
import Layout from './components/Layout';
import type { ActivityContextType, AttendanceRecord } from './types';

export const ActivityContext = createContext<ActivityContextType>({
  currentActivityId: null,
  setCurrentActivityId: () => {},
  checkInStatus: 'idle',
  setCheckInStatus: () => {},
  lastCheckedIn: null,
  setLastCheckedIn: () => {},
});

function App() {
  const [currentActivityId, setCurrentActivityId] = useState<string | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastCheckedIn, setLastCheckedIn] = useState<AttendanceRecord | null>(null);

  const contextValue = useMemo(
    () => ({
      currentActivityId,
      setCurrentActivityId,
      checkInStatus,
      setCheckInStatus,
      lastCheckedIn,
      setLastCheckedIn,
    }),
    [currentActivityId, checkInStatus, lastCheckedIn]
  );

  return (
    <ActivityContext.Provider value={contextValue}>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/activity" replace />} />
          <Route path="/activity/*" element={<ActivityModule />} />
          <Route path="/attendance/*" element={<AttendanceModule />} />
        </Routes>
      </Layout>
    </ActivityContext.Provider>
  );
}

export default App;
