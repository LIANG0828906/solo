import FlowerSelector from '@/modules/customizer/FlowerSelector';
import WrappingPicker from '@/modules/customizer/WrappingPicker';
import FlowerBouquet from '@/modules/renderer/FlowerBouquet';
import OrderSummary from '@/modules/order/OrderSummary';
import { RotateCw } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: '#FDF5E6' }}>
      <header className="py-5 px-6 text-center" style={{ borderBottom: '1px solid #E8E0D0' }}>
        <h1
          className="text-3xl font-bold tracking-wide"
          style={{ fontFamily: 'Georgia, serif', color: '#2E4A2E' }}
        >
          ✿ 花语定制 ✿
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#8B8B7A', fontFamily: 'Arial, sans-serif' }}>
          自由搭配花材与包装，实时预览3D花束效果
        </p>
      </header>

      <div className="flex flex-col md:flex-row" style={{ minHeight: 'calc(100vh - 88px)' }}>
        <aside
          className="w-full md:w-[350px] flex-shrink-0 overflow-y-auto"
          style={{
            background: '#FFFFFF',
            borderRight: '1px solid #E8E0D0',
            maxHeight: '100vh',
          }}
        >
          <div className="p-6 space-y-6">
            <FlowerSelector />
            <div style={{ borderTop: '1px solid #E8E8E0', margin: '0 -24px', padding: '0 24px' }}>
              <div className="pt-6">
                <WrappingPicker />
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 relative min-h-[50vh] md:min-h-0">
          <FlowerBouquet />
          <div
            className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
            style={{
              background: 'rgba(255,255,255,0.85)',
              color: '#6B8E4E',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(107,142,78,0.2)',
            }}
          >
            <RotateCw size={14} />
            <span>拖拽旋转 · 滚轮缩放 · 右键平移</span>
          </div>
        </main>

        <aside
          className="w-full md:w-[280px] flex-shrink-0"
          style={{ borderLeft: '1px solid #E8E0D0' }}
        >
          <div className="p-4">
            <OrderSummary />
          </div>
        </aside>
      </div>
    </div>
  );
}
