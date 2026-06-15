import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Work } from '@/types';
import { fetchWorkById } from '@/services/GalleryService';
import ImageCarousel from '@/components/ImageCarousel';
import QuoteCalculator from '@/components/QuoteCalculator';

export default function WorkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    fetchWorkById(id)
      .then(setWork)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream wood-texture flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-oak-light border-t-oak-dark rounded-full animate-spin mx-auto mb-4" />
          <p className="font-body text-oak-dark/50">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !work) {
    return (
      <div className="min-h-screen bg-cream wood-texture flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-2xl text-walnut mb-4">作品未找到</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-btn bg-oak-dark text-white font-body text-sm hover:bg-walnut transition-colors duration-300"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream wood-texture">
      <header className="py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-oak-dark/60 hover:text-walnut transition-colors duration-300 font-body text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            返回作品集
          </button>
        </div>
      </header>

      <main className="px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/2">
              <ImageCarousel images={work.images} />
            </div>

            <div className="lg:w-1/2 space-y-6">
              <div className="bg-white rounded-card p-6 shadow-warm">
                <h1 className="font-display text-3xl font-bold text-walnut mb-3">
                  {work.name}
                </h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  {work.materials.map((m) => (
                    <span
                      key={m}
                      className="px-3 py-1 rounded-full text-xs font-body font-medium bg-oak-light/20 text-oak-dark"
                    >
                      {m}
                    </span>
                  ))}
                </div>
                <p className="font-body text-oak-dark/70 leading-relaxed mb-5">
                  {work.description}
                </p>
                <div className="border-t border-oak-light/20 pt-4">
                  <h3 className="font-body text-sm font-semibold text-walnut mb-3">尺寸规格</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {work.dimensions.map((d) => (
                      <div key={d.label} className="flex justify-between font-body text-sm px-3 py-2 bg-cream/50 rounded-btn">
                        <span className="text-oak-dark/50">{d.label}</span>
                        <span className="text-walnut font-medium">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-body text-sm text-oak-dark/50">基价</span>
                  <span className="font-display text-2xl font-bold text-walnut">¥{work.basePrice}</span>
                  <span className="font-body text-xs text-oak-dark/40">/ 工时 {work.hours}h</span>
                </div>
              </div>

              <QuoteCalculator work={work} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
