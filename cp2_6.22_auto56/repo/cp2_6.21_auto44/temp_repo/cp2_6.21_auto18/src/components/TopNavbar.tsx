import { useRef, useState } from 'react';
import { Info, Download, Upload, Play, Pause } from 'lucide-react';
import { useSceneStore } from '../store/sceneStore';
import { downloadJSON, generateTimestampFilename, readFileAsText } from '../utils/sceneIO';
import { CameraPathType, CAMERA_PATH_NAMES } from '../types/scene';

export function TopNavbar() {
  const exportScene = useSceneStore((state) => state.exportScene);
  const importScene = useSceneStore((state) => state.importScene);
  const cameraPath = useSceneStore((state) => state.cameraPath);
  const setCameraPath = useSceneStore((state) => state.setCameraPath);
  const isAnimating = useSceneStore((state) => state.isAnimating);
  const toggleAnimation = useSceneStore((state) => state.toggleAnimation);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportScene();
    const filename = generateTimestampFilename();
    downloadJSON(json, filename);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const text = await readFileAsText(file);
        importScene(text);
      } catch (err) {
        console.error('导入失败:', err);
        alert('导入失败：文件格式不正确');
      }
    }
    e.target.value = '';
  };

  const handlePathChange = (path: CameraPathType) => {
    if (cameraPath === path) {
      toggleAnimation();
    } else {
      setCameraPath(path);
    }
  };

  const cameraPaths: { type: CameraPathType; label: string }[] = [
    { type: 'none', label: '自由' },
    { type: 'orbit', label: '环绕' },
    { type: 'linear', label: '推进' },
    { type: 'snake', label: '蛇形' },
  ];

  return (
    <div className="top-navbar">
      <div className="navbar-left">
        <h1 className="app-title">虚拟策展台</h1>
      </div>

      <div className="navbar-center">
        <div className="camera-path-controls">
          {cameraPaths.map((path) => (
            <button
              key={path.type}
              className={`path-button ${cameraPath === path.type ? 'active' : ''}`}
              onClick={() => handlePathChange(path.type)}
              title={CAMERA_PATH_NAMES[path.type]}
            >
              {path.type !== 'none' && cameraPath === path.type ? (
                isAnimating ? (
                  <Pause size={16} />
                ) : (
                  <Play size={16} />
                )
              ) : null}
              <span>{path.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="navbar-right">
        <button
          className="nav-button"
          onClick={handleImportClick}
          title="导入场景"
        >
          <Upload size={18} />
        </button>
        <button
          className="nav-button"
          onClick={handleExport}
          title="导出场景"
        >
          <Download size={18} />
        </button>
        <button
          className={`nav-button ${showHelp ? 'active' : ''}`}
          onClick={() => setShowHelp(!showHelp)}
          title="使用说明"
        >
          <Info size={18} />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {showHelp && (
        <div className="help-modal" onClick={() => setShowHelp(false)}>
          <div className="help-content" onClick={(e) => e.stopPropagation()}>
            <h3>使用说明</h3>
            <ul>
              <li>点击左侧按钮添加展品到场景中</li>
              <li>点击展品选中，显示三轴控制手柄</li>
              <li>拖拽手柄可沿对应轴平移展品</li>
              <li>按 <kbd>T</kbd> 切换平移模式，按 <kbd>R</kbd> 切换旋转模式</li>
              <li>按 <kbd>Delete</kbd> 或 <kbd>Backspace</kbd> 删除选中展品</li>
              <li>鼠标左键拖拽旋转视角，滚轮缩放，右键平移</li>
              <li>拖拽场景中的发光小球可移动点光源</li>
              <li>顶部路径按钮可切换摄像机漫游动画</li>
              <li>动画进行中点击画布暂停，松开恢复</li>
              <li>支持导出/导入 JSON 格式的场景文件</li>
            </ul>
            <button className="close-button" onClick={() => setShowHelp(false)}>
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
