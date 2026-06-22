import React, { useEffect, useRef, useState } from 'react';
import Scene from './components/Scene';
import ControlPanel from './components/ControlPanel';
import HeatmapOverlay from './components/HeatmapOverlay';
import useSceneStore from './stores/sceneStore';
import { initSocket, disconnectSocket } from './utils/socket';

const App: React.FC = () => {
  const { 
    pedestrians, 
    setPedestrians, 
    attractorPoint,
    setAttractorPoint,
    pedestrianCount,
    setPedestrianCount,
    exportConfig,
    importConfig,
    lightMode,
  } = useSceneStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const pedestriansRef = useRef(pedestrians);
  const attractorRef = useRef(attractorPoint);
  
  useEffect(() => {
    pedestriansRef.current = pedestrians;
  }, [pedestrians]);
  
  useEffect(() => {
    attractorRef.current = attractorPoint;
  }, [attractorPoint]);
  
  useEffect(() => {
    const socket = initSocket();
    
    socket.on('connect', () => {
      console.log('Connected to server');
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
    
    return () => {
      disconnectSocket();
    };
  }, []);
  
  useEffect(() => {
    const generateInitialPedestrians = () => {
      const count = Math.floor(Math.random() * 16) + 25;
      const newPedestrians = [];
      const gridSize = 4;
      const spacing = 20;
      const roadWidth = 8;
      const offset = -((gridSize - 1) * spacing) / 2;
      
      for (let i = 0; i < count; i++) {
        const isHorizontal = Math.random() > 0.5;
        const lane = Math.floor(Math.random() * 3) - 1;
        
        let x: number, z: number, targetX: number, targetZ: number;
        
        if (isHorizontal) {
          const roadIndex = Math.floor(Math.random() * gridSize);
          x = offset - 10 - Math.random() * 20;
          z = offset + roadIndex * spacing + lane * (roadWidth / 3);
          targetX = offset + (gridSize - 1) * spacing + 10 + Math.random() * 20;
          targetZ = z + (Math.random() - 0.5) * 2;
        } else {
          const roadIndex = Math.floor(Math.random() * gridSize);
          x = offset + roadIndex * spacing + lane * (roadWidth / 3);
          z = offset - 10 - Math.random() * 20;
          targetX = x + (Math.random() - 0.5) * 2;
          targetZ = offset + (gridSize - 1) * spacing + 10 + Math.random() * 20;
        }
        
        newPedestrians.push({
          id: `ped-${i}-${Date.now()}-${Math.random()}`,
          x,
          z,
          speed: 0.2 + Math.random() * 0.3,
          targetX,
          targetZ,
          path: [{ x, z }, { x: targetX, z: targetZ }],
          pathIndex: 0,
        });
      }
      
      setPedestrians(newPedestrians);
      setPedestrianCount(count);
    };
    
    generateInitialPedestrians();
  }, [setPedestrians, setPedestrianCount]);
  
  useEffect(() => {
    const gridSize = 4;
    const spacing = 20;
    const roadWidth = 8;
    const offset = -((gridSize - 1) * spacing) / 2;
    const totalLength = (gridSize - 1) * spacing;
    
    const isOnRoad = (x: number, z: number): boolean => {
      for (let i = 0; i < gridSize; i++) {
        const roadZ = offset + i * spacing;
        if (Math.abs(z - roadZ) < roadWidth / 2) {
          if (x >= offset - roadWidth && x <= offset + totalLength + roadWidth) {
            return true;
          }
        }
        const roadX = offset + i * spacing;
        if (Math.abs(x - roadX) < roadWidth / 2) {
          if (z >= offset - roadWidth && z <= offset + totalLength + roadWidth) {
            return true;
          }
        }
      }
      return false;
    };
    
    const findPath = (startX: number, startZ: number, endX: number, endZ: number): { x: number; z: number }[] => {
      const attractor = attractorRef.current;
      
      if (attractor) {
        const path: { x: number; z: number }[] = [{ x: startX, z: startZ }];
        
        let nearestRoadX = startX;
        let nearestRoadZ = startZ;
        let minDist = Infinity;
        
        for (let i = 0; i < gridSize; i++) {
          const roadZ = offset + i * spacing;
          const dist = Math.abs(startZ - roadZ);
          if (dist < minDist) {
            minDist = dist;
            nearestRoadX = startX;
            nearestRoadZ = roadZ;
          }
        }
        for (let i = 0; i < gridSize; i++) {
          const roadX = offset + i * spacing;
          const dist = Math.abs(startX - roadX);
          if (dist < minDist) {
            minDist = dist;
            nearestRoadX = roadX;
            nearestRoadZ = startZ;
          }
        }
        
        if (minDist > 0.1) {
          path.push({ x: nearestRoadX, z: nearestRoadZ });
        }
        
        let targetRoadX = attractor.x;
        let targetRoadZ = attractor.z;
        let minTargetDist = Infinity;
        
        for (let i = 0; i < gridSize; i++) {
          const roadZ = offset + i * spacing;
          const dist = Math.abs(attractor.z - roadZ);
          if (dist < minTargetDist) {
            minTargetDist = dist;
            targetRoadX = attractor.x;
            targetRoadZ = roadZ;
          }
        }
        for (let i = 0; i < gridSize; i++) {
          const roadX = offset + i * spacing;
          const dist = Math.abs(attractor.x - roadX);
          if (dist < minTargetDist) {
            targetRoadX = roadX;
            targetRoadZ = attractor.z;
            break;
          }
        }
        
        const midX = nearestRoadX;
        const midZ = targetRoadZ;
        
        if (Math.abs(nearestRoadX - midX) > 0.1 || Math.abs(nearestRoadZ - midZ) > 0.1) {
          path.push({ x: midX, z: midZ });
        }
        if (Math.abs(midX - targetRoadX) > 0.1 || Math.abs(midZ - targetRoadZ) > 0.1) {
          path.push({ x: targetRoadX, z: targetRoadZ });
        }
        
        path.push({ x: attractor.x, z: attractor.z });
        
        return path;
      }
      
      return [{ x: startX, z: startZ }, { x: endX, z: endZ }];
    };
    
    const animate = (timestamp: number) => {
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      
      if (deltaTime > 0.1) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const currentPeds = pedestriansRef.current;
      if (currentPeds.length === 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const updatedPedestrians = currentPeds.map((ped) => {
        let { x, z, speed, targetX, targetZ, path, pathIndex } = ped;
        
        const attractor = attractorRef.current;
        
        if (attractor) {
          if (path.length <= 1 || pathIndex >= path.length - 1) {
            path = findPath(x, z, attractor.x, attractor.z);
            pathIndex = 0;
          }
        } else {
          if (pathIndex >= path.length - 1) {
            const isHorizontal = Math.random() > 0.5;
            const lane = Math.floor(Math.random() * 3) - 1;
            
            if (isHorizontal) {
              const roadIndex = Math.floor(Math.random() * gridSize);
              targetX = x > 0 ? offset - 10 : offset + totalLength + 10;
              targetZ = offset + roadIndex * spacing + lane * (roadWidth / 3);
            } else {
              const roadIndex = Math.floor(Math.random() * gridSize);
              targetX = offset + roadIndex * spacing + lane * (roadWidth / 3);
              targetZ = z > 0 ? offset - 10 : offset + totalLength + 10;
            }
            
            path = [{ x, z }, { x: targetX, z: targetZ }];
            pathIndex = 0;
          }
        }
        
        const currentTarget = path[pathIndex + 1] || path[path.length - 1];
        const dx = currentTarget.x - x;
        const dz = currentTarget.z - z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < 0.5) {
          pathIndex = Math.min(pathIndex + 1, path.length - 1);
        }
        
        if (dist > 0.01) {
          const moveSpeed = speed * (attractor ? 1.5 : 1);
          const moveX = (dx / dist) * moveSpeed * deltaTime * 60 * 0.05;
          const moveZ = (dz / dist) * moveSpeed * deltaTime * 60 * 0.05;
          x += moveX;
          z += moveZ;
        }
        
        if (x < offset - 30 || x > offset + totalLength + 30 ||
            z < offset - 30 || z > offset + totalLength + 30) {
          const isHorizontal = Math.random() > 0.5;
          const lane = Math.floor(Math.random() * 3) - 1;
          const side = Math.random() > 0.5 ? -1 : 1;
          
          if (isHorizontal) {
            const roadIndex = Math.floor(Math.random() * gridSize);
            x = side > 0 ? offset - 15 : offset + totalLength + 15;
            z = offset + roadIndex * spacing + lane * (roadWidth / 3);
            targetX = side > 0 ? offset + totalLength + 15 : offset - 15;
            targetZ = z;
          } else {
            const roadIndex = Math.floor(Math.random() * gridSize);
            x = offset + roadIndex * spacing + lane * (roadWidth / 3);
            z = side > 0 ? offset - 15 : offset + totalLength + 15;
            targetX = x;
            targetZ = side > 0 ? offset + totalLength + 15 : offset - 15;
          }
          
          path = [{ x, z }, { x: targetX, z: targetZ }];
          pathIndex = 0;
        }
        
        return { ...ped, x, z, targetX, targetZ, path, pathIndex };
      });
      
      setPedestrians(updatedPedestrians);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    lastTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [setPedestrians, attractorPoint]);
  
  const handleExport = () => {
    const config = exportConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `city-night-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleImport = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const config = JSON.parse(event.target?.result as string);
          importConfig(config);
        } catch (err) {
          console.error('Failed to parse config file:', err);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const config = JSON.parse(event.target?.result as string);
          importConfig(config);
        } catch (err) {
          console.error('Failed to parse config file:', err);
        }
      };
      reader.readAsText(file);
    }
  };
  
  return (
    <div 
      style={styles.app}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <nav style={styles.navbar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🏙️</span>
          <span style={styles.logoText}>城市夜光模拟器</span>
        </div>
        <div style={styles.navActions}>
          <button onClick={handleImport} style={styles.navButton}>
            <span>📂</span>
            <span>导入</span>
          </button>
          <button onClick={handleExport} style={{ ...styles.navButton, ...styles.primaryButton }}>
            <span>💾</span>
            <span>导出</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </nav>
      
      <div style={styles.sceneContainer}>
        <Scene />
      </div>
      
      <HeatmapOverlay />
      <ControlPanel />
      
      {isDragging && (
        <div style={styles.dropOverlay}>
          <div style={styles.dropContent}>
            <div style={styles.dropIcon}>📁</div>
            <div style={styles.dropText}>释放以上传配置文件</div>
          </div>
        </div>
      )}
      
      <div style={styles.infoPanel}>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>行人数量</span>
          <span style={styles.infoValue}>{pedestrianCount}</span>
        </div>
        <div style={styles.infoDivider}></div>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>灯柱数量</span>
          <span style={styles.infoValue}>16</span>
        </div>
        <div style={styles.infoDivider}></div>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>照明模式</span>
          <span style={styles.infoValue}>
            {lightMode === 'warm' ? '暖黄' : lightMode === 'cool' ? '冷白' : '智能'}
          </span>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  app: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    background: '#1a1a2e',
  },
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    background: 'rgba(26, 26, 46, 0.8)',
    backdropFilter: 'blur(8px)',
    zIndex: 200,
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    fontSize: '24px',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#fff',
    letterSpacing: '0.5px',
  },
  navActions: {
    display: 'flex',
    gap: '12px',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%)',
    border: 'none',
    fontWeight: 500,
  },
  sceneContainer: {
    width: '100%',
    height: '100%',
  },
  dropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(79, 195, 247, 0.2)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    border: '3px dashed #4FC3F7',
    margin: '10px',
    borderRadius: '12px',
  },
  dropContent: {
    textAlign: 'center',
    color: '#fff',
  },
  dropIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  dropText: {
    fontSize: '20px',
    fontWeight: 500,
  },
  infoPanel: {
    position: 'absolute',
    bottom: '24px',
    left: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 20px',
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(8px)',
    borderRadius: '8px',
    zIndex: 100,
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  infoLabel: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  infoValue: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#4FC3F7',
  },
  infoDivider: {
    width: '1px',
    height: '32px',
    background: 'rgba(255, 255, 255, 0.1)',
  },
};

export default App;
