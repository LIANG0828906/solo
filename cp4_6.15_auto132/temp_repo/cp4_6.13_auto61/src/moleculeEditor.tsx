import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import {
  useMoleculeStore,
  getAtom3DRadius,
  getAtom3DColor,
  generateFormula,
  type Atom,
  type Bond,
} from './moleculeStore'

function AtomMesh({ atom, isSelected, isHovered, onSelect, onHover, isGhost }: {
  atom: Atom
  isSelected: boolean
  isHovered: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  isGhost?: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)
  const radius = getAtom3DRadius(atom.element)
  const color = getAtom3DColor(atom.element)
  const [hovered, setHovered] = useState(false)

  useFrame(() => {
    if (glowRef.current) {
      const s = isSelected ? 1.5 + Math.sin(Date.now() * 0.005) * 0.15 : hovered || isHovered ? 1.3 : 1.0
      glowRef.current.scale.setScalar(s)
      glowRef.current.visible = isSelected || hovered || isHovered
    }
  })

  return (
    <group position={atom.position}>
      <mesh
        ref={meshRef}
        onClick={e => { e.stopPropagation(); onSelect(atom.id) }}
        onPointerOver={e => { e.stopPropagation(); setHovered(true); onHover(atom.id) }}
        onPointerOut={e => { e.stopPropagation(); setHovered(false); onHover(null) }}
        castShadow
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.1}
          transparent={isGhost}
          opacity={isGhost ? 0.4 : 1}
        />
      </mesh>
      <mesh ref={glowRef} visible={false}>
        <sphereGeometry args={[radius * 1.35, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>
      <Text
        position={[0, 0, radius + 0.15]}
        fontSize={0.18}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {atom.element}
      </Text>
    </group>
  )
}

function BondMesh({ bond, atoms, isSelected, onSelect, onDoubleClick }: {
  bond: Bond
  atoms: Atom[]
  isSelected: boolean
  onSelect: (id: string) => void
  onDoubleClick: (id: string) => void
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const atomA = atoms.find(a => a.id === bond.atomAId)
  const atomB = atoms.find(a => a.id === bond.atomBId)

  if (!atomA || !atomB) return null

  const midPoint: [number, number, number] = [
    (atomA.position[0] + atomB.position[0]) / 2,
    (atomA.position[1] + atomB.position[1]) / 2,
    (atomA.position[2] + atomB.position[2]) / 2,
  ]

  const dir = new THREE.Vector3(
    atomB.position[0] - atomA.position[0],
    atomB.position[1] - atomA.position[1],
    atomB.position[2] - atomA.position[2],
  )
  const length = dir.length()
  dir.normalize()

  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)

  const bondRadius = 0.04
  const offsets = bond.order === 1 ? [0] : bond.order === 2 ? [-0.06, 0.06] : [-0.09, 0, 0.09]

  const color = isSelected ? '#ffffff' : '#aabbdd'

  return (
    <group
      ref={groupRef}
      onClick={e => { e.stopPropagation(); onSelect(bond.id) }}
      onDoubleClick={e => { e.stopPropagation(); onDoubleClick(bond.id) }}
    >
      {offsets.map((offset, i) => {
        const perp = new THREE.Vector3()
        if (dir.x !== 0 || dir.z !== 0) {
          perp.crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize()
        } else {
          perp.crossVectors(dir, new THREE.Vector3(1, 0, 0)).normalize()
        }
        const offsetVec = perp.multiplyScalar(offset)

        return (
          <mesh
            key={i}
            position={[midPoint[0] + offsetVec.x, midPoint[1] + offsetVec.y, midPoint[2] + offsetVec.z]}
            quaternion={quaternion}
          >
            <cylinderGeometry args={[bondRadius, bondRadius, length, 8]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={0.8}
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
        )
      })}
      {isSelected && (
        <mesh position={midPoint} quaternion={quaternion}>
          <cylinderGeometry args={[0.1, 0.1, length, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
        </mesh>
      )}
    </group>
  )
}

function StarField() {
  const starsRef = useRef<THREE.Points>(null!)
  const count = 800

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100
      pos[i * 3 + 1] = (Math.random() - 0.5) * 100
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100
    }
    return pos
  }, [])

  useFrame(() => {
    if (starsRef.current) {
      starsRef.current.rotation.y += 0.00005
    }
  })

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.15} color="#ffffff" transparent opacity={0.7} sizeAttenuation />
    </points>
  )
}

