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
      enableCompareMode(selectedCompareTrails[0], selectedCompareTrails[1]);
      clearCompareSelection();
    }
  };

  const handleTrailClick = (trail: Trail) => {
    if (compareMode) {
      toggleTrailSelection(trail.id);
    } else {
      selectTrail(trail.id);
      navigate(`/map?trailId=${trail.id}`, { replace: true });
    }
  };

  const canExport = isRecording || (trailIdParam && trails.has(trailIdParam));
  const compareTrail1 = compareTrailIds ? trails.get(compareTrailIds[0]) || null : null;
  const compareTrail2 = compareTrailIds ? trails.get(compareTrailIds[1]) || null : null;

  return (
    <div className="map-page">
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

        <div className="trail-list">
          <div className="list-header">
            <h3>我的轨迹</h3>
            <span className="trail-count">{socialTrails.length} 条</span>
          </div>
          
          <div className="trail-cards">
            {socialTrails.map(trail => (
              <TrailCard
                key={trail.id}
                trail={trail}
                isLikedAnimating={likeAnimation === trail.id}
                isSelected={
                  (compareMode && compareTrailIds?.includes(trail.id)) ||
                  selectedCompareTrails.includes(trail.id) ||
                  trailIdParam === trail.id
                }
                showCompareCheckbox={compareMode || selectedCompareTrails.length > 0}
                onLike={() => likeTrail(trail.id)}
                onClick={() => handleTrailClick(trail)}
                onToggleSelect={() => {
                  toggleCompareSelection(trail.id);
                  loadTrail(trail.id);
                }}
              />
            ))}
          </div>

          {selectedCompareTrails.length > 0 && (
            <div className="compare-selection-bar">
              <span>已选 {selectedCompareTrails.length}/2</span>
              <button
                className="compare-confirm-btn"
                disabled={selectedCompareTrails.length !== 2}
                onClick={handleStartCompare}
              >
                开始对比
              </button>
              <button
                className="compare-clear-btn"
                onClick={clearCompareSelection}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="map-container">
        <TrailMap height="100%" />

        {compareMode && compareTrail1 && compareTrail2 && (
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
