import { useMemo } from 'react';
import { useStore } from './store';
import { generateYearEvents } from './mockData';
import Timeline from './components/Timeline';
import Gallery from './components/Gallery';
import DetailPanel from './components/DetailPanel';
import YearReview from './components/YearReview';

export default function App() {
  const yearData = useMemo(() => generateYearEvents(), []);
  const monthEventCounts = useMemo(() => yearData.map((m) => m.events.length), [yearData]);

  return (
    <>
      <Timeline monthEventCounts={monthEventCounts} />
      <Gallery yearData={yearData} />
      <DetailPanel />
      <YearReview yearData={yearData} />
    </>
  );
}
