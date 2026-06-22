import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  buildMolecule,
  collectInteractiveObjects,
  MOLECULES,
  ELEMENTS,
  BuiltMolecule,
  InteractiveObject,
  AtomMeshUserData,
  BondMeshUserData,
} from './MoleculeBuilder';

type Selection =
  | { type: 'atom'; symbol: string; atomicNumber: number; bondCount: number; elementName: string }
  | { type: 'bond'; atom1: string; atom2: string; bondType: string; energy: number }
  | null;

const MOLECULE_KEYS = Object.keys(MOLECULES);
const ELEMENT_NAMES: Record<string, string> = {
  H: '氢',
  C: '碳',
  O: '氧',
};
const BOND_TYPE_NAMES: Record<string, string> = {
  single: '单键',
  double: '双键',
  triple: '三键',
};

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const moleculeGroupRef = useRef<THREE.Group | null>(null);
  const currentMoleculeRef = useRef<BuiltMolecule | null>(null);
  const interactiveRef = useRef<InteractiveObject[]>([]);
  const rafIdRef = useRef<number>(0);

  const rotStateRef = useRef({
    theta: 0,
    phi: 0,
    rotVelX: 0,
    rotVelY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    moved: false,
  });

  const fadeStateRef = useRef({
    opacity: 1,
    phase: 'idle' as 'idle' | 'fadingOut' | 'fadingIn',
    nextKey: '',
  });

  const highlightTimeoutsRef = useRef<Map<string, number>>(new Map());
  const activeBondHighlightRef = useRef<THREE.Mesh | null>(null);

  const [currentKey, setCurrentKey] = useState('H2O');
  const [selection, setSelection] = useState<Selection>(null);
  const [selectionKey, setSelectionKey] = useState(0);

  const setSelectionSmooth = useCallback((sel: Selection) => {
    setSelection(sel);
    setSelectionKey((k) => k + 1);
  }, []);

  const clearAllHighlights = useCallback(() => {
    highlightTimeoutsRef.current.forEach((tid) => window.clearTimeout(tid));
    highlightTimeoutsRef.current.clear();

    const mol = currentMoleculeRef.current;
    if (mol) {
      mol.atomMeshes.forEach((mesh) => {
        const ud = mesh.userData as AtomMeshUserData;
        (ud.highlightMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      });
    }

    const bondMesh = activeBondHighlightRef.current;
    if (bondMesh) {
      resetBondHighlight(bondMesh);
      activeBondHighlightRef.current = null;
    }
  }, []);

  function resetBondHighlight(bondMesh: THREE.Mesh) {
    const ud = bondMesh.userData as BondMeshUserData;
    const applyReset = (cyl: THREE.Object3D) => {
      if (cyl instanceof THREE.Mesh && cyl.material instanceof THREE.MeshStandardMaterial) {
        cyl.material.opacity = ud.baseOpacity;
        const g = cyl.geometry as THREE.CylinderGeometry;
        const params = g.parameters;
        if (params.radiusTop !== ud.baseRadius) {
          g.dispose();
          const len = params.height;
          cyl.geometry = new THREE.CylinderGeometry(ud.baseRadius, ud.baseRadius, len, 16, 1, false);
        }
      }
    };
    if (bondMesh instanceof THREE.Group) {
      bondMesh.children.forEach(applyReset);
    } else {
      applyReset(bondMesh);
    }
  }

  function highlightBond(bondMesh: THREE.Mesh) {
    if (activeBondHighlightRef.current && activeBondHighlightRef.current !== bondMesh) {
      resetBondHighlight(activeBondHighlightRef.current);
    }
    activeBondHighlightRef.current = bondMesh;

    const ud = bondMesh.userData as BondMeshUserData;
    const thickRadius = ud.baseRadius * 1.8;
    const apply = (cyl: THREE.Object3D) => {
      if (cyl instanceof THREE.Mesh && cyl.material instanceof THREE.MeshStandardMaterial) {
        cyl.material.opacity = 1;
        const g = cyl.geometry as THREE.CylinderGeometry;
        const params = g.parameters;
        g.dispose();
        cyl.geometry = new THREE.CylinderGeometry(thickRadius, thickRadius, params.height, 16, 1, false);
        cyl.material.color.setHex(0xffc107);
      }
    };
    if (bondMesh instanceof THREE.Group) {
      bondMesh.children.forEach(apply);
    } else {
      apply(bondMesh);
    }
  }

  function highlightAtom(atomMesh: THREE.Mesh, duration: number) {
    const ud = atomMesh.userData as AtomMeshUserData;
    const highlightMat = ud.highlightMesh.material as THREE.MeshBasicMaterial;
    highlightMat.opacity = 0.7;
    const key = `atom_${ud.index}`;
    const oldTid = highlightTimeoutsRef.current.get(key);
    if (oldTid) window.clearTimeout(oldTid);
    const tid = window.setTimeout(() => {
      highlightMat.opacity = 0;
      highlightTimeoutsRef.current.delete(key);
    }, duration);
    highlightTimeoutsRef.current.set(key, tid);
  }

  const loadMolecule = useCallback((key: string) => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (moleculeGroupRef.current) {
      scene.remove(moleculeGroupRef.current);
      const old = currentMoleculeRef.current;
      if (old) {
        old.atomMeshes.forEach((m) => {
          m.geometry.dispose();
          (m.userData as AtomMeshUserData).baseMaterial.dispose();
          const hm = (m.userData as AtomMeshUserData).highlightMesh;
          hm.geometry.dispose();
          (hm.material as THREE.Material).dispose();
        });
        old.bondMeshes.forEach((m) => {
          const disposeMesh = (obj: THREE.Object3D) => {
            if (obj instanceof THREE.Mesh) {
              obj.geometry.dispose();
              if (Array.isArray(obj.material)) obj.material.forEach((mm) => mm.dispose());
              else obj.material.dispose();
            }
          };
          if (m instanceof THREE.Group) m.children.forEach(disposeMesh);
          else disposeMesh(m);
        });
      }
    }

    const built = buildMolecule(key);
    moleculeGroupRef.current = built.group;
    currentMoleculeRef.current = built;
    interactiveRef.current = collectInteractiveObjects(built);
    scene.add(built.group);

    setCurrentKey(key);
    clearAllHighlights();
    setSelectionSmooth(null);
  }, [clearAllHighlights, setSelectionSmooth]);

  const switchMolecule = useCallback(
    (key: string) => {
      if (key === currentKey || fadeStateRef.current.phase !== 'idle') return;
      fadeStateRef.current.phase = 'fadingOut';
      fadeStateRef.current.nextKey = key;
    },
    [currentKey]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.set(0, 0, 8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(5, 5, 8);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x8899ff, 0.35);
    fillLight.position.set(-5, -3, 5);
    scene.add(fillLight);
    const backLight = new THREE.DirectionalLight(0xffaa88, 0.25);
    backLight.position.set(0, 5, -8);
    scene.add(backLight);

    loadMolecule('H2O');

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const getPointer = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const rs = rotStateRef.current;
      rs.isDragging = true;
      rs.lastX = e.clientX;
      rs.lastY = e.clientY;
      rs.moved = false;
      rs.rotVelX = 0;
      rs.rotVelY = 0;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rs = rotStateRef.current;
      if (!rs.isDragging) return;
      const dx = e.clientX - rs.lastX;
      const dy = e.clientY - rs.lastY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) rs.moved = true;
      rs.theta += dx * 0.008;
      rs.phi += dy * 0.008;
      const LIMIT = Math.PI / 2 - 0.01;
      if (rs.phi > LIMIT) rs.phi = LIMIT;
      if (rs.phi < -LIMIT) rs.phi = -LIMIT;
      rs.rotVelY = dx * 0.008;
      rs.rotVelX = dy * 0.008;
      rs.lastX = e.clientX;
      rs.lastY = e.clientY;
    };

    const onMouseUp = (e: MouseEvent) => {
      const rs = rotStateRef.current;
      rs.isDragging = false;
      if (!rs.moved) {
        handleClick(e);
      }
    };

    const resolveInteractive = (obj: THREE.Object3D): InteractiveObject | null => {
      let cur: THREE.Object3D | null = obj;
      while (cur) {
        const ud = cur.userData as { kind?: string };
        if (ud && (ud.kind === 'atom' || ud.kind === 'bond')) {
          return cur as InteractiveObject;
        }
        cur = cur.parent;
      }
      return null;
    };

    const handleClick = (e: MouseEvent) => {
      getPointer(e);
      raycaster.setFromCamera(pointer, camera);
      const allObjects: THREE.Object3D[] = [];
      interactiveRef.current.forEach((obj) => {
        if (obj instanceof THREE.Group) {
          obj.children.forEach((c) => allObjects.push(c));
        } else {
          allObjects.push(obj);
        }
      });
      const intersects = raycaster.intersectObjects(allObjects, false);
      if (intersects.length === 0) {
        clearAllHighlights();
        setSelectionSmooth(null);
        return;
      }

      const resolved: { obj: InteractiveObject; dist: number }[] = [];
      for (const inter of intersects) {
        const r = resolveInteractive(inter.object);
        if (r) resolved.push({ obj: r, dist: inter.distance });
      }
      if (resolved.length === 0) {
        clearAllHighlights();
        setSelectionSmooth(null);
        return;
      }

      let targetObj: InteractiveObject;
      const bondHit = resolved.find((r) => r.obj.userData.kind === 'bond');
      if (bondHit && bondHit.dist < resolved[0].dist + 8.0) {
        targetObj = bondHit.obj;
      } else {
        targetObj = resolved[0].obj;
      }
      const ud = targetObj.userData;

      if (ud.kind === 'atom') {
        const atomUd = ud as AtomMeshUserData;
        highlightAtom(targetObj as THREE.Mesh, 300);
        const elem = ELEMENTS[atomUd.element];
        setSelectionSmooth({
          type: 'atom',
          symbol: elem.symbol,
          atomicNumber: elem.atomicNumber,
          bondCount: atomUd.bondCount,
          elementName: ELEMENT_NAMES[atomUd.element] || atomUd.element,
        });
      } else if (ud.kind === 'bond') {
        const bondUd = ud as BondMeshUserData;
        highlightBond(targetObj as THREE.Mesh);
        setSelectionSmooth({
          type: 'bond',
          atom1: bondUd.atom1,
          atom2: bondUd.atom2,
          bondType: BOND_TYPE_NAMES[bondUd.type],
          energy: bondUd.energy,
        });
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    let lastTime = performance.now();

    const animate = (time: number) => {
      rafIdRef.current = requestAnimationFrame(animate);
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const rs = rotStateRef.current;
      if (!rs.isDragging) {
        const damping = Math.pow(0.85, dt * 60);
        rs.rotVelX *= damping;
        rs.rotVelY *= damping;
        rs.theta += rs.rotVelY;
        rs.phi += rs.rotVelX;
        const LIMIT = Math.PI / 2 - 0.01;
        if (rs.phi > LIMIT) {
          rs.phi = LIMIT;
          rs.rotVelX = 0;
        }
        if (rs.phi < -LIMIT) {
          rs.phi = -LIMIT;
          rs.rotVelX = 0;
        }
        if (Math.abs(rs.rotVelX) < 0.0001) rs.rotVelX = 0;
        if (Math.abs(rs.rotVelY) < 0.0001) rs.rotVelY = 0;
      }

      const grp = moleculeGroupRef.current;
      if (grp) {
        grp.rotation.y = rs.theta;
        grp.rotation.x = rs.phi;
      }

      const fs = fadeStateRef.current;
      if (fs.phase === 'fadingOut') {
        fs.opacity -= dt * 2;
        if (grp) setGroupOpacity(grp, Math.max(0, fs.opacity));
        if (fs.opacity <= 0) {
          fs.opacity = 0;
          fs.phase = 'fadingIn';
          loadMolecule(fs.nextKey);
          const newGrp = moleculeGroupRef.current;
          if (newGrp) setGroupOpacity(newGrp, 0);
        }
      } else if (fs.phase === 'fadingIn') {
        fs.opacity += dt * 2;
        if (grp) setGroupOpacity(grp, Math.min(1, fs.opacity));
        if (fs.opacity >= 1) {
          fs.opacity = 1;
          fs.phase = 'idle';
          if (grp) setGroupOpacity(grp, 1, true);
        }
      }

      renderer.render(scene, camera);
    };
    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (dom.parentNode) dom.parentNode.removeChild(dom);
      highlightTimeoutsRef.current.forEach((tid) => window.clearTimeout(tid));
      highlightTimeoutsRef.current.clear();
    };
  }, [loadMolecule, clearAllHighlights, setSelectionSmooth]);

  function setGroupOpacity(grp: THREE.Group, opacity: number, restoreBondBase = false) {
    grp.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const m = obj.material;
        const mats = Array.isArray(m) ? m : [m];
        mats.forEach((mat) => {
          if (mat instanceof THREE.Material) {
            mat.transparent = true;
            if (restoreBondBase && mat instanceof THREE.MeshStandardMaterial) {
              mat.opacity = opacity === 1 ? 0.45 : opacity;
            } else {
              mat.opacity = opacity;
            }
          }
        });
      }
    });
  }

  const mol = MOLECULES[currentKey];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
      }}
    >
      <div
        style={{
          width: '80%',
          height: '100%',
          position: 'relative',
        }}
      >
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: '100%',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '24px',
            color: '#e0e0e0',
            fontFamily: 'Consolas, "Courier New", monospace',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '1px' }}>{mol.formula}</div>
          <div style={{ fontSize: '14px', opacity: 0.7, marginTop: '4px' }}>{mol.name}</div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '12px',
            zIndex: 10,
          }}
        >
          {MOLECULE_KEYS.map((k) => {
            const active = k === currentKey;
            return (
              <button
                key={k}
                onClick={() => switchMolecule(k)}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Consolas, "Courier New", monospace',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: active ? '#7986cb' : '#5c6bc0',
                  boxShadow: active
                    ? '0 4px 16px rgba(121, 134, 203, 0.5)'
                    : '0 2px 8px rgba(0,0,0,0.3)',
                  transition: 'background-color 0.2s, transform 0.15s, box-shadow 0.2s',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#7986cb';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5c6bc0';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                }}
              >
                {k}
              </button>
            );
          })}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '90px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.45)',
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: '12px',
            pointerEvents: 'none',
          }}
        >
          拖拽旋转 · 点击原子或键查看详情
        </div>
      </div>

      <div
        style={{
          width: '20%',
          minWidth: '280px',
          height: '100%',
          padding: '24px 20px',
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          color: '#e8e8f0',
          fontFamily: 'Consolas, "Courier New", monospace',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontSize: '18px',
            fontWeight: 700,
            marginBottom: '20px',
            paddingBottom: '14px',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
            letterSpacing: '0.5px',
          }}
        >
          信息面板
        </div>

        <div
          key={selectionKey}
          style={{
            opacity: 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          {selection === null ? (
            <div
              style={{
                fontSize: '13px',
                lineHeight: 1.8,
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              <div style={{ marginBottom: '16px' }}>当前分子：{mol.formula}（{mol.name}）</div>
              <div style={{ marginBottom: '8px' }}>· 原子数：{mol.atoms.length}</div>
              <div style={{ marginBottom: '8px' }}>· 化学键数：{mol.bonds.length}</div>
              <div style={{ marginTop: '24px', opacity: 0.8 }}>
                点击分子中的原子或化学键
                <br />
                查看详细信息
              </div>
            </div>
          ) : selection.type === 'atom' ? (
            <div style={{ fontSize: '13px', lineHeight: 2 }}>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  color: elementColorHex(selection.symbol),
                }}
              >
                ◉ {selection.symbol}
                <span style={{ fontSize: '13px', color: '#ccc', marginLeft: '10px', fontWeight: 400 }}>
                  {selection.elementName}
                </span>
              </div>
              <InfoRow label="元素符号" value={selection.symbol} />
              <InfoRow label="原子序数" value={String(selection.atomicNumber)} />
              <InfoRow label="键合数" value={String(selection.bondCount)} />
              <div
                style={{
                  marginTop: '20px',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.6,
                }}
              >
                第 {selection.atomicNumber} 号元素，
                <br />
                在该分子中形成 {selection.bondCount} 个化学键
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '13px', lineHeight: 2 }}>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  color: '#ffc107',
                }}
              >
                ═ {selection.atom1}
                {bondSymbol(selection.bondType)}
                {selection.atom2}
              </div>
              <InfoRow label="键类型" value={selection.bondType} />
              <InfoRow label="构成原子" value={`${selection.atom1} - ${selection.atom2}`} />
              <InfoRow
                label="键能"
                value={`${selection.energy} kJ/mol`}
                valueColor="#4caf50"
              />
              <div
                style={{
                  marginTop: '20px',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.6,
                }}
              >
                键能表示断裂该化学键所需的能量。
                <br />
                键能越大，化学键越稳定。
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: '32px',
            paddingTop: '18px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.35)',
            lineHeight: 1.8,
          }}
        >
          <div style={{ marginBottom: '8px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
            元素图例
          </div>
          <LegendItem color="#ffffff" label="H 氢 (1)" />
          <LegendItem color="#555555" label="C 碳 (6)" />
          <LegendItem color="#e53935" label="O 氧 (8)" />
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 0',
        borderBottom: '1px dashed rgba(255,255,255,0.06)',
      }}
    >
      <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px' }}>{label}</span>
      <span
        style={{
          fontWeight: 600,
          color: valueColor || '#ffffff',
          fontSize: '13px',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 0',
      }}
    >
      <div
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 6px ${color}88`,
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      />
      <span>{label}</span>
    </div>
  );
}

function elementColorHex(sym: string): string {
  const c = ELEMENTS[sym]?.color ?? 0xffffff;
  return '#' + c.toString(16).padStart(6, '0');
}

function bondSymbol(type: string): string {
  if (type === '单键') return '—';
  if (type === '双键') return '═';
  if (type === '三键') return '≡';
  return '—';
}
