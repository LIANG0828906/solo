import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { marked } from 'marked';
import {
  plantApi,
  logApi,
  recognitionApi,
  Plant,
  CareLog,
  CareLogType,
  RecognitionResult,
  DiseaseRegion
} from './api';

const styles = `
  .detail-page {
    animation: fadeInUp 0.4s ease-out;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--color-primary);
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 16px;
    padding: 6px 12px;
    border-radius: 8px;
    transition: var(--transition);
  }

  .back-link:hover {
    background: rgba(46, 125, 50, 0.1);
  }

  .detail-header {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 24px;
    padding: 24px;
    background: white;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-card);
    animation: fadeInUp 0.5s ease-out;
  }

  .detail-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 3px solid var(--color-border-gray-green);
    object-fit: cover;
    background: linear-gradient(135deg, #c8e6c9, #a5d6a7);
    flex-shrink: 0;
  }

  .detail-info {
    flex: 1;
  }

  .detail-name {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 6px;
  }

  .detail-species {
    font-size: 16px;
    color: var(--color-text-light);
    margin-bottom: 12px;
  }

  .detail-meta {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    font-size: 13px;
    color: var(--color-text-light);
  }

  .detail-meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .detail-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .section-card {
    background: white;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-card);
    padding: 20px;
    animation: fadeInUp 0.5s ease-out both;
  }

  .section-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .log-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .log-action-btn {
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: var(--transition);
  }

  .log-action-btn.water {
    background: #e3f2fd;
    color: #1976d2;
  }

  .log-action-btn.water:hover {
    background: #bbdefb;
    transform: translateY(-2px);
  }

  .log-action-btn.fertilize {
    background: #e8f5e9;
    color: #388e3c;
  }

  .log-action-btn.fertilize:hover {
    background: #c8e6c9;
    transform: translateY(-2px);
  }

  .log-action-btn.repot {
    background: #efebe9;
    color: #6d4c41;
  }

  .log-action-btn.repot:hover {
    background: #d7ccc8;
    transform: translateY(-2px);
  }

  .log-action-btn.light {
    background: #fff8e1;
    color: #f57c00;
  }

  .log-action-btn.light:hover {
    background: #ffecb3;
    transform: translateY(-2px);
  }

  .logs-list {
    max-height: 500px;
    overflow-y: auto;
    padding-right: 8px;
  }

  .logs-list::-webkit-scrollbar {
    width: 6px;
  }

  .logs-list::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 3px;
  }

  .log-item {
    padding: 14px 16px;
    border-radius: 12px;
    margin-bottom: 10px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    animation: dropIn 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) both;
  }

  .log-item.water { background: var(--color-bg-water); }
  .log-item.fertilize { background: var(--color-bg-fertilize); }
  .log-item.repot { background: var(--color-bg-repot); }
  .log-item.light { background: var(--color-bg-light); }

  .log-icon {
    font-size: 24px;
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  }

  .log-content {
    flex: 1;
    min-width: 0;
  }

  .log-type {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 4px;
  }

  .log-time {
    font-size: 12px;
    color: var(--color-text-light);
  }

  .log-note {
    font-size: 13px;
    color: var(--color-text);
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dashed rgba(0,0,0,0.1);
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--color-text-light);
    font-size: 14px;
  }

  .heatmap-wrap {
    margin-bottom: 20px;
  }

  .heatmap-title {
    font-size: 13px;
    color: var(--color-text-light);
    margin-bottom: 8px;
  }

  .heatmap-grid {
    display: grid;
    grid-template-columns: repeat(15, 1fr);
    gap: 4px;
  }

  .heatmap-cell {
    aspect-ratio: 1;
    border-radius: 3px;
    transition: var(--transition);
    cursor: pointer;
  }

  .heatmap-cell:hover {
    transform: scale(1.2);
    z-index: 1;
  }

  .heatmap-legend {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    margin-top: 12px;
    font-size: 11px;
    color: var(--color-text-light);
  }

  .heatmap-legend .legend-cell {
    width: 14px;
    height: 14px;
    border-radius: 2px;
  }

  .heatmap-month-labels {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 11px;
    color: var(--color-text-light);
  }

  .care-summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 16px;
  }

  .care-summary-item {
    text-align: center;
    padding: 16px 12px;
    border-radius: 12px;
    background: #fafafa;
  }

  .care-summary-icon {
    font-size: 24px;
    margin-bottom: 6px;
  }

  .care-summary-count {
    font-size: 22px;
    font-weight: 700;
    color: var(--color-primary);
  }

  .care-summary-label {
    font-size: 12px;
    color: var(--color-text-light);
  }

  .recognize-section {
    margin-top: 20px;
  }

  .recognize-btn-wrap {
    display: flex;
    justify-content: center;
  }

  .hidden-input {
    display: none;
  }

  .recognition-history {
    margin-top: 16px;
  }

  .recognition-history-item {
    padding: 12px;
    border-radius: 10px;
    background: #fafafa;
    margin-bottom: 8px;
    cursor: pointer;
    transition: var(--transition);
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .recognition-history-item:hover {
    background: #f0f0f0;
    transform: translateX(4px);
  }

  .recognition-history-thumb {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .recognition-history-info {
    flex: 1;
    min-width: 0;
  }

  .recognition-history-disease {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
  }

  .recognition-history-time {
    font-size: 12px;
    color: var(--color-text-light);
  }

  @media (max-width: 768px) {
    .detail-header {
      flex-direction: column;
      text-align: center;
    }

    .detail-meta {
      justify-content: center;
    }

    .detail-content {
      grid-template-columns: 1fr;
    }

    .heatmap-grid {
      grid-template-columns: repeat(10, 1fr);
    }
  }
`;

