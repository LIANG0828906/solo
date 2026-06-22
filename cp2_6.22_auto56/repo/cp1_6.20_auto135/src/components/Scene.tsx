import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import ModelRenderer from './ModelRenderer';
import SectionPlane, { SectionInfo } from './SectionPlane';
import { Stratum, Fault } from '@utils/geologyData';
import type { CameraMode, SectionCut } from '../App';

interface SceneProps {
  strata: Stratum[];
  faults: Fault[];
  modelSize: { x: number; y: number; z: number };
  cameraMode: CameraMode;
  sectionCut: SectionCut | null;
  onSectionCutChange: (cut: SectionCut | null) => void;
}

interface AutoRotateCameraProps {
  center: THREE.Vector3;
  radius: number;
  mode: CameraMode;
}

const AutoRotateCamera: React.FC<AutoRotateCameraProps> = ({
  center,
  radius,
  mode
}) => {
  const { camera } = useThree();
  const angleRef = useRef(0);
  const controlsRef = useRef<any>(null);

  useFrame((_, delta) => {
    if (mode === 'auto') {
      angleRef.current += (delta * Math.PI * 2) / 10;
      const x = center.x + Math.cos(angleRef.current) * radius;
      const z = center.z + Math.sin(angleRef.current) * radius;
      const y = center.y + radius * 0.6;
      camera.position.lerp(new THREE.Vector3(x, y, z), 0.05);
      camera.lookAt(center);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      enabled={mode === 'manual'}
      enablePan={true}
      minDistance={50}
      maxDistance={radius * 3}
      target={[center.x, center.y, center.z]}
    />
  );
};

interface ManualControlsProps {
  mode: CameraMode;
  modelSize: { x: number; y: number; z: number };
}

const ManualControls: React.FC<ManualControlsProps> = ({ mode, modelSize }) => {
  const { camera, gl } = useThree();
  const keysRef = useRef<Record<string, boolean>>({});
  const mouseDownRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const yawRef = useRef(0);
  const pitchRef = useRef(-0.4);
  const velocityRef = useRef(new THREE.Vector3());

  const modelCenter = new THREE.Vector3(
    modelSize.x / 2,
    modelSize.z / 2,
    modelSize.y / 2
  );
  const maxDist = Math.max(modelSize.x, modelSize.y, modelSize.z) * 1.5;
  const minDist = 20;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    const onMouseDown = (e: MouseEvent) => {
      mouseDownRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => {
      mouseDownRef.current = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!mouseDownRef.current || mode !== 'manual') return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      yawRef.current -= dx * 0.005;
      pitchRef.current = Math.max(
        -Math.PI / 2 + 0.1,
        Math.min(Math.PI / 2 - 0.1, pitchRef.current - dy * 0.005)
      );
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    gl.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      gl.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [gl, mode]);

  useFrame((_, delta) => {
    if (mode !== 'manual') return;

    const speed = 80 * delta;
    const forward = new THREE.Vector3(
      -Math.sin(yawRef.current),
      0,
      -Math.cos(yawRef.current)
    );
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    let moveX = 0;
    let moveZ = 0;

    if (keysRef.current['w']) {
      moveX += forward.x;
      moveZ += forward.z;
    }
    if (keysRef.current['s']) {
      moveX -= forward.x;
      moveZ -= forward.z;
    }
    if (keysRef.current['a']) {
      moveX -= right.x;
      moveZ -= right.z;
    }
    if (keysRef.current['d']) {
      moveX += right.x;
      moveZ += right.z;
    }

    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) {
      moveX = (moveX / len) * speed;
      moveZ = (moveZ / len) * speed;
    }

    const newPos = camera.position.clone();
    newPos.x += moveX;
    newPos.z += moveZ;

    const dist = newPos.distanceTo(modelCenter);
    if (dist < minDist) {
      const dir = newPos.clone().sub(modelCenter).normalize();
      newPos.copy(modelCenter).add(dir.multiplyScalar(minDist));
    } else if (dist > maxDist) {
      const dir = newPos.clone().sub(modelCenter).normalize();
      newPos.copy(modelCenter).add(dir.multiplyScalar(maxDist));
    }

    camera.position.copy(newPos);

    const lookDir = new THREE.Vector3(
      -Math.sin(yawRef.current) * Math.cos(pitchRef.current),
      Math.sin(pitchRef.current),
      -Math.cos(yawRef.current) * Math.cos(pitchRef.current)
    );
    camera.lookAt(camera.position.clone().add(lookDir));
  });

  return null;
};

const SceneContent: React.FC<{
  strata: Stratum[];
  faults: Fault[];
  modelSize: { x: number; y: number; z: number };
  cameraMode: CameraMode;
  sectionCut: SectionCut | null;
  onSectionInfo: (info: SectionInfo | null) => void;
}> = ({ strata, faults, modelSize, cameraMode, sectionCut, onSectionInfo }) => {
  const center = new THREE.Vector3(
    modelSize.x / 2,
    modelSize.z / 2,
    modelSize.y / 2
  );
  const radius = Math.max(modelSize.x, modelSize.y, modelSize.z) * 1.2;

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[center.x + radius, center.y + radius * 0.6, center.z + radius]}
        fov={50}
        near={0.1}
        far={5000}
      />
      <AutoRotateCamera center={center} radius={radius} mode={cameraMode} />
      <ManualControls mode={cameraMode} modelSize={modelSize} />

      <ambientLight intensity={0.5} />
      <directionalLight
        position={[center.x + 100, center.y + 200, center.z + 100]}
        intensity={1}
        castShadow
      />
      <directionalLight
        position={[center.x - 100, center.y + 100, center.z - 100]}
        intensity={0.3}
      />

      <ModelRenderer
        strata={strata}
        faults={faults}
        modelSize={modelSize}
        sectionCut={sectionCut}
      />

      <SectionPlane
        modelSize={modelSize}
        strata={strata}
        sectionCut={sectionCut}
        onSectionInfo={onSectionInfo}
      />

      <gridHelper
        args={[Math.max(modelSize.x, modelSize.y) * 1.5, 20, '#666666', '#444444']}
        position={[modelSize.x / 2, -1, modelSize.y / 2]}
      />
    </>
  );
};

