import React, { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MindMap from './components/MindMap';
import Toolbar from './components/Toolbar';
import { MindMapNode, MindMapData, saveMindMap, listMindMaps, loadMindMap, MindMapListItem } from './utils/apiClient';

const App: React.FC = () => {
  const [nodes, setNodes] = useState<MindMapNode[]>([
    {
      id: uuidv4(),
      text: '中心主题',
      x: 0,
      y: 0,
      parentId: null,
      collapsed: false
    }
  ]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [currentMindMapId, setCurrentMindMapId] = useState<string | undefined>(undefined);
  const [mindMapName, setMindMapName] = useState('未命名思维导图');
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedMindMaps, setSavedMindMaps] = useState<MindMapListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const handleAddRootNode = useCallback(() => {
    const newNode: MindMapNode = {
      id: uuidv4(),
      text: '新节点',
      x: Math.round(Math.random() * 200 - 100),
      y: Math.round(Math.random() * 200 - 100),
      parentId: null,
      collapsed: false
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedNodeId) return;
    
    setNodes(prev => {
      const toDelete = new Set<string>();
      
      const addToDelete = (nodeId: string) => {
        toDelete.add(nodeId);
        prev.filter(n => n.parentId === nodeId).forEach(child => addToDelete(child.id));
      };
      
      addToDelete(selectedNodeId);
      return prev.filter(n => !toDelete.has(n.id));
    });
    
    setSelectedNodeId(null);
  }, [selectedNodeId]);

  const handleSave = useCallback(async () => {
    try {
      const data: MindMapData = {
        id: currentMindMapId,
        name: mindMapName,
        nodes: nodes
      };
      
      const result = await saveMindMap(data);
      setCurrentMindMapId(result.id);
      setMindMapName(result.name);
      alert('保存成功！');
    } catch (error) {
      console.error('Save failed:', error);
      alert('保存失败，请重试');
    }
  }, [currentMindMapId, mindMapName, nodes]);

  const handleLoad = useCallback(async () => {
    try {
      const list = await listMindMaps();
      setSavedMindMaps(list);
      setShowLoadModal(true);
    } catch (error) {
      console.error('Load list failed:', error);
      alert('加载列表失败，请重试');
    }
  }, []);

  const handleLoadMindMap = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const data = await loadMindMap(id);
      setNodes(data.nodes);
      setCurrentMindMapId(data.id);
      setMindMapName(data.name);
      setSelectedNodeId(null);
      setShowLoadModal(false);
      setScale(1);
    } catch (error) {
      console.error('Load mind map failed:', error);
      alert('加载失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleExportPNG = useCallback(() => {
    const svgElement = document.querySelector('.mindmap-canvas svg') as SVGSVGElement;
    if (!svgElement) {
      alert('导出失败：找不到画布');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      alert('导出失败：Canvas 不可用');
      return;
    }

    const exportWidth = 1920;
    const exportHeight = 1080;
    canvas.width = exportWidth;
    canvas.height = exportHeight;

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, exportWidth, exportHeight);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      minX = Math.min(minX, node.x - 60);
      minY = Math.min(minY, node.y - 60);
      maxX = Math.max(maxX, node.x + 60);
      maxY = Math.max(maxY, node.y + 60);
    });

    const padding = 100;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const scale = Math.min(exportWidth / contentWidth, exportHeight / contentHeight) * 0.9;
    const offsetX = (exportWidth - contentWidth * scale) / 2 - minX * scale;
    const offsetY = (exportHeight - contentHeight * scale) / 2 - minY * scale;

    const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
    const mainGroup = svgClone.querySelector('g');
    if (mainGroup) {
      mainGroup.setAttribute('transform', `translate(${offsetX}, ${offsetY}) scale(${scale})`);
    }

    svgClone.setAttribute('width', exportWidth.toString());
    svgClone.setAttribute('height', exportHeight.toString());

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const link = document.createElement('a');
      link.download = `${mindMapName || 'mindmap'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      alert('导出失败，请重试');
    };
    img.src = url;
  }, [nodes, mindMapName]);

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100%',
      backgroundColor: '#0F172A'
    }}>
      <div style={{ flex: 1, display: 'flex' }} className="mindmap-canvas">
        <MindMap
          nodes={nodes}
          setNodes={setNodes}
          selectedNodeId={selectedNodeId}
          setSelectedNodeId={setSelectedNodeId}
          scale={scale}
          setScale={setScale}
        />
      </div>
      
      <Toolbar
        onAddRootNode={handleAddRootNode}
        onDeleteSelected={handleDeleteSelected}
        onSave={handleSave}
        onLoad={handleLoad}
        onExportPNG={handleExportPNG}
        scale={scale}
        onScaleChange={setScale}
        hasSelection={!!selectedNodeId}
      />

      {showLoadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowLoadModal(false)}>
          <div style={{
            backgroundColor: '#1E293B',
            borderRadius: '16px',
            padding: '24px',
            width: '400px',
            maxHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#F8FAFC',
              marginBottom: '8px'
            }}>
              选择思维导图
            </h2>
            
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {savedMindMaps.length === 0 ? (
                <p style={{ color: '#64748B', textAlign: 'center', padding: '40px 0' }}>
                  暂无保存的思维导图
                </p>
              ) : (
                savedMindMaps.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadMindMap(item.id)}
                    style={{
                      padding: '16px',
                      backgroundColor: '#0F172A',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: '1px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#334155';
                      e.currentTarget.style.borderColor = '#3B82F6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#0F172A';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <div style={{
                      fontSize: '15px',
                      fontWeight: 500,
                      color: '#F8FAFC',
                      marginBottom: '4px'
                    }}>
                      {item.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#64748B'
                    }}>
                      更新于 {new Date(item.updatedAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button
              onClick={() => setShowLoadModal(false)}
              style={{
                padding: '12px',
                backgroundColor: '#475569',
                color: '#F8FAFC',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#64748B';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#475569';
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            color: '#F8FAFC',
            fontSize: '16px'
          }}>
            加载中...
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
