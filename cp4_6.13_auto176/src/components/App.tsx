import React, { useState, useCallback } from 'react';
import ImageUploader from './ImageUploader';
import AnnotationCanvas, { TextBlock, Annotation as AnnotationType } from './AnnotationCanvas';
import ToolPanel, { Annotation } from './ToolPanel';

const App: React.FC = () => {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeTool, setActiveTool] = useState<'highlight' | 'underline' | 'strikethrough' | 'comment' | null>(null);
  const [selectedTextBlockId, setSelectedTextBlockId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [commentCounter, setCommentCounter] = useState(0);

  const handleUploadComplete = useCallback((data: {
    documentId: string;
    textBlocks: TextBlock[];
    imageUrl: string;
    imageWidth: number;
    imageHeight: number;
  }) => {
    setDocumentId(data.documentId);
    setImageUrl(data.imageUrl);
    setImageWidth(data.imageWidth);
    setImageHeight(data.imageHeight);
    setTextBlocks(data.textBlocks);
    setAnnotations([]);
    setActiveTool(null);
    setSelectedTextBlockId(null);
    setCommentCounter(0);
  }, []);

  const handleAnnotationAdd = useCallback((ann: Omit<AnnotationType, 'commentNumber'>) => {
    setAnnotations((prev) => {
      const existingIndex = prev.findIndex(
        (a) => a.textBlockId === ann.textBlockId && a.type === ann.type
      );

      if (ann.type === 'comment') {
        const newCommentNum = commentCounter + 1;
        setCommentCounter(newCommentNum);
        const newAnn: Annotation = {
          ...ann,
          commentNumber: newCommentNum,
          textPreview: ann.comment || '',
        };
        return [...prev, newAnn];
      }

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated.splice(existingIndex, 1);
        return updated;
      }

      const newAnn: Annotation = {
        ...ann,
        textPreview: textBlocks.find((b) => b.id === ann.textBlockId)?.text || '',
      };
      return [...prev, newAnn];
    });
  }, [commentCounter, textBlocks]);

  const handleTextBlockSelect = useCallback((textBlockId: string) => {
    setSelectedTextBlockId(textBlockId);
  }, []);

  const handleToolSelect = useCallback((tool: 'highlight' | 'underline' | 'strikethrough' | 'comment') => {
    setActiveTool((prev) => (prev === tool ? null : tool));
  }, []);

  const handleAnnotationClick = useCallback((annotation: Annotation) => {
    setSelectedTextBlockId(annotation.textBlockId);
  }, []);

  const handleExport = useCallback(async () => {
    if (!documentId || annotations.length === 0) {
      alert('请先添加标记再导出');
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          annotations,
        }),
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      const data = await response.json();
      if (data.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = `校稿结果_${documentId.slice(0, 8)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  }, [documentId, annotations]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e0e0e0',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>📝</span>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: '#2c3e50',
              margin: 0,
            }}
          >
            手写稿件校稿与批注工具
          </h1>
        </div>
        {imageUrl && (
          <button
            onClick={handleExport}
            disabled={isExporting}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: '#ffffff',
              border: 'none',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.3s',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
              fontFamily: 'inherit',
              opacity: isExporting ? 0.7 : 1,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {isExporting ? '生成中...' : '导出PDF'}
          </button>
        )}
      </header>

      <main style={{ flex: 1, padding: 24, display: 'flex' }}>
        {!imageUrl ? (
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ImageUploader onUploadComplete={handleUploadComplete} />
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              width: '100%',
              gap: 20,
              height: 'calc(100vh - 120px)',
            }}
          >
            <div
              style={{
                width: '65%',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <AnnotationCanvas
                imageUrl={imageUrl}
                imageWidth={imageWidth}
                imageHeight={imageHeight}
                textBlocks={textBlocks}
                annotations={annotations}
                activeTool={activeTool}
                onAnnotationAdd={handleAnnotationAdd}
                onTextBlockSelect={handleTextBlockSelect}
                selectedTextBlockId={selectedTextBlockId}
                nextCommentNumber={commentCounter + 1}
              />
            </div>

            <div style={{ width: '35%', minWidth: 250 }}>
              <ToolPanel
                activeTool={activeTool}
                onToolSelect={handleToolSelect}
                annotations={annotations}
                onAnnotationClick={handleAnnotationClick}
                onExport={handleExport}
                isExporting={isExporting}
              />
            </div>
          </div>
        )}
      </main>

      <style>{`
        @media (max-width: 768px) {
          main > div {
            flex-direction: column !important;
          }
          main > div > div:first-child {
            width: 100% !important;
          }
          main > div > div:last-child {
            width: 100% !important;
            min-width: auto !important;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
