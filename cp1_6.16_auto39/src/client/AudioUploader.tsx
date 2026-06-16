import { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import type { AudioClip } from './types';
import { saveClip, deleteClip, saveAudioFile } from './audioStore';

interface AudioUploaderProps {
  clips: AudioClip[];
  onClipAdded: (clip: AudioClip) => void;
  onClipDeleted: (clipId: string) => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

function AudioUploader({ clips, onClipAdded, onClipDeleted }: AudioUploaderProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioId, setAudioId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<{ start: number; end: number } | null>(null);
  const [clipName, setClipName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<any>(null);
  const activeRegionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (audioUrl && waveformRef.current) {
      setIsLoading(true);
      
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }

      const regions = RegionsPlugin.create();
      regionsRef.current = regions;

      const ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#533483',
        progressColor: '#0f3460',
        cursorColor: '#00d2ff',
        height: 120,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        responsive: true,
        plugins: [regions],
      });

      ws.load(audioUrl);

      ws.on('ready', () => {
        setIsLoading(false);
      });

      regions.on('region-created', (region: any) => {
        if (activeRegionRef.current && activeRegionRef.current !== region) {
          activeRegionRef.current.remove();
        }
        activeRegionRef.current = region;
        setSelectedRegion({ start: region.start, end: region.end });
      });

      regions.on('region-updated', (region: any) => {
        setSelectedRegion({ start: region.start, end: region.end });
      });

      wavesurferRef.current = ws;

      return () => {
        ws.destroy();
      };
    }
  }, [audioUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav'];
    if (!validTypes.includes(file.type)) {
      alert('只支持 MP3 和 WAV 格式的音频文件！');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('文件大小不能超过 50MB！');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('audio', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const data = await response.json();
      const newAudioId = data.audioId;
      setAudioId(newAudioId);
      setFileName(file.name);

      const url = URL.createObjectURL(file);
      setAudioUrl(url);

      await saveAudioFile(newAudioId, file);
    } catch (error) {
      console.error('Upload failed:', error);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setFileName(file.name);
      const fallbackId = `local_${Date.now()}`;
      setAudioId(fallbackId);
      await saveAudioFile(fallbackId, file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateClip = async () => {
    if (!selectedRegion || !audioId) return;

    const duration = selectedRegion.end - selectedRegion.start;
    if (duration < 0.1) {
      alert('片段时长太短！');
      return;
    }

    const name = clipName.trim() || `片段 ${clips.length + 1}`;

    const clip = await saveClip({
      name,
      audioId,
      fileName,
      startTime: selectedRegion.start,
      endTime: selectedRegion.end,
      duration,
    });

    onClipAdded(clip);
    setClipName('');
    setSelectedRegion(null);

    if (activeRegionRef.current) {
      activeRegionRef.current.remove();
      activeRegionRef.current = null;
    }
  };

  const handleDeleteClip = async (clipId: string) => {
    await deleteClip(clipId);
    onClipDeleted(clipId);
  };

  const handleWaveformClick = () => {
    if (!wavesurferRef.current || !regionsRef.current) return;

    const duration = wavesurferRef.current.getDuration();
    const currentTime = wavesurferRef.current.getCurrentTime();

    if (activeRegionRef.current) {
      activeRegionRef.current.remove();
    }

    const regionStart = Math.max(0, currentTime - 2);
    const regionEnd = Math.min(duration, currentTime + 2);

    const region = regionsRef.current.addRegion({
      start: regionStart,
      end: regionEnd,
      color: 'rgba(0, 210, 255, 0.3)',
      drag: true,
      resize: true,
    });

    activeRegionRef.current = region;
    setSelectedRegion({ start: regionStart, end: regionEnd });
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.uploadCard}>
          <h2 style={styles.cardTitle}>上传音频</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,audio/mpeg,audio/wav"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            style={styles.uploadButton}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.filter = 'brightness(1)';
            }}
          >
            {isUploading ? '上传中...' : '📁 选择音频文件 (MP3/WAV, ≤50MB)'}
          </button>

          {fileName && (
            <p style={styles.fileName}>当前文件: {fileName}</p>
          )}
        </div>

        <div style={styles.waveformCard}>
          <div style={styles.waveformHeader}>
            <h2 style={styles.cardTitle}>波形预览</h2>
            {audioUrl && (
              <div style={styles.timeDisplay}>
                <span>
                  选中: {selectedRegion
                    ? `${formatTime(selectedRegion.start)} - ${formatTime(selectedRegion.end)}`
                    : '点击波形选择区域'}
                </span>
                {selectedRegion && (
                  <span style={styles.durationBadge}>
                    时长: {formatTime(selectedRegion.end - selectedRegion.start)}
                  </span>
                )}
              </div>
            )}
          </div>

          <div style={styles.waveformWrapper}>
            {isLoading && <div style={styles.loading}>加载波形中...</div>}
            <div
              ref={waveformRef}
              style={{
                ...styles.waveform,
                cursor: audioUrl ? 'crosshair' : 'default',
              }}
              onClick={handleWaveformClick}
            />
          </div>

          {selectedRegion && (
            <div style={styles.clipForm}>
              <input
                type="text"
                placeholder="输入片段名称..."
                value={clipName}
                onChange={(e) => setClipName(e.target.value)}
                style={styles.clipInput}
              />
              <button
                style={styles.createButton}
                onClick={handleCreateClip}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.filter = 'brightness(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.filter = 'brightness(1)';
                }}
              >
                ✂️ 创建片段
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.clipsCard}>
          <h2 style={styles.cardTitle}>
            片段列表 ({clips.length})
          </h2>
          <div style={styles.clipsList}>
            {clips.length === 0 ? (
              <p style={styles.emptyText}>暂无片段，在波形上点击并拖动选择区域来创建片段</p>
            ) : (
              clips.map((clip) => (
                <div key={clip.id} style={styles.clipCard}>
                  <div style={styles.clipInfo}>
                    <div style={styles.clipName}>{clip.name}</div>
                    <div style={styles.clipMeta}>
                      <span>⏱ {formatTime(clip.duration)}</span>
                      <span style={styles.clipFile}>📄 {clip.fileName}</span>
                    </div>
                  </div>
                  <button
                    style={styles.deleteButton}
                    onClick={() => handleDeleteClip(clip.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.backgroundColor = '#c0392b';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.backgroundColor = '#e74c3c';
                    }}
                  >
                    🗑
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: '24px',
    height: 'calc(100vh - 120px)',
  },
  leftPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minWidth: 0,
  },
  rightPanel: {
    width: '360px',
    display: 'flex',
    flexDirection: 'column',
  },
  uploadCard: {
    backgroundColor: '#16213e',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
  },
  waveformCard: {
    backgroundColor: '#16213e',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  clipsCard: {
    backgroundColor: '#16213e',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#ffffff',
  },
  uploadButton: {
    width: '100%',
    padding: '16px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #0f3460, #533483)',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  fileName: {
    marginTop: '12px',
    color: '#8892b0',
    fontSize: '14px',
    wordBreak: 'break-all',
  },
  waveformHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  timeDisplay: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    fontSize: '14px',
    color: '#8892b0',
  },
  durationBadge: {
    backgroundColor: 'rgba(0, 210, 255, 0.2)',
    color: '#00d2ff',
    padding: '4px 12px',
    borderRadius: '4px',
    fontWeight: 500,
  },
  waveformWrapper: {
    position: 'relative',
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    padding: '16px',
    minHeight: '140px',
  },
  waveform: {
    width: '100%',
  },
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#8892b0',
    zIndex: 10,
  },
  clipForm: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
  },
  clipInput: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '8px',
    backgroundColor: '#0f172a',
    border: '1px solid #2a3f5f',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
  },
  createButton: {
    padding: '12px 24px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #00d2ff, #533483)',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
  },
  clipsList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  emptyText: {
    color: '#8892b0',
    textAlign: 'center',
    padding: '40px 0',
    fontSize: '14px',
    lineHeight: 1.6,
  },
  clipCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    border: '1px solid #2a3f5f',
    transition: 'all 0.2s ease',
  },
  clipInfo: {
    flex: 1,
    minWidth: 0,
  },
  clipName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '6px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  clipMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '12px',
    color: '#8892b0',
  },
  clipFile: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  deleteButton: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#e74c3c',
    color: '#ffffff',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '12px',
    transition: 'all 0.2s ease',
  },
};

export default AudioUploader;
