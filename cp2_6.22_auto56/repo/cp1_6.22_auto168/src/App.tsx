import { useState, useCallback } from 'react';
import EditorPane from './EditorPane';
import PreviewPane from './PreviewPane';
import type { Theme } from './themes';
import { presetThemes, defaultCode } from './themes';
import './index.css';

function App() {
  const [code, setCode] = useState(defaultCode);
  const [currentTheme, setCurrentTheme] = useState<Theme>(presetThemes[0]);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
  }, []);

  const handleThemeChange = useCallback((newTheme: Theme) => {
    setCurrentTheme(newTheme);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">代码高亮主题定制工具</h1>
        <p className="app-subtitle">快速预览和定制博客代码块配色方案</p>
      </header>
      <main className="app-main">
        <div className="editor-container">
          <EditorPane code={code} onChange={handleCodeChange} />
        </div>
        <div className="preview-container">
          <PreviewPane
            code={code}
            theme={currentTheme}
            onThemeChange={handleThemeChange}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