const SectionOverlay: React.FC<{
  sectionInfo: SectionInfo | null;
  strata: Stratum[];
}> = ({ sectionInfo, strata }) => {
  const [hoveredStratum, setHoveredStratum] = useState<Stratum | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!sectionInfo) return null;

  const canvasWidth = 300;
  const canvasHeight = 400;
  const padding = 40;
  const plotWidth = canvasWidth - padding * 2;
  const plotHeight = canvasHeight - padding * 2;

  const depthRange = sectionInfo.maxDepth - sectionInfo.minDepth;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: canvasWidth + 20,
        height: canvasHeight + 60,
        backgroundColor: 'rgba(30,30,40,0.9)',
        borderRadius: 8,
        padding: 10,
        color: '#ffffff',
        fontFamily: 'sans-serif',
        fontSize: 12,
        pointerEvents: 'auto',
        zIndex: 100,
        transition: 'all 0.3s ease-in-out'
      }}
    >
      <div style={{ marginBottom: 8, color: '#5B9BD5', fontWeight: 'bold' }}>
        剖面视图 - {sectionInfo.axis.toUpperCase()}轴 @ {sectionInfo.position.toFixed(1)}
      </div>
      <svg
        width={canvasWidth}
        height={canvasHeight}
        style={{ display: 'block' }}
      >
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={canvasHeight - padding}
          stroke="#888"
          strokeWidth={2}
        />
        <line
          x1={padding}
          y1={canvasHeight - padding}
          x2={canvasWidth - padding}
          y2={canvasHeight - padding}
          stroke="#888"
          strokeWidth={2}
        />

        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = padding + plotHeight * t;
          const depth = sectionInfo.maxDepth - depthRange * t;
          return (
            <g key={i}>
              <line
                x1={padding - 5}
                y1={y}
                x2={padding}
                y2={y}
                stroke="#888"
                strokeWidth={1}
              />
              <text
                x={padding - 8}
                y={y + 4}
                fill="#aaa"
                fontSize={10}
                textAnchor="end"
              >
                {depth.toFixed(0)}m
              </text>
            </g>
          );
        })}

        {sectionInfo.regions.map((region, idx) => {
          const yTop =
            padding + plotHeight * (1 - (region.topDepth - sectionInfo.minDepth) / depthRange);
          const yBottom =
            padding + plotHeight * (1 - (region.bottomDepth - sectionInfo.minDepth) / depthRange);
          const height = Math.max(2, yBottom - yTop);
          const stratum = strata.find((s) => s.id === region.stratumId);
          if (!stratum) return null;

          return (
            <g key={idx}>
              <rect
                x={padding}
                y={yTop}
                width={plotWidth}
                height={height}
                fill={stratum.color}
                stroke="#ffffff"
                strokeWidth={0.5}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => {
                  setHoveredStratum(stratum);
                  const rect = (e.target as SVGElement).getBoundingClientRect();
                  setTooltipPos({ x: rect.right + 10, y: rect.top });
                }}
                onMouseLeave={() => setHoveredStratum(null)}
              />
              <text
                x={padding + plotWidth / 2}
                y={yTop + height / 2 + 4}
                fill="#ffffff"
                fontSize={10}
                textAnchor="middle"
                style={{ pointerEvents: 'none', fontWeight: 'bold' }}
              >
                {stratum.lithologyCode} - {stratum.thickness.toFixed(0)}m
              </text>
            </g>
          );
        })}

        <text
          x={canvasWidth / 2}
          y={canvasHeight - 8}
          fill="#aaa"
          fontSize={10}
          textAnchor="middle"
        >
          深度标尺 (m)
        </text>
      </svg>

      {hoveredStratum && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPos.x,
            top: tooltipPos.y,
            backgroundColor: 'rgba(0,0,0,0.95)',
            border: `1px solid ${hoveredStratum.color}`,
            borderRadius: 4,
            padding: 8,
            fontSize: 12,
            zIndex: 1000,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ color: hoveredStratum.color, fontWeight: 'bold', marginBottom: 4 }}>
            {hoveredStratum.name}
          </div>
          <div>岩性代号: {hoveredStratum.lithologyCode}</div>
          <div>厚度: {hoveredStratum.thickness.toFixed(1)} m</div>
          <div>纹理密度: {(hoveredStratum.textureDensity * 100).toFixed(0)}%</div>
        </div>
      )}
    </div>
  );
};

const Scene: React.FC<SceneProps> = ({
  strata,
  faults,
  modelSize,
  cameraMode,
  sectionCut,
  onSectionCutChange
}) => {
  const [sectionInfo, setSectionInfo] = useState<SectionInfo | null>(null);

  const handleSectionInfo = useCallback((info: SectionInfo | null) => {
    setSectionInfo(info);
  }, []);

  return (
    <>
      <Canvas
        style={{ width: '100%', height: '100%', background: '#1a1a2e' }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#1a1a2e']} />
        <fog attach="fog" args={['#1a1a2e', 400, 1000]} />
        <SceneContent
          strata={strata}
          faults={faults}
          modelSize={modelSize}
          cameraMode={cameraMode}
          sectionCut={sectionCut}
          onSectionInfo={handleSectionInfo}
        />
      </Canvas>
      <SectionOverlay sectionInfo={sectionInfo} strata={strata} />
    </>
  );
};

export default Scene;
