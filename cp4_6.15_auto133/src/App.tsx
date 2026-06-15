import { useEffect } from 'react';
import DashboardLayout from './modules/DashboardLayout';
import { injectGlobalStyles } from './modules/BarChartCard';

export default function App() {
  useEffect(() => {
    injectGlobalStyles();
  }, []);

  return <DashboardLayout />;
}
