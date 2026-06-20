import EditorCanvas from '@/components/EditorCanvas'
import TemplatePanel from '@/components/TemplatePanel'

export default function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">书信留痕</h1>
        <p className="app-subtitle">在数字时代保存和美化你的手写信件</p>
      </header>
      <main className="app-main">
        <EditorCanvas />
        <TemplatePanel />
      </main>
    </div>
  )
}
