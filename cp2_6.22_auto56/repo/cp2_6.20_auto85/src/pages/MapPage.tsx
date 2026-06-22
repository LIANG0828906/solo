import Timeline from '@/components/Timeline';
import MapView from '@/components/MapView';
import DetailPanel from '@/components/DetailPanel';
import Itinerary from '@/components/Itinerary';
import SearchFilter from '@/components/SearchFilter';

export default function MapPage() {
  return (
    <div className="flex h-screen w-screen bg-bg-cream overflow-hidden">
      <aside className="sidebar-panel w-[30%] h-full flex-shrink-0 border-r border-brand-brown/10 bg-bg-cream">
        <Timeline />
      </aside>

      <main className="map-container relative flex-1 h-full">
        <MapView />
        <SearchFilter />
        <DetailPanel />
        <Itinerary />
      </main>
    </div>
  );
}
