import { ControlPanel } from '@/components/ControlPanel'
import { PreviewCanvas } from '@/components/PreviewCanvas'
import { CodeExporter } from '@/components/CodeExporter'

export default function App() {
  return (
    <div className="app-root">
      <ControlPanel />
      <PreviewCanvas />
      <CodeExporter />
    </div>
  )
}
