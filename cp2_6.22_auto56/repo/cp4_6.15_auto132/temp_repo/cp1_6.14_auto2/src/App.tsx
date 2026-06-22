import { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Editor } from './components/Editor';
import { VersionHistory } from './components/VersionHistory';
import { useDocumentSocket } from './hooks/useDocumentSocket';
import { FileText, Eye, Edit3 } from 'lucide-react';

function App() {
  const [initialDocId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('doc');
    if (fromUrl) return fromUrl;

    const stored = localStorage.getItem('collab-doc-id');
    if (stored) return stored;

    const newId = uuidv4().slice(0, 8);
    localStorage.setItem('collab-doc-id', newId);
    return newId;
  });

  const {
    docId,
    content,
    versions,
    connected,
    userCount,
    isRestoring,
    sendContentUpdate,
    saveVersion,
    restoreVersion,
  } = useDocumentSocket(initialDocId);

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const isReadOnly = selectedVersionId !== null;

  const displayContent = useMemo(() => {
    if (selectedVersionId) {
      const v = versions.find((ver) => ver.id === selectedVersionId);
      return v ? v.content : content;
    }
    return content;
  }, [selectedVersionId, versions, content]);

  useEffect(() => {
    if (selectedVersionId && !versions.find((v) => v.id === selectedVersionId)) {
      setSelectedVersionId(null);
    }
  }, [versions, selectedVersionId]);

  const handleEditorChange = (newContent: string) => {
    if (isReadOnly) return;
    sendContentUpdate(newContent);
  };

  const handleSaveVersion = async () => {
    await saveVersion();
  };

  const handleRestoreVersion = (versionId: string) => {
    restoreVersion(versionId);
    setSelectedVersionId(null);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <h1 className="text-white font-semibold text-lg">在线文档协作系统</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-slate-400">
            文档 ID: <code className="text-blue-400">{docId}</code>
          </span>
          {isReadOnly ? (
            <div className="flex items-center gap-1 text-xs text-amber-400">
              <Eye className="w-3.5 h-3.5" />
              <span>预览中</span>
              <button
                onClick={() => setSelectedVersionId(null)}
                className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                返回编辑
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-emerald-400">
              <Edit3 className="w-3.5 h-3.5" />
              <span>编辑模式</span>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <VersionHistory
          versions={versions}
          selectedVersionId={selectedVersionId}
          onSelectVersion={setSelectedVersionId}
          onRestoreVersion={handleRestoreVersion}
        />

        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 p-3 md:p-6 min-w-0">
          <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-xl shadow-2xl border border-slate-200">
            <Editor
              content={displayContent}
              readOnly={isReadOnly}
              connected={connected}
              userCount={userCount}
              isRestoring={isRestoring}
              onChange={handleEditorChange}
              onSave={handleSaveVersion}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
