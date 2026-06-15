import { useRef, useEffect, useCallback } from 'react';
import { X, Plus } from 'lucide-react';
import * as THREE from 'three';
import { usePlanetStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import type { Planet } from '@/types/planet';

interface InfoPanelProps {
  planet: Planet | null;
  onClose: () => void;
  orbitalProgress: number;
}

const RING_RADIUS = 40;
const RING_STROKE = 4;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface DataRowProps {
  label: string;
  value: string;
  unit?: string;
}

function DataRow({ label, value, unit }: DataRowProps) {
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <span className="font-mono-data text-sm text-[var(--text-primary)]">
        {value}
        {unit && (
          <span className="ml-0.5 text-[10px] text-[var(--text-muted)]">
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}

function OrbitalRing({ progress }: { progress: number }) {
  const offset = RING_CIRCUMFERENCE * (1 - progress);
  return (
    <svg
      width={108}
      height={108}
      viewBox="0 0 108 108"
      className="shrink-0"
    >
      <circle
        cx={54}
        cy={54}
        r={RING_RADIUS}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={RING_STROKE}
      />
      <circle
        cx={54}
        cy={54}
        r={RING_RADIUS}
        fill="none"
        stroke="url(#ringGradient)"
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform="rotate(-90 54 54)"
        className="transition-[stroke-dashoffset] duration-500"
      />
      <defs>
        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--accent-blue)" />
          <stop offset="100%" stopColor="var(--accent-purple)" />
        </linearGradient>
      </defs>
      <text
        x={54}
        y={50}
        textAnchor="middle"
        dominantBaseline="central"
        className="font-mono-data"
        fill="var(--text-primary)"
        fontSize={16}
        fontWeight={600}
      >
        {(progress * 100).toFixed(1)}%
      </text>
      <text
        x={54}
        y={68}
        textAnchor="middle"
        fill="var(--text-muted)"
        fontSize={8}
      >
        公转进度
      </text>
    </svg>
  );
}

function MiniPlanetCanvas({ planet }: { planet: Planet }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const frameRef = useRef<number>(0);
  const meshRef = useRef<THREE.Mesh | null>(null);

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 2.5;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const geometry = new THREE.SphereGeometry(0.8, 32, 32);
    const color = new THREE.Color(planet.color);
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    meshRef.current = mesh;
    scene.add(mesh);

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 1.0);
    directional.position.set(3, 2, 4);
    scene.add(directional);

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      if (meshRef.current) {
        meshRef.current.rotation.y += 0.008;
      }
      renderer.render(scene, camera);
    };
    animate();
  }, [planet.color]);

  useEffect(() => {
    initScene();

    return () => {
      cancelAnimationFrame(frameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        const dom = rendererRef.current.domElement;
        if (dom.parentNode) {
          dom.parentNode.removeChild(dom);
        }
      }
      if (meshRef.current) {
        meshRef.current.geometry.dispose();
        (meshRef.current.material as THREE.Material).dispose();
      }
    };
  }, [initScene]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[140px] rounded-lg overflow-hidden bg-black/20"
    />
  );
}

function InfoPanel({ planet, onClose, orbitalProgress }: InfoPanelProps) {
  const addToCompare = usePlanetStore((s) => s.addToCompare);
  const compareList = usePlanetStore((s) => s.compareList);

  if (!planet) return null;

  const isCompared = compareList.includes(planet.id);
  const compareFull = compareList.length >= 3;

  const handleAddCompare = () => {
    if (!isCompared && !compareFull) {
      addToCompare(planet.id);
    }
  };

  return (
    <div
      className={cn(
        'fixed top-14 right-0 bottom-0 z-40 w-[320px] sm:w-[320px]',
        'max-sm:w-full max-sm:top-14',
        'glass overflow-y-auto p-4 flex flex-col gap-4',
        'animate-slide-in-right'
      )}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 rounded-full p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-smooth"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col items-center gap-2 pr-8">
        <h2 className="text-2xl font-bold text-gradient">{planet.name}</h2>
        <span className="text-xs tracking-widest text-[var(--text-muted)] uppercase">
          {planet.nameEn}
        </span>
      </div>

      <MiniPlanetCanvas planet={planet} />

      <div className="flex items-center justify-center">
        <OrbitalRing progress={orbitalProgress} />
      </div>

      <div className="rounded-lg bg-white/[0.03] p-3">
        <DataRow label="直径" value={planet.diameter.toLocaleString()} unit="km" />
        <DataRow label="距太阳" value={planet.distance.toLocaleString()} unit="万km" />
        <DataRow label="公转周期" value={planet.orbitalPeriod.toLocaleString()} unit="天" />
        <DataRow label="卫星数量" value={String(planet.moons)} unit="颗" />
        <DataRow label="质量" value={planet.mass.toExponential(2)} unit="kg" />
        <DataRow label="表面引力" value={planet.gravity.toFixed(2)} unit="g" />
        <DataRow label="自转周期" value={planet.rotationPeriod.toFixed(2)} unit="小时" />
      </div>

      <button
        onClick={handleAddCompare}
        disabled={isCompared || compareFull}
        className={cn(
          'flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-smooth',
          isCompared
            ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] cursor-default'
            : compareFull
              ? 'bg-white/5 text-[var(--text-muted)] cursor-not-allowed'
              : 'glass glass-hover glow-hover text-[var(--text-secondary)] hover:text-[var(--accent-purple)]'
        )}
      >
        <Plus className="h-4 w-4" />
        {isCompared ? '已添加对比' : compareFull ? '对比已满 (3/3)' : '添加到对比'}
      </button>
    </div>
  );
}

export default InfoPanel;
