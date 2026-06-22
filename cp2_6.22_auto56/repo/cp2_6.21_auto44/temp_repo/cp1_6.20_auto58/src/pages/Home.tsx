import { ControlPanel, PreviewCanvas } from '@/TypographyPreviewModule';

export default function Home() {
  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
      <PreviewCanvas />
      <ControlPanel />
    </div>
  );
}
