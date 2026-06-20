import FilterBar from '@/components/FilterBar';
import FontGrid from '@/components/FontGrid';
import PreviewPanel from '@/components/PreviewPanel';

export default function App() {
  return (
    <div className="app">
      <FilterBar />
      <div className="app__main">
        <FontGrid />
        <PreviewPanel />
      </div>
    </div>
  );
}
