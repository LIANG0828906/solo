import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Play,
  Square,
  Download,
  Plus,
  MapPin,
  ArrowLeft,
  GitCompare,
  X,
  Clock,
  Map as MapIcon,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useRecordStore, useGeolocationTracking } from '@/modules/record';
import { useMapStore } from '@/modules/map';
import { TrailMap } from '@/modules/map/components/TrailMap';
import { useSocialStore } from '@/modules/social';
import { ComparePanel } from '@/modules/social/components/ComparePanel';
import { TrailCard } from '@/modules/social/components/TrailCard';
import { formatDistance, formatDuration, exportToGPX, downloadFile } from '@/shared/utils';
import { Trail } from '@/shared/types';

export default function MapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trailIdParam = searchParams.get('trailId');

  const {
    isRecording,
    currentTrailName,
    points: recordPoints,
    error: recordError,
    getCurrentDuration,
    getCurrentDistance,
    startRecording,
    stopRecording,
  } = useRecordStore();

  const {
    trails,
    selectedTrailIds,
    compareMode,
    compareTrailIds,
    isAddingPOI,
    loadAllTrails,
    loadTrail,
    selectTrail,
    toggleTrailSelection,
    setAddingPOI,
    enableCompareMode,
    disableCompareMode,
    setCompareTrails,
  } = useMapStore();

  const {
    trails: socialTrails,
    selectedCompareTrails,
    loadAllTrails: loadSocialTrails,
    toggleCompareSelection,
    clearCompareSelection,
    likeTrail,
    likeAnimation,
  } = useSocialStore();

  const [showNameInput, setShowNameInput] = useState(false);
  const [trailName, setTrailName] = useState('');
  const [, setTick] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [comparePanelVisible, setComparePanelVisible] = useState(false);

  useGeolocationTracking();

  useEffect(() => {
    loadAllTrails();
    loadSocialTrails();
  }, [loadAllTrails, loadSocialTrails]);

  useEffect(() => {
    if (trailIdParam) {
      loadTrail(trailIdParam);
      selectTrail(trailIdParam);
    }
  }, [trailIdParam, loadTrail, selectTrail]);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (compareMode) {
      setTimeout(() => setComparePanelVisible(true), 50);
    } else {
      setComparePanelVisible(false);
    }
  }, [compareMode]);

  const handleStartRecording = () => {
    setShowNameInput(true);
  };

  const handleConfirmStart = async () => {
    if (trailName.trim()) {
      await startRecording(trailName.trim());
      setShowNameInput(false);
      setTrailName('');
    }
  };

  const handleStopRecording = async () => {
    const savedTrail = await stopRecording();
    if (savedTrail) {
      loadAllTrails();
      loadSocialTrails();
    }
  };

  const handleExportGPX = () => {
    const activeTrail = trailIdParam ? trails.get(trailIdParam) : null;
    if (activeTrail) {
      const gpxContent = exportToGPX(activeTrail.name, activeTrail.points);
      downloadFile(`${activeTrail.name}.gpx`, gpxContent);
    } else if (isRecording && recordPoints.length > 0) {
      const gpxContent = exportToGPX(currentTrailName || '轨迹', recordPoints);
      downloadFile(`${currentTrailName || '轨迹'}.gpx`, gpxContent);
    }
  };

  const handleAddPOI = () => {
    setAddingPOI(!isAddingPOI);
  };

  const handleStartCompare = () => {
    if (selectedCompareTrails.length === 2) {
      const [id1, id2] = selectedCompareTrails;
      Promise.all([
        !trails.has(id1) ? loadTrail(id1) : Promise.resolve(),
        !trails.has(id2) ? loadTrail(id2) : Promise.resolve(),
      ]).then(() => {
        enableCompareMode(id1, id2);
      });
    }
  };

  const handleTrailClick = (trail: Trail) => {
    if (compareMode) {
      if (compareTrailIds?.includes(trail.id)) {
        return;
      }
      if (!trails.has(trail.id)) {
        loadTrail(trail.id);
      }
      const newCompareIds = [...compareTrailIds!];
      newCompareIds.shift();
      newCompareIds.push(trail.id);
      setCompareTrails(newCompareIds[0], newCompareIds[1]);
    } else {
      selectTrail(trail.id);
      navigate(`/map?trailId=${trail.id}`, { replace: true });
    }
  };

  const handleCompareCheckboxToggle = (trail: Trail) => {
    if (compareMode) {
      if (compareTrailIds?.includes(trail.id)) {
        return;
      }
      if (!trails.has(trail.id)) {
        loadTrail(trail.id);
      }
      const newCompareIds = [...compareTrailIds!];
      newCompareIds.shift();
      newCompareIds.push(trail.id);
      setCompareTrails(newCompareIds[0], newCompareIds[1]);
    } else {
      toggleCompareSelection(trail.id);
      if (!trails.has(trail.id)) {
        loadTrail(trail.id);
      }
    }
  };

  const getTrailCompareIndex = (trailId: string): number | null => {
    if (!compareTrailIds) return null;
    const idx = compareTrailIds.indexOf(trailId);
    return idx >= 0 ? idx : null;
  };

  const canExport = isRecording || (trailIdParam && trails.has(trailIdParam));
  const compareTrail1 = compareTrailIds ? trails.get(compareTrailIds[0]) || null : null;
  const compareTrail2 = compareTrailIds ? trails.get(compareTrailIds[1]) || null : null;
  const showCheckbox = compareMode || selectedCompareTrails.length > 0;
  const canStartCompare = selectedCompareTrails.length === 2 && !compareMode;

  return (
    <div className="map-page">
      {compareMode && (
        <div className="compare-status-bar">
          <div className="compare-status-content">
            <GitCompare size={18} />
            <span className="compare-status-text">
              对比模式：<span className="trail-blue-name">{compareTrail1?.name || '轨迹1'}</span>
              <span className="vs-text"> VS </span>
              <span className="trail-orange-name">{compareTrail2?.name || '轨迹2'}</span>
            </span>
            <span className="compare-status-hint">（点击其他轨迹可替换对比）</span>
          </div>
          <button className="compare-status-close" onClick={disableCompareMode}>
            <X size={18} />
            退出对比
          </button>
        </div>
      )}

      <div className={`sidebar ${showSidebar ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>
          <h2>轨迹列表</h2>
          <button className="sidebar-toggle" onClick={() => setShowSidebar(!showSidebar)}>
            {showSidebar ? '<' : '>'}
          </button>
        </div>

        <div className="record-panel">
          {isRecording ? (
            <div className="recording-info">
              <div className="recording-indicator">
                <div className="pulse-ring"></div>
                <div className="pulse-ring delay"></div>
                <div className="recording-dot"></div>
              </div>
              <div className="recording-details">
                <p className="recording-name">{currentTrailName}</p>
                <div className="recording-stats">
                  <span>
                    <Clock size={14} />
                    {formatDuration(getCurrentDuration())}
                  </span>
                  <span>
                    <MapIcon size={14} />
                    {formatDistance(getCurrentDistance())}
                  </span>
                </div>
              </div>
              <button className="stop-record-btn" onClick={handleStopRecording}>
                <Square size={18} />
                停止
              </button>
            </div>
          ) : (
            <button className="start-record-btn" onClick={handleStartRecording}>
              <Play size={20} />
              开始记录
            </button>
          )}
        </div>

        <div className="action-buttons">
          <button
            className={`action-btn ${isAddingPOI ? 'active' : ''}`}
            onClick={handleAddPOI}
            disabled={isRecording}
          >
            <Plus size={18} />
            <MapPin size={16} />
            <span>添加兴趣点</span>
          </button>
          <button
            className="action-btn"
            onClick={handleExportGPX}
            disabled={!canExport}
          >
            <Download size={18} />
            <span>导出GPX</span>
          </button>
          <button
            className={`action-btn compare-btn ${compareMode ? 'active' : ''}`}
            onClick={() => {
              if (compareMode) {
                disableCompareMode();
              } else if (selectedCompareTrails.length === 0) {
                const firstTwo = socialTrails.slice(0, 2);
                if (firstTwo.length === 2) {
                  firstTwo.forEach(t => {
                    toggleCompareSelection(t.id);
                    if (!trails.has(t.id)) loadTrail(t.id);
                  });
                }
              }
            }}
          >
            <GitCompare size={18} />
            <span>{compareMode ? '退出对比' : '轨迹对比'}</span>
          </button>
        </div>

        {recordError && (
          <div className="error-message">
            <p>{recordError}</p>
          </div>
        )}

        {isAddingPOI && (
          <div className="poi-hint">
            <p>点击地图上的位置添加兴趣点</p>
            <button onClick={() => setAddingPOI(false)}>取消</button>
          </div>
        )}

        {showCheckbox && !compareMode && (
          <div className="compare-selection-info">
            <AlertCircle size={16} />
            <span>请选择 2 条轨迹进行对比</span>
          </div>
        )}

        <div className="trail-list">
          <div className="list-header">
            <h3>我的轨迹</h3>
            <span className="trail-count">{socialTrails.length} 条</span>
          </div>
          
          <div className="trail-cards">
            {socialTrails.map(trail => {
              const compareIndex = compareMode ? getTrailCompareIndex(trail.id) : null;
              const isInCompare = compareIndex !== null;
              const isCheckboxChecked = compareMode
                ? isInCompare
                : selectedCompareTrails.includes(trail.id);
              const isSelected =
                (compareMode && isInCompare) ||
                selectedCompareTrails.includes(trail.id) ||
                trailIdParam === trail.id;

              return (
                <TrailCard
                  key={trail.id}
                  trail={trail}
                  isLikedAnimating={likeAnimation === trail.id}
                  isSelected={isSelected}
                  showCompareCheckbox={showCheckbox}
                  compareIndex={compareMode ? compareIndex : (selectedCompareTrails.length > 0 ? selectedCompareTrails.indexOf(trail.id) : -1)}
                  onLike={() => likeTrail(trail.id)}
                  onClick={() => handleTrailClick(trail)}
                  onToggleSelect={() => handleCompareCheckboxToggle(trail)}
                />
              );
            })}
          </div>

          {selectedCompareTrails.length > 0 && !compareMode && (
            <div className="compare-selection-bar">
              <div className="compare-selection-info-bar">
                <div className="compare-selected-items">
                  {selectedCompareTrails.map((id, idx) => {
                    const t = socialTrails.find(tr => tr.id === id);
                    return (
                      <span key={id} className={`compare-selected-tag tag-${idx}`}>
                        {idx === 0 ? '①' : '②'} {t?.name?.slice(0, 8) || '轨迹'}
                      </span>
                    );
                  })}
                  {selectedCompareTrails.length === 1 && (
                    <span className="compare-selected-placeholder">
                      再选 1 条...
                    </span>
                  )}
                </div>
                <span className="compare-selection-count">
                  已选 {selectedCompareTrails.length}/2
                </span>
              </div>
              <div className="compare-selection-actions">
                <button
                  className="compare-clear-btn"
                  onClick={clearCompareSelection}
                  title="清除选择"
                >
                  <X size={14} />
                </button>
                <button
                  className={`compare-confirm-btn ${canStartCompare ? 'ready' : ''}`}
                  disabled={!canStartCompare}
                  onClick={handleStartCompare}
                >
                  <GitCompare size={16} />
                  {canStartCompare ? '开始对比' : `还需选择 ${2 - selectedCompareTrails.length} 条`}
                </button>
              </div>
            </div>
          )}

          {compareMode && (
            <div className="compare-selection-bar compare-mode-active">
              <div className="compare-selection-info-bar">
                <div className="compare-selected-items">
                  {compareTrailIds?.map((id, idx) => {
                    const t = socialTrails.find(tr => tr.id === id) || trails.get(id);
                    return (
                      <span key={id} className={`compare-selected-tag tag-${idx}`}>
                        {idx === 0 ? '①' : '②'} {t?.name?.slice(0, 10) || '轨迹'}
                      </span>
                    );
                  })}
                </div>
                <span className="compare-selection-count compare-mode-text">
                  对比中
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="map-container">
        <TrailMap height="100%" />

        {compareMode && compareTrail1 && compareTrail2 && comparePanelVisible && (
          <div className="compare-panel-wrapper">
            <ComparePanel
              trail1={compareTrail1}
              trail2={compareTrail2}
              onClose={disableCompareMode}
            />
          </div>
        )}
      </div>

      {showNameInput && (
        <div className="modal-overlay" onClick={() => setShowNameInput(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>命名轨迹</h3>
            <input
              type="text"
              value={trailName}
              onChange={(e) => setTrailName(e.target.value)}
              placeholder="请输入轨迹名称"
              autoFocus
              maxLength={30}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmStart();
              }}
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowNameInput(false)}>
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirmStart}
                disabled={!trailName.trim()}
              >
                开始记录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
