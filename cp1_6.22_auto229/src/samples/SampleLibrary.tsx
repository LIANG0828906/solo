import React, { useState, useEffect, useRef } from 'react';
import { Search, Upload, Music } from 'lucide-react';
import { sampleManager } from './SampleManager';
import { SampleCard } from './SampleCard';
import { Button } from '../components/Button';
import type { Sample } from '../types';
import { SAMPLE_PANEL_WIDTH } from '../types';

interface SampleLibraryProps {
  onSampleDragStart: (sample: Sample) => void;
}

export const SampleLibrary: React.FC<SampleLibraryProps> = ({ onSampleDragStart }) => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | Sample['category']>('all');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadSamples = async () => {
      setIsLoading(true);
      const loadedSamples = await sampleManager.fetchSamples();
      setSamples(loadedSamples);
      setIsLoading(false);
    };

    loadSamples();

    const unsubscribe = sampleManager.subscribe(() => {
      setSamples(sampleManager.getSamples());
    });

    return unsubscribe;
  }, []);

  const filteredSamples = React.useMemo(() => {
    let result = samples;

    if (searchQuery) {
      result = sampleManager.searchSamples(searchQuery);
    }

    if (categoryFilter !== 'all') {
      result = result.filter((s) => s.category === categoryFilter);
    }

    return result;
  }, [samples, searchQuery, categoryFilter]);

  const handlePreview = (sample: Sample) => {
    if (previewingId === sample.id) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
      setPreviewingId(null);
      return;
    }

    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }

    const audio = new Audio(sample.url);
    audio.onended = () => {
      setPreviewingId(null);
      audioPreviewRef.current = null;
    };
    audio.play().catch((e) => console.error('Preview failed:', e));
    audioPreviewRef.current = audio;
    setPreviewingId(sample.id);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('audio/')) {
        continue;
      }

      const name = file.name.replace(/\.[^/.]+$/, '');
      await sampleManager.uploadSample(file, name, 'other');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const categories: { value: 'all' | Sample['category']; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'drum', label: '鼓' },
    { value: 'vocal', label: '人声' },
    { value: 'effect', label: '音效' },
    { value: 'other', label: '其他' },
  ];

  const panelStyle: React.CSSProperties = {
    width: `${SAMPLE_PANEL_WIDTH}px`,
    backgroundColor: 'var(--color-bg-secondary)',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px',
    borderBottom: '1px solid var(--color-border)',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  };

  const searchContainerStyle: React.CSSProperties = {
    position: 'relative',
    marginBottom: '12px',
  };

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px 8px 32px',
    backgroundColor: 'var(--color-bg-primary)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    color: 'var(--color-text)',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  };

  const searchIconStyle: React.CSSProperties = {
    position: 'absolute',
    left: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--color-text-muted)',
    pointerEvents: 'none',
  };

  const categoryTabsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  };

  const categoryTabStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 10px',
    fontSize: '11px',
    borderRadius: '6px',
    backgroundColor: active ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
    color: active ? 'var(--color-white)' : 'var(--color-text-muted)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
  });

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 140px)',
    gap: '10px',
    justifyContent: 'center',
  };

  const emptyStateStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
    color: 'var(--color-text-muted)',
  };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>
          <Music size={18} />
          样本库
        </h3>

        <div style={searchContainerStyle}>
          <Search size={16} style={searchIconStyle} />
          <input
            type="text"
            placeholder="搜索样本..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />
        </div>

        <div style={categoryTabsStyle}>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              style={categoryTabStyle(categoryFilter === cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <Button onClick={handleUploadClick} size="sm" variant="primary" style={{ width: '100%' }}>
          <Upload size={14} /> 上传音频
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      <div style={contentStyle}>
        {isLoading ? (
          <div style={emptyStateStyle}>
            <div style={{ animation: 'pulse 1s ease-in-out infinite' }}>加载中...</div>
          </div>
        ) : filteredSamples.length === 0 ? (
          <div style={emptyStateStyle}>
            <Music size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <div style={{ fontSize: '13px', marginBottom: '4px' }}>暂无样本</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              点击上传添加音频样本
            </div>
          </div>
        ) : (
          <div style={gridStyle}>
            {filteredSamples.map((sample) => (
              <SampleCard
                key={sample.id}
                sample={sample}
                onDragStart={onSampleDragStart}
                onPreview={handlePreview}
                isPreviewing={previewingId === sample.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
