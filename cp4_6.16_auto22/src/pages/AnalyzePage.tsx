import { useState, useCallback, useRef, useMemo } from 'react';
import { Upload, FileAudio, AlertCircle, Loader2, Sparkles, Music2 } from 'lucide-react';
import Timeline from '@/components/Timeline';
import Dashboard from '@/components/Dashboard';
import { useScriptStore } from '@/store/scriptStore';
import { getAudioDuration, analyzeAudio, formatDurationLong } from '@/utils/audioAnalyzer';
import { AudioAnalysisResult, SilenceDetectionMode, SilenceDetectionOptions } from '@/types';

interface AnalyzePageProps {
  embedded?: boolean;
}

const AnalyzePage = ({ embedded = false }: AnalyzePageProps) => {
  const segments = useScriptStore(s => s.segments);
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<SilenceDetectionMode>('hybrid');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedSegments = useMemo(() => {
    return [...segments].sort((a, b) => a.order - b.order);
  }, [segments]);

  const analysis = useMemo<AudioAnalysisResult | null>(() => {
    if (!file || !duration || sortedSegments.length === 0) return null;
    const options: SilenceDetectionOptions = { mode: analysisMode };
    return analyzeAudio(file, duration, sortedSegments, options);
  }, [file, duration, sortedSegments, analysisMode]);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav', 'audio/ogg'];
    const validExts = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
    const lowerName = selectedFile.name.toLowerCase();
    const isAudio = validTypes.includes(selectedFile.type) ||
      validExts.some(ext => lowerName.endsWith(ext));

    if (!isAudio) {
      setError('请上传 MP3 或 WAV 格式的音频文件');
      return;
    }

    setError(null);
    setFile(selectedFile);
    setDuration(null);
    setIsAnalyzing(true);

    try {
      const dur = await getAudioDuration(selectedFile);
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
      setDuration(dur);
    } catch (err) {
      setError('音频分析失败，请尝试其他文件');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
  }, [handleFileSelect]);

  const handleModeChange = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const mode = e.currentTarget.dataset.mode as SilenceDetectionMode;
    if (mode) setAnalysisMode(mode);
  }, []);

  const handleButtonMouseOver = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.borderColor = 'var(--color-accent)';
    e.currentTarget.style.color = 'var(--color-accent)';
  }, []);

  const handleButtonMouseOut = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.borderColor = 'var(--color-border)';
    e.currentTarget.style.color = 'var(--color-text-secondary)';
  }, []);

  const containerStyle = embedded
    ? { flex: 1, overflow: 'hidden', display: 'flex' as const, flexDirection: 'column' as const }
    : {
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column' as const,
        minHeight: 'calc(100vh - 160px)',
      };

  return (
    <div style={containerStyle}>
      <div style={{
        padding: embedded ? '16px 20px' : '20px 24px',
        borderBottom: '1px solid var(--color-border)',
        background: embedded ? 'transparent' : 'linear-gradient(180deg, rgba(155,135,245,0.08) 0%, transparent 100%)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 44, height: 44,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(155,135,245,0.2), rgba(0,206,209,0.2))',
              border: '1px solid rgba(155,135,245,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9B87F5',
            }}>
              <Music2 size={22} />
            </div>
            <div>
              <div style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#fff',
              }}>
                录音分析
              </div>
              <div style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-text-muted)',
              }}>
                上传音频 → 生成时间轴 → 分析节奏指标
              </div>
            </div>
          </div>

          {analysis && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '10px 16px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--color-border)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: 2,
                }}>音频时长</div>
                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: '#00CED1',
                }}>
                  {formatDurationLong(analysis.totalDuration)}
                </div>
              </div>
              <div style={{ width: 1, height: 28, background: 'var(--color-border)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: 2,
                }}>分段数</div>
                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: '#9B87F5',
                }}>
                  {analysis.timeline.length}
                </div>
              </div>
              <div style={{ width: 1, height: 28, background: 'var(--color-border)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: 2,
                }}>超时</div>
                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: analysis.timeline.filter(t => t.isOverBudget).length > 0
                    ? 'var(--color-over-budget)'
                    : '#00CED1',
                }}>
                  {analysis.timeline.filter(t => t.isOverBudget).length} 段
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: embedded ? '16px 20px' : '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {!file || segments.length === 0 ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadClick}
            style={{
              padding: '48px 32px',
              borderRadius: 'var(--radius-xl)',
              border: '2px dashed ' + (isDragging ? 'var(--color-accent)' : 'var(--color-border)'),
              background: isDragging
                ? 'rgba(233,69,96,0.06)'
                : 'linear-gradient(180deg, rgba(26,26,46,0.5) 0%, rgba(22,33,62,0.5) 100%)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'var(--transition-base)',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.ogg,.m4a,.aac,audio/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div style={{
              width: 72, height: 72,
              margin: '0 auto 20px',
              borderRadius: '50%',
              background: isDragging
                ? 'linear-gradient(135deg, rgba(233,69,96,0.25), rgba(255,85,114,0.25))'
                : 'linear-gradient(135deg, rgba(155,135,245,0.15), rgba(0,206,209,0.15))',
              border: '2px solid ' + (isDragging ? 'rgba(233,69,96,0.5)' : 'rgba(155,135,245,0.3)'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDragging ? 'var(--color-accent)' : '#9B87F5',
              transition: 'var(--transition-base)',
            }}>
              {isDragging ? <Upload size={32} /> : <FileAudio size={32} />}
            </div>
            <h3 style={{
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 8,
              color: '#fff',
            }}>
              {isDragging ? '松开以上传文件' : '上传你的录音文件'}
            </h3>
            <p style={{
              fontSize: 13,
              color: 'var(--color-text-muted)',
              marginBottom: 16,
              lineHeight: 1.7,
              maxWidth: 480,
              margin: '0 auto 16px',
            }}>
              {segments.length === 0 && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 12px',
                  borderRadius: 999,
                  background: 'rgba(255,165,0,0.12)',
                  border: '1px solid rgba(255,165,0,0.3)',
                  color: 'var(--color-indicator)',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  marginRight: 8,
                  marginBottom: 8,
                }}>
                  <AlertCircle size={12} /> 请先在左侧创建脚本段落
                </span>
              )}
              点击此处或拖拽文件到这个区域。支持 MP3、WAV、OGG、M4A 格式。
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              background: segments.length === 0
                ? 'rgba(255,255,255,0.03)'
                : 'linear-gradient(135deg, #9B87F5 0%, #00CED1 100%)',
              color: segments.length === 0 ? 'var(--color-text-muted)' : '#fff',
              fontSize: 13,
              fontWeight: segments.length === 0 ? 400 : 600,
              pointerEvents: segments.length === 0 ? 'none' : 'auto',
              opacity: segments.length === 0 ? 0.6 : 1,
              transition: 'var(--transition-base)',
            }}>
              {segments.length === 0 ? (
                <><AlertCircle size={16} /> 等待脚本就绪</>
              ) : (
                <><Upload size={16} /> 选择音频文件</>
              )}
            </div>
            <p style={{
              marginTop: 16,
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
              opacity: 0.6,
            }}>
              推荐：5分钟以内音频，首屏渲染控制在2秒内
            </p>
          </div>
        ) : null}

        {file && (
          <div style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(0,206,209,0.06)',
            border: '1px solid rgba(0,206,209,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
          }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0,206,209,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00CED1',
              flexShrink: 0,
            }}>
              <FileAudio size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {file.name}
              </div>
              <div style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-text-muted)',
                marginTop: 2,
              }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
                {analysis && ` · ${formatDurationLong(analysis.totalDuration)}`}
              </div>
            </div>
            {isAnalyzing ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(233,69,96,0.12)',
                border: '1px solid rgba(233,69,96,0.3)',
                color: 'var(--color-accent)',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                智能分析中...
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : analysis ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(0,206,209,0.12)',
                border: '1px solid rgba(0,206,209,0.3)',
                color: '#00CED1',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}>
                <Sparkles size={14} /> 分析完成
              </div>
            ) : null}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 0,
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              border: '1px solid var(--color-border)',
            }}>
              {(['silence', 'interval', 'hybrid'] as SilenceDetectionMode[]).map((mode) => (
                <button
                  key={mode}
                  data-mode={mode}
                  onClick={handleModeChange}
                  style={{
                    padding: '8px 14px',
                    border: 'none',
                    background: analysisMode === mode
                      ? 'linear-gradient(135deg, #9B87F5 0%, #7B68EE 100%)'
                      : 'transparent',
                    color: analysisMode === mode ? '#fff' : 'var(--color-text-secondary)',
                    fontSize: 11,
                    cursor: 'pointer',
                    transition: 'var(--transition-base)',
                    borderRight: mode !== 'hybrid' ? '1px solid var(--color-border)' : 'none',
                    fontWeight: analysisMode === mode ? 600 : 400,
                  }}
                >
                  {mode === 'silence' ? '静音检测' : mode === 'interval' ? '固定间隔' : '智能混合'}
                </button>
              ))}
            </div>
            <button
              onClick={handleUploadClick}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--color-text-secondary)',
                fontSize: 11,
                cursor: 'pointer',
                transition: 'var(--transition-base)',
              }}
              onMouseOver={handleButtonMouseOver}
              onMouseOut={handleButtonMouseOut}
            >
              更换文件
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.ogg,.m4a,.aac,audio/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        )}

        {error && (
          <div style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(255,68,68,0.08)',
            border: '1px solid rgba(255,68,68,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--color-over-budget)',
            fontSize: 13,
          }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {!isAnalyzing && analysis && (
          <>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <div style={{
                    width: 3, height: 18,
                    borderRadius: 2,
                    background: 'linear-gradient(180deg, #9B87F5, #00CED1)',
                  }} />
                  <h4 style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#fff',
                  }}>
                    时间轴对比分析
                  </h4>
                </div>
                <span style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-muted)',
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.03)',
                }}>
                  预期 vs 实际 · 可水平滚动
                </span>
              </div>
              <Timeline
                segments={analysis.timeline}
                totalDuration={analysis.totalDuration}
              />
            </div>

            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <div style={{
                    width: 3, height: 18,
                    borderRadius: 2,
                    background: 'linear-gradient(180deg, var(--color-accent), #FFA500)',
                  }} />
                  <h4 style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#fff',
                  }}>
                    节奏仪表盘
                  </h4>
                </div>
                <span style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-muted)',
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}>
                  <Sparkles size={10} style={{ color: '#FFA500' }} />
                  基于脚本内容智能估算
                </span>
              </div>
              <Dashboard metrics={analysis.metrics} />
            </div>
          </>
        )}

        {isAnalyzing && (
          <div style={{
            padding: '60px 24px',
            textAlign: 'center',
          }}>
            <div style={{
              width: 64, height: 64,
              margin: '0 auto 20px',
              borderRadius: '50%',
              border: '3px solid rgba(155,135,245,0.2)',
              borderTopColor: 'var(--color-accent)',
              animation: 'spin 0.8s linear infinite',
            }} />
            <h4 style={{
              fontSize: 16,
              marginBottom: 8,
              color: '#fff',
            }}>
              正在分析录音数据...
            </h4>
            <p style={{
              fontSize: 12,
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-mono)',
            }}>
              提取音频元数据 → 生成时间轴分段 → 计算节奏指标
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyzePage;