function DropPlane({ onDrop }: { onDrop: (element: string, point: THREE.Vector3) => void }) {
  const { raycaster, camera } = useThree()
  const planeRef = useRef<THREE.Mesh>(null!)
  const store = useMoleculeStore

  const handlePointerUp = useCallback((e: any) => {
    const dragState = store.getState().dragState
    if (dragState.isDragging && dragState.element) {
      e.stopPropagation()
      const point = e.point.clone()
      onDrop(dragState.element, point)
      store.getState().setDragState({ element: null, isDragging: false })
    }
  }, [onDrop])

  return (
    <mesh
      ref={planeRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onPointerUp={handlePointerUp}
      visible={false}
    >
      <planeGeometry args={[50, 50]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  )
}

function ReactionAnimation({ brokenBonds, formedBonds, atoms }: {
  brokenBonds: { atomAId: string; atomBId: string; order: number }[]
  formedBonds: { atomAId: string; atomBId: string; order: number }[]
  atoms: Atom[]
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const particlesRef = useRef<THREE.Points>(null!)
  const phase = useMoleculeStore(s => s.reactionPhase)
  const progress = useMoleculeStore(s => s.reactionProgress)
  const setPhase = useMoleculeStore(s => s.setReactionPhase)
  const updateProgress = useMoleculeStore(s => s.updateReactionProgress)
  const finishReaction = useMoleculeStore(s => s.finishReaction)

  const particleCount = brokenBonds.length * 20 + formedBonds.length * 20
  const particlePositions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.5
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.5
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5
    }
    return pos
  }, [particleCount])

  useFrame((_, delta) => {
    if (phase === 'idle') return

    const newProgress = progress + delta / 2.5
    updateProgress(newProgress)

    if (phase === 'breaking' && newProgress >= 1) {
      setPhase('forming')
      updateProgress(0)
    } else if (phase === 'forming' && newProgress >= 1) {
      finishReaction()
    }

    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      if (phase === 'breaking') {
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] += (Math.random() - 0.5) * delta * 2
          positions[i * 3 + 1] += (Math.random() - 0.5) * delta * 2
          positions[i * 3 + 2] += (Math.random() - 0.5) * delta * 2
        }
      } else if (phase === 'forming') {
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] *= 0.95
          positions[i * 3 + 1] *= 0.95
          positions[i * 3 + 2] *= 0.95
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  if (phase === 'idle') return null

  const breakPoints: [number, number, number][] = []
  for (const bc of brokenBonds) {
    const a = atoms.find(at => at.id === bc.atomAId)
    const b = atoms.find(at => at.id === bc.atomBId)
    if (a && b) {
      breakPoints.push([
        (a.position[0] + b.position[0]) / 2,
        (a.position[1] + b.position[1]) / 2,
        (a.position[2] + b.position[2]) / 2,
      ])
    }
  }

  return (
    <group ref={groupRef}>
      {breakPoints.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#ff4444" transparent opacity={phase === 'breaking' ? 0.8 : 0.3} />
        </mesh>
      ))}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color={phase === 'breaking' ? '#ff6644' : '#44ff88'}
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>
    </group>
  )
}

function ShowcaseRotation() {
  const phase = useMoleculeStore(s => s.reactionPhase)
  const groupRef = useRef<THREE.Group>(null!)

  useFrame((_, delta) => {
    if (phase === 'showcase' && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5
    }
  })

  return <group ref={groupRef} />
}

