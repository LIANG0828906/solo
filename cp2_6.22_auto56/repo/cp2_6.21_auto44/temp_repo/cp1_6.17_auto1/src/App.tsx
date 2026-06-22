import CameraModule from './modules/camera/CameraModule';
import TextureModule from './modules/texture/TextureModule';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">纸张褶皱检测与热力图生成</h1>
        <p className="app-subtitle">
          通过摄像头检测纸张表面褶皱，实时生成纹理热力图
        </p>
      </header>

      <main className="app-main">
        <div className="left-panel">
          <div className="panel-label">摄像头预览</div>
          <CameraModule />
        </div>

        <div className="divider" />

        <div className="right-panel">
          <div className="panel-label">纹理分析工作区</div>
          <TextureModule />
        </div>
      </main>

      <footer className="app-footer">
        <p>使用说明：点击"拍照抓取"拍摄纸张照片，调节敏感度优化热力图效果</p>
      </footer>
    </div>
  );
}

export default App;
