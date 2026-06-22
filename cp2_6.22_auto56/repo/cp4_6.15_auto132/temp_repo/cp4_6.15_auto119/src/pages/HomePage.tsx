import { useEffect, useState } from 'react';
import type { Work } from '@/types';
import WorksGallery from '@/components/WorksGallery';
import { fetchWorks } from '@/services/GalleryService';

export default function HomePage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorks()
      .then(setWorks)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-cream wood-texture">
      <header className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-full bg-oak-dark flex items-center justify-center">
              <span className="text-white font-display text-lg font-bold">匠</span>
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-walnut">
                匠心工坊
              </h1>
              <p className="font-body text-sm text-oak-dark/60">
                CRAFTSMAN STUDIO
              </p>
            </div>
          </div>
          <p className="font-body text-oak-dark/50 mt-3 max-w-xl">
            每一件作品，都是时间的雕刻。从原木到成品，倾注匠人的心血与热爱。
          </p>
        </div>
      </header>

      <main className="px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="break-inside-avoid">
                  <div className="rounded-card overflow-hidden bg-white shadow-warm">
                    <div className="aspect-[4/3] bg-oak-light/10 animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-5 bg-oak-light/10 rounded animate-pulse w-2/3" />
                      <div className="h-4 bg-oak-light/10 rounded animate-pulse w-1/3" />
                      <div className="h-6 bg-oak-light/10 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <WorksGallery works={works} />
          )}
        </div>
      </main>

      <footer className="py-8 px-6 border-t border-oak-light/20">
        <div className="max-w-7xl mx-auto text-center font-body text-sm text-oak-dark/40">
          匠心工坊 © 2026 · 每一件作品，都是时间的雕刻
        </div>
      </footer>
    </div>
  );
}
