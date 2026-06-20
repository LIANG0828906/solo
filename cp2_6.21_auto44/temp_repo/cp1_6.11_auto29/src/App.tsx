import TextEditor from './TextEditor';

export default function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>协同编辑与差异高亮</h1>
        <p className="subtitle">基于文本分块的版本对比工具</p>
      </header>
      <TextEditor />
    </div>
  );
}