const LOG_TYPE_CONFIG: Record<CareLogType, { icon: string; label: string }> = {
  water: { icon: '💧', label: '浇水' },
  fertilize: { icon: '🍃', label: '施肥' },
  repot: { icon: '🪴', label: '换盆' },
  light: { icon: '☀️', label: '光照' }
};

const PlantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [recognitions, setRecognitions] = useState<RecognitionResult[]>([]);
  const [newLogId, setNewLogId] = useState<string | null>(null);
  const [showRecognizeModal, setShowRecognizeModal] = useState(false);
  const [selectedRecognition, setSelectedRecognition] = useState<RecognitionResult | null>(null);
  const recognizeInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadPlantData();
    }
  }, [id]);

  useEffect(() => {
    if (selectedRecognition && canvasRef.current) {
      drawDiseaseRegions(selectedRecognition.imageUrl, selectedRecognition.diseaseRegions);
    }
  }, [selectedRecognition]);

  const loadPlantData = async () => {
    if (!id) return;
    try {
      const [plantData, logsData, recognitionsData] = await Promise.all([
        plantApi.get(id),
        logApi.getByPlant(id),
        recognitionApi.getByPlant(id)
      ]);
      setPlant(plantData);
      setLogs(logsData);
      setRecognitions(recognitionsData);
    } catch (e) {
      console.error('加载失败', e);
    }
  };

  const handleAddLog = async (type: CareLogType) => {
    if (!id) return;
    try {
      const newLog = await logApi.add(id, type);
      if (newLog) {
        setLogs(prev => [newLog, ...prev]);
        setNewLogId(newLog.id);
        if (logsListRef.current) {
          logsListRef.current.scrollTop = 0;
        }
        setTimeout(() => setNewLogId(null), 1000);
        loadPlantData();
      }
    } catch (e) {
      console.error('添加日志失败', e);
    }
  };

  const handleRecognize = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setShowRecognizeModal(true);
    setSelectedRecognition(null);

    try {
      const result = await recognitionApi.recognize(file, id);
      setSelectedRecognition(result);
      loadPlantData();
    } catch (e) {
      console.error('识别失败', e);
    }

    if (recognizeInputRef.current) {
      recognizeInputRef.current.value = '';
    }
  };

  const drawDiseaseRegions = (imageUrl: string, regions: DiseaseRegion[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
