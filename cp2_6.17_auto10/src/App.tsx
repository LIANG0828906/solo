import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Curator } from '@/curation/Curator';
import { EmotionMap } from '@/emotion/EmotionMap';
import { FilteredGallery } from '@/emotion/FilteredGallery';
import { useStore } from '@/store/useStore';
import { generateSampleWorks } from '@/utils/sampleData';

export default function App() {
  const loadWorks = useStore((state) => state.loadWorks);
  const isLoaded = useStore((state) => state.isLoaded);
  const works = useStore((state) => state.works);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    console.log('App mounted, isLoaded:', isLoaded);
    const timer = setTimeout(() => {
      console.log('Fallback timer fired, isLoaded:', isLoaded);
      if (!isLoaded) {
        try {
          const sampleWorks = generateSampleWorks();
          console.log('Sample works generated:', sampleWorks.length);
          setShowFallback(true);
          useStore.setState({ works: sampleWorks, isLoaded: true });
          console.log('State updated');
        } catch (e) {
          console.error('Error in fallback:', e);
        }
      }
    }, 1000);
    
    loadWorks().catch((e) => console.error('loadWorks error:', e));
    
    return () => clearTimeout(timer);
  }, [loadWorks, isLoaded]);

  if (!isLoaded && !showFallback) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1A1A2E]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#FF6B6B] border-t-transparent"></div>
          <p className="text-sm text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#1A1A2E]">
        <Navbar />
        <Routes>
          <Route path="/" element={<Curator />} />
          <Route path="/emotion" element={<EmotionMap />} />
          <Route path="/emotion/filter/:tag" element={<FilteredGallery />} />
        </Routes>
      </div>
    </Router>
  );
}
