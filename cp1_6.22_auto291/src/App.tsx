import React, { useState, useMemo, useCallback } from 'react';
import { ReactFlowProvider } from 'react-flow-renderer';
import FileManager from './FileManager';
import GenealogyGraph from './GenealogyGraph';
import DetailPanel from './DetailPanel';
import { mockFiles, getRandomMockFile, FileItem } from './fileData';
import {
  analyzeGenealogy,
  findOriginalSource,
  findAllDescendants,
  findAllAncestors,
  GenealogyNode,
  GenealogyEdge,
} from './FileGenealogy';

const App: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string> | null>(null);

  const genealogyResult = useMemo(() => {
    const fileContents = files.map(f => ({
      id: f.id,
      content: f.content,
      timestamp: f.timestamp,
    }));
    return analyzeGenealogy(fileContents);
  }, [files]);

  const { nodes: genealogyNodes, edges: genealogyEdges } = genealogyResult;

  const fileMap = useMemo(() => {
    const map = new Map<string, FileItem>();
    files.forEach(f => map.set(f.id, f));
    return map;
  }, [files]);

  const selectedFile = useMemo(() => {
    if (!selectedFileId) return null;
    return fileMap.get(selectedFileId) || null;
  }, [selectedFileId, fileMap]);

  const originalSource = useMemo(() => {
    if (!selectedFileId) return null;
    const sourceId = findOriginalSource(selectedFileId, genealogyEdges);
    if (!sourceId) return null;
    return fileMap.get(sourceId) || null;
  }, [selectedFileId, genealogyEdges, fileMap]);

  const descendants = useMemo(() => {
    if (!selectedFileId) return [];
    const descendantIds = findAllDescendants(selectedFileId, genealogyEdges);
    return descendantIds
      .map(d => ({
        file: fileMap.get(d.id),
        similarity: d.similarity,
      }))
      .filter(d => d.file !== undefined) as { file: FileItem; similarity: number }[];
  }, [selectedFileId, genealogyEdges, fileMap]);

  const handleUpload = useCallback(() => {
    const newFile = getRandomMockFile();
    setFiles(prev => [...prev, newFile]);
    setSelectedFileId(newFile.id);
    setHighlightedNodeIds(null);
  }, []);

  const handleSelectFile = useCallback((fileId: string) => {
    setSelectedFileId(fileId);
    setHighlightedNodeIds(null);
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedFileId(nodeId);
    setHighlightedNodeIds(null);
  }, []);

  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    const ancestors = findAllAncestors(nodeId, genealogyEdges);
    const descendants = findAllDescendants(nodeId, genealogyEdges);
    
    const highlighted = new Set<string>();
    highlighted.add(nodeId);
    ancestors.forEach(id => highlighted.add(id));
    descendants.forEach(d => highlighted.add(d.id));
    
    setHighlightedNodeIds(highlighted);
    setSelectedFileId(nodeId);
  }, [genealogyEdges]);

  const handleNavigateToFile = useCallback((fileId: string) => {
    setSelectedFileId(fileId);
    setHighlightedNodeIds(null);
  }, []);

  return (
    <ReactFlowProvider>
      <div className="app-container">
        <FileManager
          files={files}
          selectedFileId={selectedFileId}
          onSelectFile={handleSelectFile}
          onUpload={handleUpload}
        />
        <GenealogyGraph
          genealogyNodes={genealogyNodes}
          genealogyEdges={genealogyEdges}
          files={files}
          selectedNodeId={selectedFileId}
          highlightedNodeIds={highlightedNodeIds}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
        />
        <DetailPanel
          selectedFile={selectedFile}
          originalSource={originalSource}
          descendants={descendants}
          onNavigateToFile={handleNavigateToFile}
        />
      </div>
    </ReactFlowProvider>
  );
};

export default App;
