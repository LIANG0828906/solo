import React, { useState, useMemo, useEffect } from 'react';
import { X, Check, FolderOpen } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { OrganizeSuggestion } from '@/types';

const OrganizerPanel: React.FC = () => {
  const visible = useStore((state) => state.organizerPanelVisible);
  const setVisible = useStore((state) => state.setOrganizerPanelVisible);
  const generateOrganizeSuggestions = useStore(
    (state) => state.generateOrganizeSuggestions
  );
  const applyOrganizeSuggestions = useStore(
    (state) => state.applyOrganizeSuggestions
  );
  const icons = useStore((state) => state.icons);

  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(
    new Set()
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const suggestions = useMemo(() => {
    return generateOrganizeSuggestions();
  }, [icons, generateOrganizeSuggestions]);

  useEffect(() => {
    if (visible) {
      setIsAnalyzing(true);
      const timer = setTimeout(() => {
        setIsAnalyzing(false);
        setSelectedSuggestions(new Set(suggestions.map((s) => s.folderName)));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [visible, suggestions]);

  const toggleSuggestion = (folderName: string) => {
    setSelectedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(folderName)) {
        next.delete(folderName);
      } else {
        next.add(folderName);
      }
      return next;
    });
  };

  const handleApply = () => {
    const selected = suggestions.filter((s) =>
      selectedSuggestions.has(s.folderName)
    );
    if (selected.length > 0) {
      applyOrganizeSuggestions(selected);
    }
    setVisible(false);
  };

  const getIconLabel = (iconId: string) => {
    const icon = icons.find((i) => i.id === iconId);
    return icon?.label || icon?.name || '未知';
  };

  if (!visible) return null;

  return (
    <div className="organizer-panel">
      <div className="organizer-header">
        <div>
          <div className="organizer-title">自动归类助手</div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              marginTop: '4px',
            }}
          >
            {isAnalyzing
              ? '正在分析桌面图标...'
              : `发现 ${suggestions.length} 个归类建议`}
          </div>
        </div>
        <div className="organizer-close" onClick={() => setVisible(false)}>
          <X size={18} />
        </div>
      </div>

      {isAnalyzing ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--color-app)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <div>智能分析中...</div>
        </div>
      ) : suggestions.length === 0 ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          <FolderOpen
            size={48}
            style={{ margin: '0 auto 16px', opacity: 0.5 }}
          />
          <div>桌面很整洁，无需归类</div>
        </div>
      ) : (
        <>
          {suggestions.map((suggestion) => (
            <div key={suggestion.folderName} className="organizer-suggestion">
              <div className="suggestion-header">
                <div
                  className={`suggestion-checkbox ${selectedSuggestions.has(suggestion.folderName) ? 'checked' : ''}`}
                  onClick={() => toggleSuggestion(suggestion.folderName)}
                >
                  {selectedSuggestions.has(suggestion.folderName) && (
                    <Check size={14} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="suggestion-folder">
                    「{suggestion.folderName}」文件夹
                  </div>
                  <div className="suggestion-reason">{suggestion.reason}</div>
                </div>
              </div>
              <div className="suggestion-icons">
                {suggestion.iconIds.slice(0, 4).map((iconId) => (
                  <span
                    key={iconId}
                    className="suggestion-icon-tag"
                    title={getIconLabel(iconId)}
                  >
                    {getIconLabel(iconId).substring(0, 6)}
                  </span>
                ))}
                {suggestion.iconIds.length > 4 && (
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      padding: '4px 8px',
                    }}
                  >
                    +{suggestion.iconIds.length - 4} 更多
                  </span>
                )}
              </div>
            </div>
          ))}

          <div className="organizer-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setVisible(false)}
            >
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={handleApply}
              disabled={selectedSuggestions.size === 0}
            >
              应用 {selectedSuggestions.size} 项归类
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OrganizerPanel;
