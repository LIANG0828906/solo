import { useState, useRef, useMemo } from 'react';
import { usePipelineStore } from '@/store/pipelineStore';
import { PIPELINE_COLORS, PIPELINE_LABELS, PIPELINE_ICONS, PipelineType, CORRIDOR_WIDTH, CORRIDOR_HEIGHT } from '@/types';
import { calculateTotalLength, calculateSectionUtilization } from '@/utils/collisionDetection';
import type { Pipeline } from '@/types';

function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        <p style={{ fontSize: '14px', color: '#9e9e9e' }}>{message}</p>
        <div className="modal-actions">
          <button className="btn btn-sm" onClick={onCancel}>
            取消
          </button>
          <button className="btn btn-sm btn-danger" onClick={onConfirm}>
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
}

function CircularProgress({ value }: { value: number }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const getStatusClass = () => {
    if (value < 60) return 'warning';
    if (value > 85) return 'good';
    return '';
  };

  return (
    <div className="circular-progress">
      <svg width="120" height="120">
        <circle
          className="progress-bg"
          cx="60"
          cy="60"
          r={radius}
        />
        <circle
          className={`progress-bar ${getStatusClass()}`}
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="progress-text">
        <div className="progress-value">{value.toFixed(1)}%</div>
        <div className="progress-label">断面利用率</div>
      </div>
    </div>
  );
}

