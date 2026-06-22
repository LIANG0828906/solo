interface ToolbarProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onGenerate: () => void;
  onExport: () => void;
  onShare: () => void;
  isGenerating: boolean;
  roomCode: string;
}

function Toolbar({
  inputText,
  onInputChange,
  onGenerate,
  onExport,
  onShare,
  isGenerating,
  roomCode,
}: ToolbarProps) {
  const handleExportClick = () => {
    onExport();
    window.dispatchEvent(new CustomEvent('export-mindmap'));
  };

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <div className="logo">
          <div className="logo-icon">📊</div>
          <span>MindMap Collab</span>
        </div>
        <div className="input-wrapper">
          <input
            type="text"
            className="input-field"
            placeholder="输入描述，例如：项目启动会准备事项：场地预订、设备测试..."
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isGenerating) {
                onGenerate();
              }
            }}
          />
        </div>
      </div>

      <div className="toolbar-right">
        {roomCode && <span className="room-code-badge">#{roomCode}</span>}
        <button
          className="btn btn-primary"
          onClick={onGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? '生成中...' : '✨ 生成导图'}
        </button>
        <button className="btn btn-secondary btn-icon" onClick={handleExportClick} title="导出图片">
          📷
        </button>
        <button className="btn btn-secondary btn-icon" onClick={onShare} title="分享链接">
          🔗
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
