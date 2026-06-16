import React, { useRef, useEffect } from 'react';
import { Play, Square, Download, Trash2 } from 'lucide-react';
import type { RecordingItem } from './audioEngine';

interface RecordingListProps {
  recordings: RecordingItem[];
  currentPlayingId: string | null;
  originalBuffer: AudioBuffer | null;
  onPlayRecording: (id: string) => void;
  onStopRecording: (id: string) => void;
  onDeleteRecording: (id: string) => void;
  onDownload: (recording: RecordingItem) => void;
  audioEngine: any;
}

const MiniWaveform: React.FC<{
  buffer: AudioBuffer;
  color: string;
  width?: number;
  height?: number;
}> = ({ buffer, color, width = 200, height = 40 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0D1117';
    ctx.fillRect(0, 0, width, height);

    const channelData = buffer.getChannelData(0);
    const samplesPerPixel = Math.floor(channelData.length / width);
    const centerY = height / 2;

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.8;

    for (let x = 0; x < width; x++) {
      const startSample = x * samplesPerPixel;
      const endSample = Math.min(startSample + samplesPerPixel, channelData.length);

      let min = 1;
      let max = -1;

      for (let i = startSample; i < endSample; i++) {
        const sample = channelData[i];
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }

      const yMin = centerY + min * (height / 2) * 0.8;
      const yMax = centerY + max * (height / 2) * 0.8;

      ctx.fillRect(x, yMax, 1, yMin - yMax || 1);
    }

    ctx.globalAlpha = 1;
  }, [buffer, color, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: '4px',
        display: 'block',
      }}
    />
  );
};

const RecordingList: React.FC<RecordingListProps> = ({
  recordings,
  currentPlayingId,
  originalBuffer,
  onPlayRecording,
  onStopRecording,
  onDeleteRecording,
  onDownload,
  audioEngine,
}) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      backgroundColor: '#1A202C',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #2D3748',
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 600,
        color: '#E2E8F0',
        margin: '0 0 16px 0',
        flexShrink: 0,
      }}>
        录音列表
        <span style={{
          fontSize: '13px',
          fontWeight: 400,
          color: '#9CA3AF',
          marginLeft: '8px',
        }}>
          ({recordings.length})
        </span>
      </h3>

      {originalBuffer && (
        <div style={{
          backgroundColor: '#0D1117',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '12px',
          border: '1px solid #2D3748',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <span style={{
              fontSize: '13px',
              color: '#FFFFFF',
              fontWeight: 500,
            }}>
              🎵 原文件
            </span>
            <span style={{
              fontSize: '12px',
              color: '#9CA3AF',
            }}>
              {formatDuration(originalBuffer.duration)}
            </span>
          </div>
          <MiniWaveform
            buffer={originalBuffer}
            color="#FFFFFF"
            width={220}
            height={36}
          />
        </div>
      )}

      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        marginRight: '-8px',
        paddingRight: '8px',
      }}>
        {recordings.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#6B7280',
            fontSize: '13px',
            padding: '30px 0',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎙️</div>
            <div>暂无录音</div>
            <div style={{ marginTop: '4px', fontSize: '12px' }}>
              点击红色按钮开始录音
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recordings.map((recording) => (
              <div
                key={recording.id}
                style={{
                  backgroundColor: '#0D1117',
                  borderRadius: '8px',
                  padding: '12px',
                  border: `1px solid ${currentPlayingId === recording.id ? '#FF6B35' : '#2D3748'}`,
                  transition: 'border-color 0.2s',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}>
                  <span style={{
                    fontSize: '13px',
                    color: '#FF6B35',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}>
                    {recording.name}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: '#9CA3AF',
                    flexShrink: 0,
                  }}>
                    {formatDuration(recording.duration)}
                  </span>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <MiniWaveform
                    buffer={recording.buffer}
                    color="#FF6B35"
                    width={220}
                    height={36}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  gap: '8px',
                }}>
                  <button
                    onClick={() => {
                      if (currentPlayingId === recording.id) {
                        onStopRecording(recording.id);
                      } else {
                        onPlayRecording(recording.id);
                      }
                    }}
                    style={{
                      flex: 1,
                      height: '32px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: currentPlayingId === recording.id ? '#6B7280' : '#FF6B35',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      transition: 'background-color 0.2s, transform 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {currentPlayingId === recording.id ? (
                      <><Square size={14} /> 停止</>
                    ) : (
                      <><Play size={14} /> 播放</>
                    )}
                  </button>

                  <button
                    onClick={() => onDownload(recording)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#2D3748',
                      color: '#E2E8F0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#3D4A5C';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#2D3748';
                    }}
                    title="下载"
                  >
                    <Download size={14} />
                  </button>

                  <button
                    onClick={() => onDeleteRecording(recording.id)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#2D3748',
                      color: '#9CA3AF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s, color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#4A1F1F';
                      e.currentTarget.style.color = '#FF6B6B';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#2D3748';
                      e.currentTarget.style.color = '#9CA3AF';
                    }}
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #0D1117;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb {
          background: #2D3748;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #3D4A5C;
        }
      `}</style>
    </div>
  );
};

export default RecordingList;
