import ParamsPanel from '@/modules/params/ParamsPanel';
import PreviewArea from '@/modules/preview/PreviewArea';

export default function App() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      background: '#ffffff',
      overflow: 'hidden',
    }}
    className="app-layout"
    >
      <ParamsPanel />
      <PreviewArea />
    </div>
  );
}
