import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import type { Card, SimilarityPair } from '../../types';

interface NetworkVisualizerProps {
  cards: Card[];
  similarities: SimilarityPair[];
  selectedCardId: string | null;
  searchQuery: string;
  onSelectCard: (id: string | null) => void;
}

interface NodeData {
  id: string;
  card: Card;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  mesh: THREE.Mesh;
  labelSprite: THREE.Sprite;
  scale: number;
}

interface EdgeData {
  card1Id: string;
  card2Id: string;
  similarity: number;
  line: THREE.Line;
  arrow: THREE.Mesh;
  labelSprite: THREE.Sprite;
}

const NetworkVisualizer: React.FC<NetworkVisualizerProps> = ({
  cards,
  similarities,
  selectedCardId,
  searchQuery,
  onSelectCard
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodesMapRef = useRef<Map<string, NodeData>>(new Map());
  const edgesRef = useRef<EdgeData[]>([]);
  const animationIdRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0, y: 0 });
  const cameraDistanceRef = useRef(500);
  const lastClickTimeRef = useRef(0);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const isSimulatingRef = useRef(true);

  const getNodeScale = useCallback((card: Card) => {
    const refCount = card.refCount || 0;
    const minScale = 0.8;
    const maxScale = 1.5;
    const scale = minScale + (maxScale - minScale) * Math.min(refCount / 10, 1);
    return scale;
  }, []);

  const createLabelTexture = useCallback((text: string, color: string = '#FFFFFF', fontSize: number = 12) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    context.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    const metrics = context.measureText(text);
    const textWidth = Math.ceil(metrics.width) + 10;
    canvas.width = textWidth;
    canvas.height = fontSize + 6;
    context.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  const createNode = useCallback((card: Card, index: number) => {
    const scale = getNodeScale(card);
    const radius = 15 * scale;
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0x94A3B8,
      transparent: true,
      opacity: 0.6
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = { cardId: card.id };

    const angle = (index / Math.max(1, 20)) * Math.PI * 2;
    const radiusPos = 50 + Math.random() * 100;
    const x = Math.cos(angle) * radiusPos;
    const y = Math.sin(angle) * radiusPos;
    const z = (Math.random() - 0.5) * 100;
    
    mesh.position.set(x, y, z);

    const labelTexture = createLabelTexture(card.title || '未命名', '#CBD5E1', 12);
    const labelMaterial = new THREE.SpriteMaterial({
      map: labelTexture,
      transparent: true
    });
    const labelSprite = new THREE.Sprite(labelMaterial);
    labelSprite.scale.set(labelTexture.image.width * 0.8, labelTexture.image.height * 0.8, 1);
    labelSprite.position.set(x, y + radius + 10, z);

    return {
      id: card.id,
      card,
      position: mesh.position.clone(),
      velocity: new THREE.Vector3(),
      mesh,
      labelSprite,
      scale
    };
  }, [getNodeScale, createLabelTexture]);

  const createEdge = useCallback((sim: SimilarityPair, node1: NodeData, node2: NodeData) => {
    const points = [node1.mesh.position.clone(), node2.mesh.position.clone()];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x6366F1,
      transparent: true,
      opacity: 0.4,
      linewidth: 1.5
    });
    const line = new THREE.Line(geometry, material);

    const arrowGeometry = new THREE.ConeGeometry(3, 8, 6);
    const arrowMaterial = new THREE.MeshBasicMaterial({
      color: 0x6366F1,
      transparent: true,
      opacity: 0.6
    });
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);

    const percentText = `${Math.round(sim.similarity * 100)}%`;
    const labelTexture = createLabelTexture(percentText, '#F59E0B', 11);
    const labelMaterial = new THREE.SpriteMaterial({
      map: labelTexture,
      transparent: true
    });
    const labelSprite = new THREE.Sprite(labelMaterial);
    labelSprite.scale.set(labelTexture.image.width * 0.8, labelTexture.image.height * 0.8, 1);

    return {
      card1Id: sim.card1Id,
      card2Id: sim.card2Id,
      similarity: sim.similarity,
      line,
      arrow,
      labelSprite
    };
  }, [createLabelTexture]);

  const updateEdgeGeometry = useCallback((edge: EdgeData, node1: NodeData, node2: NodeData) => {
    const positions = edge.line.geometry.attributes.position;
    positions.setXYZ(0, node1.mesh.position.x, node1.mesh.position.y, node1.mesh.position.z);
    positions.setXYZ(1, node2.mesh.position.x, node2.mesh.position.y, node2.mesh.position.z);
    positions.needsUpdate = true;

    const midPoint = new THREE.Vector3()
      .addVectors(node1.mesh.position, node2.mesh.position)
      .multiplyScalar(0.5);

    const direction = new THREE.Vector3()
      .subVectors(node2.mesh.position, node1.mesh.position)
      .normalize();

    const arrowDistance = node1.mesh.position.distanceTo(node2.mesh.position) / 2 - 20;
    edge.arrow.position.copy(node1.mesh.position).add(direction.multiplyScalar(arrowDistance + 20));
    edge.arrow.lookAt(node2.mesh.position);
    edge.arrow.rotateX(Math.PI / 2);

    edge.labelSprite.position.copy(midPoint);
    edge.labelSprite.position.y += 5;
  }, []);

  const applyForceLayout = useCallback(() => {
    const nodes = Array.from(nodesMapRef.current.values());
    if (nodes.length < 2) return;

    const repulsionStrength = 8000;
    const attractionStrength = 0.005;
    const centerStrength = 0.001;
    const damping = 0.9;
    const maxVelocity = 10;

    nodes.forEach((node, i) => {
      nodes.forEach((other, j) => {
        if (i === j) return;
        const diff = new THREE.Vector3().subVectors(node.position, other.position);
        const dist = diff.length() || 1;
        const force = repulsionStrength / (dist * dist);
        diff.normalize().multiplyScalar(force);
        node.velocity.add(diff);
      });
    });

    edgesRef.current.forEach(edge => {
      const node1 = nodesMapRef.current.get(edge.card1Id);
      const node2 = nodesMapRef.current.get(edge.card2Id);
      if (!node1 || !node2) return;

      const diff = new THREE.Vector3().subVectors(node2.position, node1.position);
      const dist = diff.length() || 1;
      const targetDist = 120;
      const force = (dist - targetDist) * attractionStrength * edge.similarity;
      diff.normalize().multiplyScalar(force);
      node1.velocity.add(diff);
      node2.velocity.sub(diff);
    });

    nodes.forEach(node => {
      const centerForce = new THREE.Vector3(0, 0, 0).sub(node.position).multiplyScalar(centerStrength);
      node.velocity.add(centerForce);
    });

    nodes.forEach(node => {
      node.velocity.multiplyScalar(damping);
      if (node.velocity.length() > maxVelocity) {
        node.velocity.normalize().multiplyScalar(maxVelocity);
      }
      node.position.add(node.velocity);
      node.mesh.position.copy(node.position);
      node.labelSprite.position.set(
        node.position.x,
        node.position.y + 15 * node.scale + 10,
        node.position.z
      );
    });

    edgesRef.current.forEach(edge => {
      const node1 = nodesMapRef.current.get(edge.card1Id);
      const node2 = nodesMapRef.current.get(edge.card2Id);
      if (node1 && node2) {
        updateEdgeGeometry(edge, node1, node2);
      }
    });
  }, [updateEdgeGeometry]);

  const updateNodeColors = useCallback(() => {
    const nodes = Array.from(nodesMapRef.current.values());
    
    if (selectedCardId) {
      const connectedIds = new Set<string>();
      connectedIds.add(selectedCardId);
      edgesRef.current.forEach(edge => {
        if (edge.card1Id === selectedCardId) connectedIds.add(edge.card2Id);
        if (edge.card2Id === selectedCardId) connectedIds.add(edge.card1Id);
      });

      nodes.forEach(node => {
        const material = node.mesh.material as THREE.MeshBasicMaterial;
        if (node.id === selectedCardId) {
          material.color.setHex(0xF97316);
          material.opacity = 1.0;
        } else if (connectedIds.has(node.id)) {
          material.color.setHex(0xF97316);
          material.opacity = 1.0;
        } else {
          material.color.setHex(0x94A3B8);
          material.opacity = 0.1;
        }
      });

      edgesRef.current.forEach(edge => {
        const lineMat = edge.line.material as THREE.LineBasicMaterial;
        const arrowMat = edge.arrow.material as THREE.MeshBasicMaterial;
        if (edge.card1Id === selectedCardId || edge.card2Id === selectedCardId) {
          lineMat.opacity = 0.8;
          arrowMat.opacity = 1.0;
          edge.labelSprite.material.opacity = 1;
        } else {
          lineMat.opacity = 0.05;
          arrowMat.opacity = 0.05;
          edge.labelSprite.material.opacity = 0.1;
        }
      });
    } else if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      const matchedIds = new Set<string>();
      
      nodes.forEach(node => {
        const titleMatch = node.card.title.toLowerCase().includes(searchLower);
        const tagMatch = node.card.tags.some(t => t.toLowerCase().includes(searchLower));
        if (titleMatch || tagMatch) {
          matchedIds.add(node.id);
        }
      });

      const visibleIds = new Set(matchedIds);
      edgesRef.current.forEach(edge => {
        if (matchedIds.has(edge.card1Id) || matchedIds.has(edge.card2Id)) {
          if (matchedIds.has(edge.card1Id) && matchedIds.has(edge.card2Id)) {
            visibleIds.add(edge.card1Id);
            visibleIds.add(edge.card2Id);
          }
        }
      });

      const firstLevelIds = new Set(visibleIds);
      edgesRef.current.forEach(edge => {
        if (matchedIds.has(edge.card1Id)) firstLevelIds.add(edge.card2Id);
        if (matchedIds.has(edge.card2Id)) firstLevelIds.add(edge.card1Id);
      });

      nodes.forEach(node => {
        const material = node.mesh.material as THREE.MeshBasicMaterial;
        if (matchedIds.has(node.id)) {
          material.color.setHex(0xFDE68A);
          material.opacity = 1.0;
        } else if (firstLevelIds.has(node.id)) {
          material.color.setHex(0x94A3B8);
          material.opacity = 0.6;
        } else {
          material.color.setHex(0x94A3B8);
          material.opacity = 0.1;
        }
      });

      edgesRef.current.forEach(edge => {
        const lineMat = edge.line.material as THREE.LineBasicMaterial;
        const arrowMat = edge.arrow.material as THREE.MeshBasicMaterial;
        const hasMatch = matchedIds.has(edge.card1Id) || matchedIds.has(edge.card2Id);
        const bothMatch = matchedIds.has(edge.card1Id) && matchedIds.has(edge.card2Id);
        if (bothMatch) {
          lineMat.opacity = 0.7;
          arrowMat.opacity = 0.8;
          edge.labelSprite.material.opacity = 1;
        } else if (hasMatch) {
          lineMat.opacity = 0.3;
          arrowMat.opacity = 0.4;
          edge.labelSprite.material.opacity = 0.5;
        } else {
          lineMat.opacity = 0.05;
          arrowMat.opacity = 0.05;
          edge.labelSprite.material.opacity = 0.1;
        }
      });
    } else {
      nodes.forEach(node => {
        const material = node.mesh.material as THREE.MeshBasicMaterial;
        material.color.setHex(0x94A3B8);
        material.opacity = 0.6;
      });

      edgesRef.current.forEach(edge => {
        const lineMat = edge.line.material as THREE.LineBasicMaterial;
        const arrowMat = edge.arrow.material as THREE.MeshBasicMaterial;
        lineMat.opacity = 0.4;
        arrowMat.opacity = 0.6;
        edge.labelSprite.material.opacity = 0.8;
      });
    }
  }, [selectedCardId, searchQuery]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 500);
    gradient.addColorStop(0, '#0F172A');
    gradient.addColorStop(1, '#1E293B');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 500);
    const bgTexture = new THREE.CanvasTexture(canvas);
    scene.background = bgTexture;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 2000);
    camera.position.set(0, 0, 500);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMouseRef.current.x;
      const deltaY = e.clientY - previousMouseRef.current.y;
      rotationRef.current.y += deltaX * 0.01;
      rotationRef.current.x += deltaY * 0.01;
      rotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationRef.current.x));
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraDistanceRef.current += e.deltaY * 0.5;
      cameraDistanceRef.current = Math.max(150, Math.min(1500, cameraDistanceRef.current));
    };

    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current || !camera || !scene) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const meshes = Array.from(nodesMapRef.current.values()).map(n => n.mesh);
      const intersects = raycasterRef.current.intersectObjects(meshes);

      const now = Date.now();
      const timeDiff = now - lastClickTimeRef.current;

      if (intersects.length > 0) {
        const cardId = intersects[0].object.userData.cardId;
        if (timeDiff < 300) {
          onSelectCard(cardId);
          const node = nodesMapRef.current.get(cardId);
          if (node) {
            const mat = node.mesh.material as THREE.MeshBasicMaterial;
            const originalColor = mat.color.clone();
            mat.color.setHex(0xF97316);
            setTimeout(() => {
              if (nodesMapRef.current.get(cardId)) {
                updateNodeColors();
              }
            }, 200);
          }
        }
        lastClickTimeRef.current = now;
      } else {
        if (timeDiff < 300) {
          onSelectCard(null);
        }
        lastClickTimeRef.current = now;
      }
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
    renderer.domElement.addEventListener('click', handleClick);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (camera) {
        const x = Math.sin(rotationRef.current.y) * Math.cos(rotationRef.current.x) * cameraDistanceRef.current;
        const y = Math.sin(rotationRef.current.x) * cameraDistanceRef.current;
        const z = Math.cos(rotationRef.current.y) * Math.cos(rotationRef.current.x) * cameraDistanceRef.current;
        camera.position.set(x, y, z);
        camera.lookAt(0, 0, 0);
      }

      if (isSimulatingRef.current) {
        applyForceLayout();
      }

      updateNodeColors();

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.dispose();
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [applyForceLayout, updateNodeColors, onSelectCard]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    nodesMapRef.current.forEach(node => {
      scene.remove(node.mesh);
      scene.remove(node.labelSprite);
      node.mesh.geometry.dispose();
      (node.mesh.material as THREE.Material).dispose();
      (node.labelSprite.material as THREE.SpriteMaterial).map?.dispose();
      (node.labelSprite.material as THREE.Material).dispose();
    });
    nodesMapRef.current.clear();

    edgesRef.current.forEach(edge => {
      scene.remove(edge.line);
      scene.remove(edge.arrow);
      scene.remove(edge.labelSprite);
      edge.line.geometry.dispose();
      (edge.line.material as THREE.Material).dispose();
      edge.arrow.geometry.dispose();
      (edge.arrow.material as THREE.Material).dispose();
      (edge.labelSprite.material as THREE.SpriteMaterial).map?.dispose();
      (edge.labelSprite.material as THREE.Material).dispose();
    });
    edgesRef.current = [];

    cards.forEach((card, index) => {
      const node = createNode(card, index);
      nodesMapRef.current.set(card.id, node);
      scene.add(node.mesh);
      scene.add(node.labelSprite);
    });

    similarities.forEach(sim => {
      const node1 = nodesMapRef.current.get(sim.card1Id);
      const node2 = nodesMapRef.current.get(sim.card2Id);
      if (node1 && node2) {
        const edge = createEdge(sim, node1, node2);
        edgesRef.current.push(edge);
        scene.add(edge.line);
        scene.add(edge.arrow);
        scene.add(edge.labelSprite);
      }
    });

    isSimulatingRef.current = true;
    const stableTimeout = setTimeout(() => {
      isSimulatingRef.current = false;
    }, 3000);

    return () => clearTimeout(stableTimeout);
  }, [cards, similarities, createNode, createEdge]);

  return (
    <div 
      ref={containerRef} 
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        padding: '8px 12px',
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#94A3B8',
        pointerEvents: 'none'
      }}>
        🔄 拖拽旋转 · 🖱️ 滚轮缩放 · 双击节点查看详情
      </div>
    </div>
  );
};

export default NetworkVisualizer;
