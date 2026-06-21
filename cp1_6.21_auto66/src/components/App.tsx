import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { SceneManager } from '../modules/scene/SceneManager';
import { PartsSystem, BRICK_TYPES } from '../modules/parts/PartsSystem';
import { PreviewController } from '../modules/preview/PreviewController';
import { CLASSIC_COLORS, PANEL_BACKGROUND, BORDER_COLOR, HOVER_BLUE, GRADIENT_START, GRADIENT_END, SCROLLBAR_COLOR, MODAL_OVERLAY, REJECT_COLOR } from '../utils/colors';
import type { Brick, BrickType, GridPosition, DragState, PartsListItem } from '../utils/types';

const GRID_SIZE = 20;

export default function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const partsSystemRef = useRef<PartsSystem | null>(null);
  const previewControllerRef = useRef<PreviewController | null>(null);
  const brickMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const dragGhostRef = useRef<THREE.Mesh | null>(null);
  const rejectAnimationRef = useRef<number | null>(null);

  const [bricks, setBricks] = useState<Brick[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>(CLASSIC_COLORS[0].value);
  const [selectedType, setSelectedType] = useState<BrickType>('2x2');
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    brickType: null,
    color: null,
    position: null,
    gridPosition: null,
    isValidPosition: false,
    showReject: false
  });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [partsList, setPartsList] = useState<PartsListItem[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const dragStateRef = useRef(dragState);
  dragStateRef.current = dragState;

  useEffect(() => {
    if (!canvasRef.current) return;

    const sceneManager = new SceneManager(GRID_SIZE);
    const partsSystem = new PartsSystem(GRID_SIZE, 10);
    const previewController = new PreviewController();

    sceneManager.init(canvasRef.current);
    sceneManagerRef.current = sceneManager;
    partsSystemRef.current = partsSystem;
    previewControllerRef.current = previewController;

    const updateCallback = (delta: number) => {
      if (previewController.isActive()) {
        const camera = sceneManager.getCamera();
        const target = new THREE.Vector3(0, 0, 0);
        previewController.updateRotation(delta, camera, target);
        previewController.updateGlowEffects(delta);
      }
    };
    sceneManager.startRenderLoop(updateCallback);

    return () => {
      sceneManager.dispose();
    };
  }, []);

  const updateBrickMeshes = useCallback((updatedBricks: Brick[]) => {
    const scene = sceneManagerRef.current?.getScene();
    if (!scene) return;

    brickMeshesRef.current.forEach(mesh => {
      scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    brickMeshesRef.current.clear();

    updatedBricks.forEach(brick => {
      const geometry = new THREE.BoxGeometry(
        brick.size.width,
        brick.size.height,
        brick.size.depth
      );
      const material = new THREE.MeshStandardMaterial({
        color: brick.color,
        metalness: 0.1,
        roughness: 0.5
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        brick.position.x + brick.size.width / 2 - 0.5,
        brick.position.y + brick.size.height / 2,
        brick.position.z + brick.size.depth / 2 - 0.5
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = `brick-${brick.id}`;
      scene.add(mesh);
      brickMeshesRef.current.set(brick.id, mesh);
    });
  }, []);

  const updateDragGhost = useCallback(() => {
    const scene = sceneManagerRef.current?.getScene();
    if (!scene) return;

    if (dragGhostRef.current) {
      scene.remove(dragGhostRef.current);
      dragGhostRef.current.geometry.dispose();
      (dragGhostRef.current.material as THREE.Material).dispose();
      dragGhostRef.current = null;
    }

    const ds = dragStateRef.current;
    if (!ds.isDragging || !ds.position || !ds.brickType || !ds.color) return;

    const size = partsSystemRef.current?.getBrickSize(ds.brickType);
    if (!size) return;

    const geometry = new THREE.BoxGeometry(size.width, size.height, size.depth);
    const material = new THREE.MeshStandardMaterial({
      color: ds.color,
      metalness: 0.1,
      roughness: 0.5,
      transparent: true,
      opacity: ds.isValidPosition ? 0.7 : 0.4
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      ds.position.x,
      ds.position.y + 0.2,
      ds.position.z
    );
    mesh.scale.setScalar(1.1);
    mesh.name = 'drag-ghost';
    scene.add(mesh);
    dragGhostRef.current = mesh;
  }, []);

  useEffect(() => {
    updateDragGhost();
  }, [dragState, updateDragGhost]);

  useEffect(() => {
    updateBrickMeshes(bricks);
  }, [bricks, updateBrickMeshes]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const ds = dragStateRef.current;
    if (!ds.isDragging || !sceneManagerRef.current || !partsSystemRef.current) return;

    const worldPos = sceneManagerRef.current.screenToWorld(e.clientX, e.clientY, 0.5);
    const gridPos = partsSystemRef.current.snapToGrid(worldPos.x, worldPos.y, worldPos.z);
    const size = partsSystemRef.current.getBrickSize(ds.brickType!);
    const isValid = !partsSystemRef.current.checkCollision(gridPos, size);

    const centerX = gridPos.x + size.width / 2 - 0.5;
    const centerZ = gridPos.z + size.depth / 2 - 0.5;

    setDragState(prev => ({
      ...prev,
      position: { x: centerX, y: 0.5, z: centerZ },
      gridPosition: gridPos,
      isValidPosition: isValid
    }));
  }, []);

  const handleMouseUp = useCallback(() => {
    const ds = dragStateRef.current;
    if (!ds.isDragging || !ds.brickType || !ds.color || !partsSystemRef.current) {
      setDragState(prev => ({ ...prev, isDragging: false }));
      return;
    }

    if (ds.isValidPosition && ds.gridPosition) {
      const newBrick = partsSystemRef.current.addBrick(
        ds.brickType,
        ds.gridPosition,
        ds.color
      );
      if (newBrick) {
        setBricks(partsSystemRef.current.getBricks());
        setCanUndo(partsSystemRef.current.canUndo());
        setCanRedo(partsSystemRef.current.canRedo());
      }
    } else if (ds.gridPosition) {
      setDragState(prev => ({ ...prev, showReject: true }));
      if (rejectAnimationRef.current) {
        clearTimeout(rejectAnimationRef.current);
      }
      rejectAnimationRef.current = window.setTimeout(() => {
        setDragState(prev => ({ ...prev, showReject: false }));
      }, 300);
    }

    setDragState(prev => ({
      ...prev,
      isDragging: false,
      position: null,
      gridPosition: null
    }));
  }, []);

  const handleDragStart = useCallback((type: BrickType, color: string) => {
    if (isPreview) return;
    setDragState({
      isDragging: true,
      brickType: type,
      color,
      position: null,
      gridPosition: null,
      isValidPosition: false,
      showReject: false
    });
    setSelectedType(type);
    setSelectedColor(color);
  }, [isPreview]);

  const handleUndo = useCallback(() => {
    if (!partsSystemRef.current || isPreview) return;
    partsSystemRef.current.undo();
    setBricks(partsSystemRef.current.getBricks());
    setCanUndo(partsSystemRef.current.canUndo());
    setCanRedo(partsSystemRef.current.canRedo());
  }, [isPreview]);

  const handleRedo = useCallback(() => {
    if (!partsSystemRef.current || isPreview) return;
    partsSystemRef.current.redo();
    setBricks(partsSystemRef.current.getBricks());
    setCanUndo(partsSystemRef.current.canUndo());
    setCanRedo(partsSystemRef.current.canRedo());
  }, [isPreview]);

  const handleNew = useCallback(() => {
    if (isPreview) return;
    setShowNewDialog(true);
  }, [isPreview]);

  const confirmNew = useCallback(() => {
    if (!partsSystemRef.current) return;
    partsSystemRef.current.clearAll();
    setBricks([]);
    setCanUndo(false);
    setCanRedo(false);
    setShowNewDialog(false);
  }, []);

  const handlePreview = useCallback(() => {
    if (!sceneManagerRef.current || !previewControllerRef.current || !partsSystemRef.current) return;

    if (isPreview) {
      previewControllerRef.current.stopPreview();
      setIsPreview(false);
      setPartsList([]);
      updateBrickMeshes(partsSystemRef.current.getBricks());
    } else {
      const scene = sceneManagerRef.current.getScene();
      const bricksData = partsSystemRef.current.getBricks();
      previewControllerRef.current.startPreview(scene, bricksData);
      setPartsList(previewControllerRef.current.generatePartsList(bricksData));
      setIsPreview(true);
    }
  }, [isPreview, updateBrickMeshes]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!previewControllerRef.current || !sceneManagerRef.current) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    previewControllerRef.current.adjustZoom(delta);
    const zoom = previewControllerRef.current.getZoomLevel();
    setZoomLevel(zoom);

    const camera = sceneManagerRef.current.getCamera();
    const baseDistance = GRID_SIZE * 1.2;
    const distance = baseDistance / zoom;
    const angle = Math.PI / 4;
    camera.position.set(
      distance * Math.cos(angle),
      distance * Math.sin(angle),
      distance * Math.cos(angle)
    );
    camera.lookAt(0, 0, 0);
  }, []);

  const handleBrickClick = useCallback((e: React.MouseEvent) => {
    if (isPreview || !sceneManagerRef.current || !partsSystemRef.current) return;

    const renderer = sceneManagerRef.current.getRenderer();
    const camera = sceneManagerRef.current.getCamera();
    const scene = sceneManagerRef.current.getScene();

    if (!renderer) return;

    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const meshArray = Array.from(brickMeshesRef.current.values());
    const intersects = raycaster.intersectObjects(meshArray);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const brickId = mesh.name.replace('brick-', '');
      partsSystemRef.current.removeBrick(brickId);
      setBricks(partsSystemRef.current.getBricks());
      setCanUndo(partsSystemRef.current.canUndo());
      setCanRedo(partsSystemRef.current.canRedo());
    }
  }, [isPreview]);

  const filteredBrickTypes = BRICK_TYPES;

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.panelHeader}>
          <h3 style={styles.panelTitle}>零件库</h3>
        </div>
        <div style={styles.colorFilterBar}>
          {CLASSIC_COLORS.map(color => (
            <div
              key={color.value}
              onClick={() => setSelectedColor(color.value)}
              style={{
                ...styles.colorSwatch,
                backgroundColor: color.value,
                border: selectedColor === color.value
                  ? '3px solid #ffffff'
                  : `1px solid ${BORDER_COLOR}`,
                boxShadow: selectedColor === color.value
                  ? '0 0 0 1px #999, 0 2px 8px rgba(0,0,0,0.15)'
                  : 'none'
              }}
              title={color.name}
            />
          ))}
        </div>
        <div style={styles.partsList}>
          {filteredBrickTypes.map(type => {
            const size = partsSystemRef.current?.getBrickSize(type) || { width: 1, depth: 1, height: 1 };
            return (
              <div
                key={type}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'copy';
                  handleDragStart(type, selectedColor);
                }}
                onMouseDown={() => handleDragStart(type, selectedColor)}
                className="part-card"
                style={{
                  ...styles.partCard,
                  border: selectedType === type && !isPreview
                    ? `2px solid ${GRADIENT_START}`
                    : `1px solid ${BORDER_COLOR}`
                }}
              >
                <div style={styles.partPreview}>
                  <div className="part-brick" style={{
                    ...styles.partBrick,
                    width: `${Math.min(size.width, size.depth) * 20 + 20}px`,
                    height: `${Math.max(size.width, size.depth) * 20 + 20}px`,
                    backgroundColor: selectedColor,
                    transform: `rotate(${size.width > size.depth ? '90deg' : '0deg'})`
                  }} />
                </div>
                <span style={styles.partName}>{type}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.mainArea}>
        <div style={styles.topBar}>
          <div style={styles.buttonGroup}>
            <button
              onClick={handleUndo}
              disabled={!canUndo || isPreview}
              className="round-button"
              style={{
                ...styles.roundButton,
                opacity: canUndo && !isPreview ? 1 : 0.4,
                cursor: canUndo && !isPreview ? 'pointer' : 'not-allowed'
              }}
              title="撤销"
            >
              ↶
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo || isPreview}
              className="round-button"
              style={{
                ...styles.roundButton,
                opacity: canRedo && !isPreview ? 1 : 0.4,
                cursor: canRedo && !isPreview ? 'pointer' : 'not-allowed'
              }}
              title="重做"
            >
              ↷
            </button>
            <button
              onClick={handleNew}
              disabled={isPreview}
              className="round-button"
              style={{
                ...styles.roundButton,
                opacity: isPreview ? 0.4 : 1,
                cursor: isPreview ? 'not-allowed' : 'pointer'
              }}
              title="新建"
            >
              +
            </button>
          </div>
          <button
            onClick={handlePreview}
            className="preview-button"
            style={{
              ...styles.previewButton,
              background: isPreview
                ? `linear-gradient(135deg, #666 0%, #444 100%)`
                : `linear-gradient(135deg, ${GRADIENT_START} 0%, ${GRADIENT_END} 100%)`
            }}
          >
            {isPreview ? '返回搭建' : '预览效果'}
          </button>
        </div>

        <div
          ref={canvasRef}
          style={styles.canvasContainer}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleBrickClick}
          onWheel={isPreview ? handleWheel : undefined}
        />

        {dragState.showReject && (
          <div style={styles.rejectOverlay}>
            <div style={styles.rejectFlash} />
          </div>
        )}

        {isPreview && (
          <div style={styles.partsListPanel}>
            <h4 style={styles.partsListTitle}>零件清单</h4>
            <div style={styles.partsListContent}>
              {partsList.map((item, index) => (
                <div key={index} style={styles.partsListItem}>
                  <div style={{ ...styles.partsListColor, backgroundColor: item.color }} />
                  <span style={styles.partsListName}>{item.colorName} {item.type}</span>
                  <span style={styles.partsListCount}>×{item.count}</span>
                </div>
              ))}
              {partsList.length === 0 && (
                <span style={styles.emptyText}>暂无零件</span>
              )}
            </div>
          </div>
        )}

        {isPreview && (
          <div style={styles.zoomIndicator}>
            缩放: {Math.round(zoomLevel * 100)}%
          </div>
        )}
      </div>

      {showNewDialog && (
        <div style={styles.modalOverlay} onClick={() => setShowNewDialog(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>确认新建</h3>
            <p style={styles.modalText}>新建将会清空当前所有搭建内容，确定继续吗？</p>
            <div style={styles.modalButtons}>
              <button
                onClick={() => setShowNewDialog(false)}
                style={styles.modalCancel}
              >
                取消
              </button>
              <button
                onClick={confirmNew}
                style={styles.modalConfirm}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#f0f4f8',
    margin: 0,
    padding: 0,
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  leftPanel: {
    width: '20%',
    minWidth: '240px',
    backgroundColor: PANEL_BACKGROUND,
    border: `1px solid ${BORDER_COLOR}`,
    borderRadius: '12px',
    margin: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    position: 'relative'
  },
  panelHeader: {
    marginBottom: '16px'
  },
  panelTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#333'
  },
  colorFilterBar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    position: 'absolute',
    right: '12px',
    top: '16px',
    zIndex: 10
  },
  colorSwatch: {
    width: '16px',
    height: '16px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  partsList: {
    flex: 1,
    overflowY: 'auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    paddingRight: '24px',
    scrollbarWidth: 'thin',
    scrollbarColor: `${SCROLLBAR_COLOR} transparent`
  },
  partCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    cursor: 'grab',
    transition: 'all 0.15s ease',
    userSelect: 'none'
  },
  partPreview: {
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px'
  },
  partBrick: {
    borderRadius: '4px',
    boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.15s ease'
  },
  partName: {
    fontSize: '12px',
    color: '#666',
    fontWeight: 500
  },
  mainArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    margin: '12px 12px 12px 0'
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    zIndex: 10
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px'
  },
  roundButton: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: `1px solid ${BORDER_COLOR}`,
    backgroundColor: '#ffffff',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  previewButton: {
    width: '200px',
    height: '56px',
    borderRadius: '28px',
    border: 'none',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 4px 15px rgba(255,107,107,0.4)'
  },
  canvasContainer: {
    flex: 1,
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    position: 'relative'
  },
  rejectOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 5
  },
  rejectFlash: {
    width: '100%',
    height: '100%',
    backgroundColor: REJECT_COLOR,
    animation: 'flash 0.3s ease-out'
  },
  partsListPanel: {
    position: 'absolute',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: '12px',
    padding: '16px 24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    minWidth: '300px',
    maxHeight: '200px',
    overflow: 'hidden',
    zIndex: 10
  },
  partsListTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#333'
  },
  partsListContent: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    maxHeight: '140px',
    overflowY: 'auto'
  },
  partsListItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px'
  },
  partsListColor: {
    width: '16px',
    height: '16px',
    borderRadius: '3px',
    border: '1px solid rgba(0,0,0,0.1)'
  },
  partsListName: {
    fontSize: '13px',
    color: '#333'
  },
  partsListCount: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#666'
  },
  emptyText: {
    fontSize: '13px',
    color: '#999'
  },
  zoomIndicator: {
    position: 'absolute',
    top: '80px',
    right: '20px',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#666',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: MODAL_OVERLAY,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
  },
  modal: {
    width: '340px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
  },
  modalTitle: {
    margin: '0 0 12px 0',
    fontSize: '18px',
    fontWeight: 600,
    color: '#333'
  },
  modalText: {
    margin: '0 0 24px 0',
    fontSize: '14px',
    color: '#666',
    lineHeight: 1.5
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },
  modalCancel: {
    padding: '10px 24px',
    borderRadius: '8px',
    border: `1px solid ${BORDER_COLOR}`,
    backgroundColor: '#ffffff',
    fontSize: '14px',
    color: '#666',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  modalConfirm: {
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    background: `linear-gradient(135deg, ${GRADIENT_START} 0%, ${GRADIENT_END} 100%)`,
    fontSize: '14px',
    color: '#ffffff',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  }
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; overflow: hidden; }
  #root { width: 100%; height: 100%; }
  
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${SCROLLBAR_COLOR}; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #a0a8c0; }
  
  @keyframes flash {
    0% { opacity: 0.8; }
    100% { opacity: 0; }
  }
  
  .part-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .part-card:hover .part-brick {
    transform: scale(1.1);
  }
  
  button:hover {
    filter: brightness(1.05);
  }
  
  .round-button:hover:not(:disabled) {
    background-color: ${HOVER_BLUE} !important;
    transform: scale(1.05);
  }
  
  .preview-button:hover {
    box-shadow: 0 6px 20px rgba(255,107,107,0.5) !important;
    transform: translateY(-1px);
  }
`;
document.head.appendChild(styleSheet);