function Scene() {
  const atoms = useMoleculeStore(s => s.currentAtoms)
  const bonds = useMoleculeStore(s => s.currentBonds)
  const selectedAtomId = useMoleculeStore(s => s.selectedAtomId)
  const selectedBondId = useMoleculeStore(s => s.selectedBondId)
  const hoveredAtomId = useMoleculeStore(s => s.hoveredAtomId)
  const isReacting = useMoleculeStore(s => s.isReacting)
  const reactionPhase = useMoleculeStore(s => s.reactionPhase)
  const reactionResult = useMoleculeStore(s => s.reactionResult)

  const selectAtom = useMoleculeStore(s => s.selectAtom)
  const selectBond = useMoleculeStore(s => s.selectBond)
  const setHoveredAtom = useMoleculeStore(s => s.setHoveredAtom)
  const addAtom = useMoleculeStore(s => s.addAtom)
  const addBond = useMoleculeStore(s => s.addBond)
  const upgradeBond = useMoleculeStore(s => s.upgradeBond)

  const pendingBondAtom = useRef<string | null>(null)

  const handleAtomSelect = useCallback((id: string) => {
    if (isReacting) return
    if (pendingBondAtom.current && pendingBondAtom.current !== id) {
      addBond(pendingBondAtom.current, id)
      pendingBondAtom.current = null
    } else {
      selectAtom(id)
      pendingBondAtom.current = id
    }
  }, [isReacting, addBond, selectAtom])

  const handleBondSelect = useCallback((id: string) => {
    if (isReacting) return
    selectBond(id)
    pendingBondAtom.current = null
  }, [isReacting, selectBond])

  const handleBondDoubleClick = useCallback((id: string) => {
    if (isReacting) return
    upgradeBond(id)
  }, [isReacting, upgradeBond])

  const handleDrop = useCallback((element: string, point: THREE.Vector3) => {
    addAtom(element, [point.x, point.y, point.z])
  }, [addAtom])

  const handleBackgroundClick = useCallback(() => {
    selectAtom(null)
    selectBond(null)
    pendingBondAtom.current = null
  }, [selectAtom, selectBond])

  return (
    <>
      <color attach="background" args={['#0a0520']} />
      <fog attach="fog" args={['#0a0520', 15, 40]} />

      <ambientLight intensity={0.4} />
      <pointLight position={[5, 8, 5]} intensity={0.8} color="#aaccff" />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#ccaaff" />
      <pointLight position={[0, -3, 5]} intensity={0.3} color="#ffccaa" />

      <StarField />
      <DropPlane onDrop={handleDrop} />

      <group onPointerMissed={handleBackgroundClick}>
        {atoms.map(atom => (
          <AtomMesh
            key={atom.id}
            atom={atom}
            isSelected={selectedAtomId === atom.id}
            isHovered={hoveredAtomId === atom.id}
            onSelect={handleAtomSelect}
            onHover={setHoveredAtom}
          />
        ))}
        {bonds.map(bond => (
          <BondMesh
            key={bond.id}
            bond={bond}
            atoms={atoms}
            isSelected={selectedBondId === bond.id}
            onSelect={handleBondSelect}
            onDoubleClick={handleBondDoubleClick}
          />
        ))}
      </group>

      {isReacting && reactionResult && (
        <ReactionAnimation
          brokenBonds={reactionResult.brokenBonds}
          formedBonds={reactionResult.formedBonds}
          atoms={atoms}
        />
      )}

      {reactionPhase === 'showcase' && <ShowcaseRotation />}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        maxDistance={30}
        minDistance={2}
        makeDefault
      />
    </>
  )
}

