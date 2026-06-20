import { ControlPanel } from '@/ui/ControlPanel';
import { PreviewArea } from '@/ui/PreviewArea';
import { CodeExport } from '@/ui/CodeExport';

export default function App() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        background: '#1a1a2e',
        color: '#fff',
      }}
    >
      <div
        style={{
          width: '100%',
          paddingRight: 320,
          boxSizing: 'border-box',
          minHeight: '100vh',
        }}
        className="app-main"
      >
        <PreviewArea />
      </div>
      <ControlPanel />
      <CodeExport />

      <style>{`
        @media (max-width: 767px) {
          .app-main {
            padding-right: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
