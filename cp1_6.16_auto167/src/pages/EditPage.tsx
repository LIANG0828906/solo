import { useEffect } from 'react';
import Toolbar from '@/components/Toolbar';
import Canvas from '@/components/Canvas';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useApiStore } from '@/store/apiStore';

export default function EditPage() {
  const { fetchExhibits, isExporting } = useApiStore();

  useEffect(() => {
    fetchExhibits();
  }, [fetchExhibits]);

  return (
    <div className="w-full h-full flex" style={{ background: 'var(--bg-primary)' }}>
      <Toolbar />
      <Canvas />
      {isExporting && <LoadingOverlay />}
    </div>
  );
}
