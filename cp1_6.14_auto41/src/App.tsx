import React, { useState, useRef, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Download, Upload, FileJson } from 'lucide-react';
import DialogueEditor from './components/DialogueEditor';
import PreviewPanel from './components/PreviewPanel';
import type { Character, DialogueNode, Connection, DialogueTree } from './types';
import { DEFAULT_TREE } from './types';
import {
  exportToJson,
  downloadJsonFile,
  readJsonFile,
  autoLayoutNodes,
} from './utils/exportImport';

const App: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>(DEFAULT_TREE.characters);
  const [nodes, setNodes] = useState<DialogueNode[]>(DEFAULT_TREE.nodes);
  const [connections, setConnections] = useState<Connection[]>(DEFAULT_TREE.connections);
  const [rootNodeId, setRootNodeId] = useState<string | null>(DEFAULT_TREE.rootNodeId);

  const [editorWidth, setEditorWidth] = useState(60);
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingDivider(true);
  }, []);

  useEffect(() => {
    if (!isDraggingDivider) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(25, Math.min(75, (x / rect.width) * 100));
      setEditorWidth(pct);
    };

    const handleMouseUp = () => {
      setIsDraggingDivider(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingDivider]);

  const handleExport = useCallback(() => {
    const tree: DialogueTree = { characters, nodes, connections, rootNodeId };
    const json = exportToJson(tree);
    downloadJsonFile(json, `dialogue-tree-${Date.now()}.json`);
  }, [characters, nodes, connections, rootNodeId]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const tree = await readJsonFile(file);
        setCharacters(tree.characters);
        const containerWidth = 1600;
        const containerHeight = 900;
        const laidOut = autoLayoutNodes(tree, containerWidth, containerHeight);
        setNodes(laidOut);
        setConnections(tree.connections);
        setRootNodeId(tree.rootNodeId);
      } catch (err) {
        alert('导入失败：' + (err instanceof Error ? err.message : '未知错误'));
      } finally {
        e.target.value = '';
      }
    },
    []
  );

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="app-shell">
              <header className="app-header">
                <div className="app-title">🎭 角色对话脚本生成器</div>
                <div className="header-actions">
                  <button className="btn" onClick={handleImportClick}>
                    <Upload size={14} />
                    导入 JSON
                  </button>
                  <button className="btn btn-primary" onClick={handleExport}>
                    <Download size={14} />
                    导出 JSON
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden-file-input"
                    onChange={handleImportFile}
                  />
                </div>
              </header>

              <div className="split-container" ref={containerRef}>
                <div
                  className="editor-pane"
                  style={{ width: `${editorWidth}%` }}
                >
                  <DialogueEditor
                    characters={characters}
                    nodes={nodes}
                    connections={connections}
                    rootNodeId={rootNodeId}
                    onCharactersChange={setCharacters}
                    onNodesChange={setNodes}
                    onConnectionsChange={setConnections}
                    onRootNodeIdChange={setRootNodeId}
                  />
                </div>

                <div
                  className={`divider ${isDraggingDivider ? 'dragging' : ''}`}
                  onMouseDown={handleDividerMouseDown}
                />

                <div
                  className="preview-pane"
                  style={{ width: `${100 - editorWidth}%` }}
                >
                  <PreviewPanel
                    characters={characters}
                    nodes={nodes}
                    connections={connections}
                    rootNodeId={rootNodeId}
                  />
                </div>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