function PipelinePanel() {
  const {
    pipelines,
    selectedPipelineId,
    collisions,
    isAddingPipeline,
    addingPipelineType,
    addingPipelineDiameter,
    panelCollapsed,
    setIsAddingPipeline,
    setAddingPipelineType,
    setAddingPipelineDiameter,
    removePipeline,
    setSelectedPipeline,
    showToast,
    togglePanel,
    importPipelines,
    clearAll,
    setFocusedCollisionId,
    focusedCollisionId,
  } = usePipelineStore();

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [clearAllConfirm, setClearAllConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const totalLength = useMemo(() => calculateTotalLength(pipelines), [pipelines]);
  const utilization = useMemo(
    () => calculateSectionUtilization(pipelines, CORRIDOR_WIDTH, CORRIDOR_HEIGHT),
    [pipelines]
  );

  const handleAddPipeline = () => {
    if (!addingPipelineType) {
      showToast('请先选择管线类型', 'error');
      return;
    }
    setIsAddingPipeline(true);
  };

  const handleCancelAdd = () => {
    setIsAddingPipeline(false);
    setAddingPipelineType(null);
  };

  const handleExport = () => {
    const data = JSON.stringify(pipelines, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pipelines.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('管线数据导出成功', 'success');
  };

  const validatePipelines = (data: unknown): data is Pipeline[] => {
    if (!Array.isArray(data)) return false;
    return data.every((item) => {
      if (typeof item !== 'object' || item === null) return false;
      const p = item as Record<string, unknown>;
      return (
        typeof p.id === 'string' &&
        typeof p.type === 'string' &&
        ['water', 'power', 'communication', 'gas'].includes(p.type) &&
        typeof p.diameter === 'number' &&
        typeof p.start === 'object' &&
        p.start !== null &&
        typeof (p.start as Record<string, unknown>).x === 'number' &&
        typeof (p.start as Record<string, unknown>).y === 'number' &&
        typeof (p.start as Record<string, unknown>).z === 'number' &&
        typeof p.end === 'object' &&
        p.end !== null &&
        typeof (p.end as Record<string, unknown>).x === 'number' &&
        typeof (p.end as Record<string, unknown>).y === 'number' &&
        typeof (p.end as Record<string, unknown>).z === 'number'
      );
    });
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (validatePipelines(data)) {
          importPipelines(data);
          showToast(`成功导入 ${data.length} 条管线`, 'success');
        } else {
          showToast('数据格式错误，请检查文件', 'error');
        }
      } catch {
        showToast('文件解析失败', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) {
      handleImport(file);
    } else {
      showToast('请拖入 JSON 文件', 'error');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  };

  const getPipelineLabel = (pipeline: Pipeline) => {
    const length = calculateTotalLength([pipeline]);
    return `${PIPELINE_LABELS[pipeline.type]} ${(length * 1000).toFixed(0)}mm`;
  };

  const getPipelineName = (pipelineId: string) => {
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    if (!pipeline) return '未知管线';
    return PIPELINE_LABELS[pipeline.type];
  };

  const handleCollisionClick = (collisionId: string) => {
    setFocusedCollisionId(collisionId === focusedCollisionId ? null : collisionId);
  };

  const pipelineTypes: PipelineType[] = ['water', 'power', 'communication', 'gas'];

  if (panelCollapsed) {
    return (
      <div className="panel collapsed">
        <div className="panel-header">
          <button className="collapse-btn" onClick={togglePanel} title="展开面板">
            →
          </button>
        </div>
        <div className="collapsed-icons">
          {pipelineTypes.map((type) => (
            <div
              key={type}
              className="collapsed-icon"
              style={{
                color: PIPELINE_COLORS[type],
                border: addingPipelineType === type ? '2px solid #00d2ff' : 'none',
              }}
              title={PIPELINE_LABELS[type]}
              onClick={() => {
                setAddingPipelineType(type);
                setIsAddingPipeline(true);
                togglePanel();
              }}
            >
              {PIPELINE_ICONS[type]}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="panel expanded">
      <div className="panel-header">
        <span className="panel-title">管线编辑器</span>
        <button className="collapse-btn" onClick={togglePanel} title="折叠面板">
          ←
        </button>
      </div>

      <div className="panel-content">
        <div className="section">
          <div className="section-title">管线类型</div>
          <div className="pipeline-type-list">
            {pipelineTypes.map((type) => (
              <div
                key={type}
                className={`pipeline-type-item ${addingPipelineType === type ? 'selected' : ''}`}
                onClick={() => setAddingPipelineType(type)}
              >
                <div
                  className="pipeline-type-color"
                  style={{ background: PIPELINE_COLORS[type] }}
                />
                <span className="pipeline-type-icon">{PIPELINE_ICONS[type]}</span>
                <span className="pipeline-type-name">{PIPELINE_LABELS[type]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section-title">截面直径 (mm)</div>
          <div className="input-group">
            <input
              type="number"
              className="input-field"
              value={addingPipelineDiameter}
              min={50}
              max={200}
              step={10}
              onChange={(e) => setAddingPipelineDiameter(Number(e.target.value))}
            />
            <div style={{ display: 'flex', gap: '4px' }}>
              {[50, 100, 150, 200].map((val) => (
                <button
                  key={val}
                  className="btn btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => setAddingPipelineDiameter(val)}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="section">
          {isAddingPipeline ? (
            <>
              <button className="btn btn-danger" onClick={handleCancelAdd}>
                取消添加 (ESC)
              </button>
              <p
                style={{
                  fontSize: '12px',
                  color: '#9e9e9e',
                  marginTop: '8px',
                  textAlign: 'center',
                }}
              >
                在场景中点击两点放置管线
              </p>
            </>
          ) : (
            <button className="btn btn-primary" onClick={handleAddPipeline}>
              + 添加管线
            </button>
          )}
        </div>

        <div className="section">
          <div className="section-title">统计信息</div>
          <div className="stats-row">
            <span className="stats-label">管线数量</span>
            <span className="stats-value">{pipelines.length} 条</span>
          </div>
          <div className="stats-row">
            <span className="stats-label">总长度</span>
            <span className="stats-value">{(totalLength * 1000).toFixed(1)} mm</span>
          </div>
          <div className="stats-row">
            <span className="stats-label">碰撞数量</span>
            <span className="stats-value" style={{ color: collisions.length > 0 ? '#f44336' : '#4caf50' }}>
              {collisions.length} 处
            </span>
          </div>
        </div>

        <div className="section">
          <div className="section-title">断面利用率</div>
          <div className="utilization-container">
            <CircularProgress value={utilization} />
          </div>
          <p style={{ fontSize: '11px', color: '#666', textAlign: 'center', marginTop: '8px' }}>
            管廊断面: {CORRIDOR_WIDTH}m × {CORRIDOR_HEIGHT}m
          </p>
        </div>

        <div className="section">
          <div className="section-title">管线列表</div>
          <div className="pipeline-list">
            {pipelines.length === 0 ? (
              <div className="empty-state">暂无管线</div>
            ) : (
              pipelines.map((pipeline) => (
                <div
                  key={pipeline.id}
                  className={`pipeline-item ${selectedPipelineId === pipeline.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPipeline(pipeline.id)}
                >
                  <div
                    className="pipeline-color-bar"
                    style={{ background: PIPELINE_COLORS[pipeline.type] }}
                  />
                  <div className="pipeline-info">
                    <div className="pipeline-name">
                      {PIPELINE_ICONS[pipeline.type]} {PIPELINE_LABELS[pipeline.type]}
                    </div>
                    <div className="pipeline-length">
                      Φ{pipeline.diameter}mm · {(calculateTotalLength([pipeline]) * 1000).toFixed(0)}mm
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(pipeline.id);
                    }}
                    title="删除管线"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="section">
          <div className="section-title">碰撞检测结果</div>
          <div className="collision-list">
            {collisions.length === 0 ? (
              <div className="empty-state" style={{ padding: '12px' }}>
                暂无碰撞
              </div>
            ) : (
              collisions.map((collision) => (
                <div
                  key={collision.id}
                  className={`collision-item ${focusedCollisionId === collision.id ? 'focused' : ''}`}
                  onClick={() => handleCollisionClick(collision.id)}
                >
                  <div className="collision-title">
                    {getPipelineName(collision.pipelineAId)} ↔ {getPipelineName(collision.pipelineBId)}
                  </div>
                  <div className="collision-coords">
                    ({collision.point.x.toFixed(2)}, {collision.point.y.toFixed(2)}, {collision.point.z.toFixed(2)})
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="section">
          <div className="section-title">数据管理</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button className="btn btn-sm" onClick={handleExport} style={{ flex: 1 }}>
              导出 JSON
            </button>
            <button
              className="btn btn-sm"
              onClick={() => fileInputRef.current?.click()}
              style={{ flex: 1 }}
            >
              导入 JSON
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <div
            className={`file-drop-zone ${isDragging ? 'dragover' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="file-drop-text">
              拖入 JSON 文件或点击上传
            </span>
          </div>
          <button
            className="btn btn-sm btn-danger"
            style={{ marginTop: '12px' }}
            onClick={() => setClearAllConfirm(true)}
          >
            清空所有
          </button>
        </div>
      </div>

      {deleteConfirm && (
        <ConfirmModal
          title="删除管线"
          message={`确定要删除这条 ${getPipelineLabel(pipelines.find(p => p.id === deleteConfirm)!)} 吗？`}
          onConfirm={() => {
            removePipeline(deleteConfirm);
            setDeleteConfirm(null);
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {clearAllConfirm && (
        <ConfirmModal
          title="清空所有"
          message={`确定要清空所有 ${pipelines.length} 条管线吗？此操作不可撤销。`}
          onConfirm={() => {
            clearAll();
            setClearAllConfirm(false);
            showToast('已清空所有管线', 'success');
          }}
          onCancel={() => setClearAllConfirm(false)}
        />
      )}
    </div>
  );
}

export default PipelinePanel;
