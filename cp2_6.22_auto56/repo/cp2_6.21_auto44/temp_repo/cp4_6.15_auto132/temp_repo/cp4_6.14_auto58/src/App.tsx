import { useState, useEffect, useCallback } from 'react';
import Editor from './components/Editor';
import CommentPanel from './components/CommentPanel';
import VersionHistory from './components/VersionHistory';
import VersionDiffModal from './components/VersionDiffModal';
import {
  getDocument,
  updateDocument,
  getComments,
  createComment,
  addReply,
  resolveComment,
  getVersions,
  saveVersion,
  getDiff,
} from './api';
import type { Document as DocType, Comment, Version, DiffSegment } from './types';

const USERNAME_KEY = 'auto58_username';

function App() {
  const [document, setDocument] = useState<DocType | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [username, setUsername] = useState<string>(() => {
    const saved = localStorage.getItem(USERNAME_KEY);
    return saved || 'user1';
  });
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [diffSegments, setDiffSegments] = useState<DiffSegment[]>([]);
  const [diffBaseVersion, setDiffBaseVersion] = useState<string>('');
  const [diffTargetVersion, setDiffTargetVersion] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [doc, commentsData, versionsData] = await Promise.all([
        getDocument(),
        getComments(),
        getVersions(),
      ]);
      setDocument(doc);
      setComments(commentsData);
      setVersions(versionsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    localStorage.setItem(USERNAME_KEY, username);
  }, [username]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document && username) {
        handleSaveVersion('自动保存');
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [document, username]);

  const handleContentChange = async (content: string, plainText: string) => {
    if (!document) return;
    try {
      const updated = await updateDocument(content, plainText, username);
      setDocument(updated);
    } catch (error) {
      console.error('Failed to update document:', error);
    }
  };

  const handleCreateComment = async (
    text: string,
    startOffset: number,
    endOffset: number,
    content: string
  ) => {
    try {
      const newComment = await createComment({
        text,
        startOffset,
        endOffset,
        content,
        author: username,
      });
      setComments((prev) => [...prev, newComment]);
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const handleAddReply = async (commentId: string, content: string) => {
    try {
      const reply = await addReply(commentId, content, username);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, replies: [...c.replies, reply] }
            : c
        )
      );
    } catch (error) {
      console.error('Failed to add reply:', error);
    }
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      const updated = await resolveComment(commentId, username);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? updated : c)
      );
    } catch (error) {
      console.error('Failed to resolve comment:', error);
    }
  };

  const handleSaveVersion = async (description?: string) => {
    try {
      const newVersion = await saveVersion(username, description);
      setVersions((prev) => [newVersion, ...prev]);
    } catch (error) {
      console.error('Failed to save version:', error);
    }
  };

  const handleCompareVersions = async (baseId: string, targetId: string) => {
    try {
      const result = await getDiff(baseId, targetId);
      const baseVer = versions.find((v) => v.id === baseId);
      const targetVer = versions.find((v) => v.id === targetId);
      setDiffSegments(result.diff);
      setDiffBaseVersion(baseVer ? `v${baseVer.version}` : '');
      setDiffTargetVersion(targetVer ? `v${targetVer.version}` : '');
      setDiffModalOpen(true);
    } catch (error) {
      console.error('Failed to get diff:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-sky-50">
        <div className="text-gray-600 text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-sky-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">
            协作文档编辑器
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">用户名:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
              onClick={() => handleSaveVersion()}
            >
              保存版本
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex p-6 gap-6 overflow-hidden">
        <div className="w-3/4 h-full">
          {document && (
            <Editor
              content={document.content}
              plainText={document.plainText}
              comments={comments}
              selectedCommentId={selectedCommentId}
              onContentChange={handleContentChange}
              onSelectComment={setSelectedCommentId}
              onCreateComment={handleCreateComment}
            />
          )}
        </div>

        <div className="w-1/4 h-full flex flex-col gap-4">
          <div className="h-1/2">
            <CommentPanel
              comments={comments}
              selectedCommentId={selectedCommentId}
              currentUser={username}
              onSelectComment={setSelectedCommentId}
              onAddReply={handleAddReply}
              onResolveComment={handleResolveComment}
            />
          </div>
          <div className="h-1/2">
            <VersionHistory
              versions={versions}
              onCompare={handleCompareVersions}
              onSaveVersion={handleSaveVersion}
            />
          </div>
        </div>
      </main>

      <VersionDiffModal
        isOpen={diffModalOpen}
        onClose={() => setDiffModalOpen(false)}
        diffs={diffSegments}
        baseVersion={diffBaseVersion}
        targetVersion={diffTargetVersion}
      />
    </div>
  );
}

export default App;
