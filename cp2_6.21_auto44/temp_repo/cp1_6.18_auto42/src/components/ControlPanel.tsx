import { useRef } from 'react';
import { ThemeType } from '../modules/ThreeRenderer';
import { getSamples, SketchSample } from '../modules/SampleApi';
import { useAppStore } from '../store/useAppStore';
import { parseSketch } from '../modules/CanvasParser';

interface ControlPanelProps {
  onResetCamera: () => void;
}

const themes: { id: ThemeType; name: string }[] = [
  { id: 'neon', name: '霓虹' },
  { id: 'aurora', name: '极光' },
  { id: 'sunset', name: '日落' }
];

export function ControlPanel({ onResetCamera }: ControlPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentTheme, setTheme, setPaths, setLoading, setError, setSelectedPath } = useAppStore();
  const samples = getSamples();
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('只支持 PNG、JPG、WebP 格式的图片');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSelectedPath(null);
    
    try {
      const result = await parseSketch(file);
      if (result.paths.length === 0) {
        setError('未能识别到任何线条，请确保图片是黑白线条草图');
        return;
      }
      setPaths(result.paths, result.originalImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析失败，请重试');
    } finally {
      setLoading(false);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleSampleClick = (sample: SketchSample) => {
    setSelectedPath(null);
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 800, 600);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    
    sample.paths.forEach(path => {
      if (path.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    });
    
    setPaths(sample.paths, canvas);
  };
  
  const handleThemeChange = (theme: ThemeType) => {
    setTheme(theme);
  };
  
  return (
    <div className="control-panel">
      <div className="panel-title">
        <svg viewBox="0 0 24 24">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        光痕地图
      </div>
      
      <div className="panel-section">
        <label className="section-label">上传草图</label>
        <button className="panel-btn" onClick={handleUploadClick}>
          <svg viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5M7 8l5-5M12 3v12" />
          </svg>
          选择图片
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      
      <div className="panel-section">
        <label className="section-label">视角控制</label>
        <button className="panel-btn" onClick={onResetCamera}>
          <svg viewBox="0 0 24 24">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          复位视角
        </button>
      </div>
      
      <div className="panel-section">
        <label className="section-label">颜色主题</label>
        <div className="theme-options">
          {themes.map((theme) => (
            <button
              key={theme.id}
              className={`theme-btn ${currentTheme === theme.id ? 'active' : ''}`}
              onClick={() => handleThemeChange(theme.id)}
            >
              {theme.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="panel-section">
        <label className="section-label">预设样例</label>
        <div className="sample-list">
          {samples.map((sample) => (
            <button
              key={sample.id}
              className="sample-btn"
              onClick={() => handleSampleClick(sample)}
            >
              <span className="sample-thumb">{sample.thumbnail}</span>
              <span>{sample.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
