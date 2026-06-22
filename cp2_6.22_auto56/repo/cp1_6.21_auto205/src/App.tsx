import { useState } from 'react'
import SandboxModule from './SandboxModule'
import SnippetManager from './SnippetManager'
import type { CodeSnippet } from './types'

function App() {
  const [currentHtml, setCurrentHtml] = useState('<div id="app">\n  <h1>Hello World</h1>\n  <p>欢迎使用代码演示沙盒</p>\n  <button id="btn">点击我</button>\n</div>')
  const [currentCss, setCurrentCss] = useState(`body {\n  font-family: -apple-system, BlinkMacSystemFont, sans-serif;\n  padding: 20px;\n}\n\nh1 {\n  color: #6366F1;\n  margin-bottom: 10px;\n}\n\np {\n  color: #64748B;\n  margin-bottom: 20px;\n}\n\nbutton {\n  padding: 10px 24px;\n  background: #6366F1;\n  color: white;\n  border: none;\n  border-radius: 8px;\n  cursor: pointer;\n  font-size: 14px;\n  transition: all 0.2s;\n}\n\nbutton:hover {\n  background: #4F46E5;\n  transform: translateY(-1px);\n}`)
  const [currentJs, setCurrentJs] = useState(`console.log('沙盒已加载');\n\nconst btn = document.getElementById('btn');\nbtn.addEventListener('click', () => {\n  console.log('按钮被点击了!');\n  alert('Hello from Sandbox!');\n});\n\n// 试试在这里添加更多代码\nconst nums = [1, 2, 3, 4, 5];\nconsole.log('数组:', nums);\nconsole.log('求和:', nums.reduce((a, b) => a + b, 0));`)

  const handleLoadSnippet = (snippet: CodeSnippet) => {
    setCurrentHtml(snippet.html)
    setCurrentCss(snippet.css)
    setCurrentJs(snippet.javascript)
  }

  const getCurrentCode = () => ({
    html: currentHtml,
    css: currentCss,
    javascript: currentJs,
  })

  return (
    <div className="app-container">
      <div className="sidebar">
        <SnippetManager
          currentCode={getCurrentCode()}
          onLoadSnippet={handleLoadSnippet}
        />
      </div>
      <div className="main-content">
        <SandboxModule
          html={currentHtml}
          css={currentCss}
          javascript={currentJs}
          onHtmlChange={setCurrentHtml}
          onCssChange={setCurrentCss}
          onJsChange={setCurrentJs}
        />
      </div>
    </div>
  )
}

export default App
