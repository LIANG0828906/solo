import React from 'react'
import { DesignTokensProvider } from './context/DesignTokensContext'
import TokenEditor from './modules/token-editor/TokenEditor'
import ComponentPreview from './modules/component-preview/ComponentPreview'

const App: React.FC = () => {
  return (
    <DesignTokensProvider>
      <div className="app-layout">
        <TokenEditor />
        <ComponentPreview />
      </div>
    </DesignTokensProvider>
  )
}

export default App
