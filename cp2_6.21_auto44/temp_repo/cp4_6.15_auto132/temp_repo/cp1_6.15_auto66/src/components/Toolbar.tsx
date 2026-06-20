import { useRef } from 'react';
import {
  Upload,
  Save,
  DownloadCloud,
  Share2,
  List,
  MessageSquare,
  Music4,
  Lock,
  Hourglass,
} from 'lucide-react';
import '../styles.css';

interface ToolbarProps {
  onImport: () => void;
  onSave: () => void;
  onExport: () => void;
  onShare: () => void;
  onTogglePresets: () => void;
  onToggleComments: () => void;
  isSaving: boolean;
  presetCount: number;
  commentCount: number;
  readOnly: boolean;
}

const Toolbar = ({
  onImport,
  onSave,
  onExport,
  onShare,
  onTogglePresets,
  onToggleComments,
  isSaving,
  presetCount,
  commentCount,
  readOnly,
}: ToolbarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    if (readOnly) return;
    fileInputRef.current?.click();
    onImport();
  };

  return (
    <div
      style={{
        height: 64,
        display: 'flex',
        flexDirection: 'row',
        padding: '0 24px',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(90deg, var(--accent-start), var(--accent-end))',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".mp3,.wav,audio/*"
        style={{ display: 'none' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Music4 size={22} color="#ffffff" />
        </div>
        <span
          style={{
            color: '#ffffff',
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          AudioMix Studio
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
        <button
          className="btn"
          onClick={handleImportClick}
          disabled={readOnly}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: readOnly ? 0.5 : 1,
            cursor: readOnly ? 'not-allowed' : 'pointer',
          }}
        >
          <Upload size={16} />
          <span>导入</span>
        </button>

        <button
          className={`btn ${isSaving ? 'btn-saving' : ''}`}
          onClick={onSave}
          disabled={readOnly || isSaving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: readOnly ? 0.5 : 1,
            cursor: readOnly || isSaving ? 'not-allowed' : 'pointer',
          }}
        >
          {isSaving ? (
            <Hourglass size={16} />
          ) : (
            <>
              <Save size={16} />
              <span>保存</span>
            </>
          )}
        </button>

        <button
          className="btn"
          onClick={onExport}
          disabled={readOnly}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: readOnly ? 0.5 : 1,
            cursor: readOnly ? 'not-allowed' : 'pointer',
          }}
        >
          <DownloadCloud size={16} />
          <span>导出</span>
        </button>

        <button
          className="btn"
          onClick={onShare}
          disabled={readOnly}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: readOnly ? 0.5 : 1,
            cursor: readOnly ? 'not-allowed' : 'pointer',
          }}
        >
          <Share2 size={16} />
          <span>分享</span>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          className="glass"
          onClick={onTogglePresets}
          disabled={readOnly}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: readOnly ? 'not-allowed' : 'pointer',
            position: 'relative',
            color: '#ffffff',
            opacity: readOnly ? 0.5 : 1,
          }}
        >
          <List size={18} />
          {presetCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                background: '#ef4444',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
              }}
            >
              {presetCount > 99 ? '99+' : presetCount}
            </span>
          )}
        </button>

        <button
          className="glass"
          onClick={onToggleComments}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            color: '#ffffff',
          }}
        >
          <MessageSquare size={18} />
          {commentCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                background: '#ef4444',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
              }}
            >
              {commentCount > 99 ? '99+' : commentCount}
            </span>
          )}
        </button>

        {readOnly && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 8,
              opacity: 0.9,
              background: 'rgba(255,255,255,0.05)',
            }}
          >
            <Lock size={14} color="#ffffff" />
            <span
              style={{
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              只读模式
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
