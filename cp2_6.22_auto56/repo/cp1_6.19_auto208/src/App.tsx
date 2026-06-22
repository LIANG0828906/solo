import { useGalleryStore } from '@/store/galleryStore';
import { GalleryGrid } from '@/modules/gallery/GalleryGrid';
import { PosterViewer } from '@/modules/viewer/PosterViewer';
import { AnimatePresence } from 'framer-motion';

function App() {
  const selectedId = useGalleryStore((s) => s.selectedPosterId);

  return (
    <div className="w-full min-h-screen" style={{ fontFamily: '"Noto Sans SC", sans-serif' }}>
      <GalleryGrid />
      <AnimatePresence>
        {selectedId && <PosterViewer key={selectedId} />}
      </AnimatePresence>
    </div>
  );
}

export default App;