function MoleculeShelf() {
  const savedMolecules = useMoleculeStore(s => s.savedMolecules)
  const loadMolecule = useMoleculeStore(s => s.loadMolecule)
  const deleteMolecule = useMoleculeStore(s => s.deleteMolecule)
  const reactantA = useMoleculeStore(s => s.reactantA)
  const reactantB = useMoleculeStore(s => s.reactantB)
  const setReactantA = useMoleculeStore(s => s.setReactantA)
  const setReactantB = useMoleculeStore(s => s.setReactantB)
  const isReacting = useMoleculeStore(s => s.isReacting)

  return (
    <div className="molecule-shelf">
      <h3 className="panel-title">分子架</h3>
      {savedMolecules.length === 0 ? (
        <div className="shelf-empty">尚无保存的分子</div>
      ) : (
        <div className="shelf-cards">
          {savedMolecules.map(mol => {
            const isA = reactantA === mol.id
            const isB = reactantB === mol.id
            return (
              <div
                key={mol.id}
                className={`shelf-card ${isA ? 'card-reactant-a' : ''} ${isB ? 'card-reactant-b' : ''}`}
              >
                <div className="card-preview">
                  {mol.atoms.slice(0, 6).map(a => (
                    <span key={a.id} className="preview-atom" style={{ background: getAtom3DColor(a.element) }}>
                      {a.element}
                    </span>
                  ))}
                  {mol.atoms.length > 6 && <span className="preview-more">+{mol.atoms.length - 6}</span>}
                </div>
                <div className="card-info">
                  <span className="card-formula">{mol.formula}</span>
                  <span className="card-name">{mol.name}</span>
                </div>
                <div className="card-actions">
                  <button className="card-btn" onClick={() => loadMolecule(mol.id)} title="加载到场景">📂</button>
                  <button
                    className={`card-btn ${isA ? 'active-a' : ''}`}
                    onClick={() => setReactantA(isA ? null : mol.id)}
                    title="设为反应物A"
                    disabled={isReacting}
                  >A</button>
                  <button
                    className={`card-btn ${isB ? 'active-b' : ''}`}
                    onClick={() => setReactantB(isB ? null : mol.id)}
                    title="设为反应物B"
                    disabled={isReacting}
                  >B</button>
                  <button className="card-btn card-btn-delete" onClick={() => deleteMolecule(mol.id)} title="删除">🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ReactionControls() {
  const reactionType = useMoleculeStore(s => s.reactionType)
  const setReactionType = useMoleculeStore(s => s.setReactionType)
  const reactantA = useMoleculeStore(s => s.reactantA)
  const reactantB = useMoleculeStore(s => s.reactantB)
  const savedMolecules = useMoleculeStore(s => s.savedMolecules)
  const isReacting = useMoleculeStore(s => s.isReacting)
  const reactionPhase = useMoleculeStore(s => s.reactionPhase)
  const startReaction = useMoleculeStore(s => s.startReaction)

  const molA = savedMolecules.find(m => m.id === reactantA)
  const molB = savedMolecules.find(m => m.id === reactantB)

  const canReact = molA && molB && !isReacting

  const handleReact = () => {
    if (!molA || !molB) return
    const { executeReaction } = require('./chemicalReaction')
    const result = executeReaction(molA, molB, reactionType)
    startReaction(result)
  }

  const types: { key: 'substitution' | 'addition' | 'elimination'; label: string }[] = [
    { key: 'substitution', label: '取代反应' },
    { key: 'addition', label: '加成反应' },
    { key: 'elimination', label: '消除反应' },
  ]

  return (
    <div className="reaction-controls">
      <h3 className="panel-title">化学反应</h3>
      <div className="reaction-types">
        {types.map(t => (
          <button
            key={t.key}
            className={`reaction-type-btn ${reactionType === t.key ? 'active' : ''}`}
            onClick={() => setReactionType(t.key)}
            disabled={isReacting}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="reaction-reactants">
        <div className={`reactant-slot ${molA ? 'has-reactant' : ''}`}>
          <span className="slot-label">反应物A</span>
          <span className="slot-value">{molA ? molA.formula : '未选择'}</span>
        </div>
        <span className="reaction-arrow">+</span>
        <div className={`reactant-slot ${molB ? 'has-reactant' : ''}`}>
          <span className="slot-label">反应物B</span>
          <span className="slot-value">{molB ? molB.formula : '未选择'}</span>
        </div>
        <span className="reaction-arrow">→</span>
        <div className="reactant-slot">
          <span className="slot-label">产物</span>
          <span className="slot-value">?</span>
        </div>
      </div>
      <button
        className="react-btn"
        onClick={handleReact}
        disabled={!canReact}
      >
        {isReacting ? `反应中... (${reactionPhase})` : '触发反应'}
      </button>
    </div>
  )
}

function Toolbar() {
  const selectedAtomId = useMoleculeStore(s => s.selectedAtomId)
  const selectedBondId = useMoleculeStore(s => s.selectedBondId)
  const removeAtom = useMoleculeStore(s => s.removeAtom)
  const removeBond = useMoleculeStore(s => s.removeBond)
  const saveMolecule = useMoleculeStore(s => s.saveMolecule)
  const clearScene = useMoleculeStore(s => s.clearScene)
  const currentAtoms = useMoleculeStore(s => s.currentAtoms)
  const [showSave, setShowSave] = useState(false)
  const [saveName, setSaveName] = useState('')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedAtomId) removeAtom(selectedAtomId)
        else if (selectedBondId) removeBond(selectedBondId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAtomId, selectedBondId, removeAtom, removeBond])

  const handleSave = () => {
    if (saveName.trim() && currentAtoms.length > 0) {
      saveMolecule(saveName.trim())
      setSaveName('')
      setShowSave(false)
    }
  }

  return (
    <div className="toolbar">
      <div className="toolbar-info">
        {selectedAtomId && <span className="toolbar-hint">已选中原子 (Delete删除)</span>}
        {selectedBondId && <span className="toolbar-hint">已选中键 (Delete删除, 双击升级)</span>}
        {!selectedAtomId && !selectedBondId && (
          <span className="toolbar-hint">点击原子选择，选中两个原子自动生成键</span>
        )}
      </div>
      <div className="toolbar-actions">
        {showSave ? (
          <div className="save-row">
            <input
              className="save-input"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="分子名称"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <button className="toolbar-btn" onClick={handleSave}>确认</button>
            <button className="toolbar-btn" onClick={() => setShowSave(false)}>取消</button>
          </div>
        ) : (
          <>
            <button className="toolbar-btn" onClick={() => setShowSave(true)} disabled={currentAtoms.length === 0}>
              保存分子
            </button>
            <button className="toolbar-btn toolbar-btn-danger" onClick={clearScene} disabled={currentAtoms.length === 0}>
              清空场景
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export const MoleculeEditor: React.FC = () => {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return (
    <div className="editor-container">
      <div className="scene-area" onDragOver={handleDragOver} onDrop={handleDrop}>
        <Toolbar />
        <Canvas
          camera={{ position: [0, 5, 10], fov: 50, near: 0.1, far: 100 }}
          shadows
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => {
            gl.setClearColor('#0a0520')
          }}
        >
          <Scene />
        </Canvas>
      </div>
      <div className="panel-area">
        <AtomPanel />
        <MoleculeShelf />
        <ReactionControls />
      </div>
    </div>
  )
}
