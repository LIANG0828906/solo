import TemplateManager from './TemplateManager';
import WhiteboardCanvas from './WhiteboardCanvas';

export default function App() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#1E1E2E',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flex: 1,
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <div
          style={{
            width: 280,
            flexShrink: 0,
            borderRight: '1px solid #444444',
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          <TemplateManager />
        </div>
        <WhiteboardCanvas />
      </div>
      <style>{`
        @media (max-width: 767px) {
          #root > div {
            flex-direction: column !important;
          }
          #root > div > div:first-child {
            flex-direction: column !important;
          }
          #root > div > div:first-child > div:first-child {
            width: 100% !important;
            height: 60px !important;
            border-right: none !important;
            border-bottom: 1px solid #444444;
          }
        }
      `}</style>
    </div>
  );
}
