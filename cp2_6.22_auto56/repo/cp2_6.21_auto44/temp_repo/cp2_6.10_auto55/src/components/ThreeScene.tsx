import React, { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { AnimatePresence } from "framer-motion";
import {
  useStore,
  isInRiver,
  generateId,
  getFormationPositions,
  calculateTransformationTime,
  calculateMatchPercentage,
} from "../store";
import {
  UnitType,
  UnitState,
  UNIT_COLORS,
  Unit,
} from "../types";

interface UnitMeshProps {
  unit: Unit;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrag: (id: string, x: number, z: number) => void;
}

const Chariot: React.FC<{ color: string; isMoving: boolean }> = ({
  color,
  isMoving,
}) => {
  const wheelRef1 = useRef<THREE.Mesh>(null);
  const wheelRef2 = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (isMoving) {
      if (wheelRef1.current) wheelRef1.current.rotation.x += delta * 8;
      if (wheelRef2.current) wheelRef2.current.rotation.x += delta * 8;
    }
  });

  return (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.8, 0.4, 0.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh ref={wheelRef1} position={[-0.35, 0.15, 0.25]}>
        <cylinderGeometry args={[0.15, 0.15, 0.08, 12]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>
      <mesh ref={wheelRef2} position={[0.35, 0.15, 0.25]}>
        <cylinderGeometry args={[0.15, 0.15, 0.08, 12]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>
      <mesh ref={wheelRef1} position={[-0.35, 0.15, -0.25]}>
        <cylinderGeometry args={[0.15, 0.15, 0.08, 12]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>
      <mesh ref={wheelRef2} position={[0.35, 0.15, -0.25]}>
        <cylinderGeometry args={[0.15, 0.15, 0.08, 12]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>
    </group>
  );
};

const Infantry: React.FC<{ color: string }> = ({ color }) => {
  return (
    <group>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.5, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#d4a574" />
      </mesh>
      <mesh position={[0.25, 0.4, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
        <meshStandardMaterial color="#8b7355" />
      </mesh>
      <mesh position={[0.25, 0.75, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <coneGeometry args={[0.06, 0.15, 6]} />
        <meshStandardMaterial color="#c0c0c0" />
      </mesh>
    </group>
  );
};

const Archer: React.FC<{ color: string }> = ({ color }) => {
  return (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.6, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#d4a574" />
      </mesh>
      <mesh position={[0.2, 0.5, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <cylinderGeometry args={[0.015, 0.015, 0.7, 6]} />
        <meshStandardMaterial color="#8b7355" />
      </mesh>
      <mesh position={[0.2, 0.85, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <coneGeometry args={[0.04, 0.12, 6]} />
        <meshStandardMaterial color="#c0c0c0" />
      </mesh>
      <mesh position={[-0.1, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.12, 0.02, 6, 16, Math.PI]} />
        <meshStandardMaterial color="#8b7355" />
      </mesh>
    </group>
  );
};

const Cavalry: React.FC<{ color: string; isMoving: boolean }> = ({
  color,
  isMoving,
}) => {
  const tailRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (isMoving && tailRef.current) {
      timeRef.current += delta * 5;
      tailRef.current.rotation.z = Math.sin(timeRef.current) * 0.3;
    }
  });

  return (
    <group>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.6, 0.4, 0.25]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.35, 0.5, 0]}>
        <boxGeometry args={[0.2, 0.3, 0.22]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.35, 0.45, 0]} ref={tailRef}>
        <cylinderGeometry args={[0.03, 0.01, 0.3, 6]} />
        <meshStandardMaterial color="#2a1a0a" />
      </mesh>
      <mesh position={[-0.25, 0.15, 0.1]}>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.25, 0.15, 0.1]}>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.25, 0.15, -0.1]}>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.25, 0.15, -0.1]}>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.25, 8]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#d4a574" />
      </mesh>
    </group>
  );
};

const DustTrail: React.FC<{
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
}> = ({ startX, startZ, endX, endZ }) => {
  const [opacity, setOpacity] = useState(0.3);

  useEffect(() => {
    const timer = setTimeout(() => setOpacity(0), 1000);
    return () => clearTimeout(timer);
  }, []);

  const points = useMemo(() => {
    const pts = [];
    pts.push(new THREE.Vector3(startX, 0.01, startZ));
    pts.push(new THREE.Vector3(endX, 0.01, endZ));
    return pts;
  }, [startX, startZ, endX, endZ]);

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [points]);

  return (
    <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({
      color: "#e6d5a0",
      transparent: true,
      opacity: opacity,
      linewidth: 2,
    }))} />
  );
};

interface Particle {
  id: number;
  x: number;
  z: number;
  vx: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
}

const GoldParticles: React.FC<{ trigger: boolean }> = ({ trigger }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger) {
      const newParticles: Particle[] = [];
      const units = useStore.getState().units;
      units.forEach((unit) => {
        for (let i = 0; i < 3; i++) {
          newParticles.push({
            id: Date.now() + Math.random(),
            x: unit.x + (Math.random() - 0.5) * 0.5,
            z: unit.z + (Math.random() - 0.5) * 0.5,
            vx: (Math.random() - 0.5) * 2,
            vz: (Math.random() - 0.5) * 2,
            life: 1.2,
            maxLife: 1.2,
            size: 0.02 + Math.random() * 0.02,
          });
        }
      });
      setParticles((prev) => [...prev, ...newParticles]);
    }
  }, [trigger]);

  useFrame((_, delta) => {
    setParticles((prev) =>
      prev
        .map((p) => ({
          ...p,
          x: p.x + p.vx * delta,
          z: p.z + p.vz * delta,
          life: p.life - delta,
        }))
        .filter((p) => p.life > 0)
    );

    if (particlesRef.current && particles.length > 0) {
      const positions = new Float32Array(particles.length * 3);
      const colors = new Float32Array(particles.length * 3);
      const sizes = new Float32Array(particles.length);

      particles.forEach((p, i) => {
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = 0.5 + (1 - p.life / p.maxLife) * 1.5;
        positions[i * 3 + 2] = p.z;
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.84;
        colors[i * 3 + 2] = 0;
        sizes[i] = p.size * (p.life / p.maxLife);
      });

      particlesRef.current.geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      particlesRef.current.geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(colors, 3)
      );
      particlesRef.current.geometry.setAttribute(
        "size",
        new THREE.BufferAttribute(sizes, 1)
      );
    }
  });

  if (particles.length === 0) return null;

  return (
    <points ref={particlesRef}>
      <bufferGeometry />
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
};

const UnitMesh: React.FC<UnitMeshProps> = ({
  unit,
  onDragStart,
  onDragEnd,
  onDrag,
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { camera, raycaster } = useThree();
  const groundPlane = useRef<THREE.Plane>(
    new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  );

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setIsDragging(true);
    onDragStart(unit.id);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(mouse, camera);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(groundPlane.current, intersectPoint);

      if (intersectPoint) {
        const x = Math.max(0, Math.min(10, intersectPoint.x));
        const z = Math.max(0, Math.min(10, intersectPoint.z));
        onDrag(unit.id, x, z);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      onDragEnd();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, unit.id, camera, raycaster, onDrag, onDragEnd]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.x = unit.x;
      meshRef.current.position.z = unit.z;
      meshRef.current.rotation.y = unit.rotation;
    }
  });

  const renderUnit = () => {
    const color = UNIT_COLORS[unit.type];
    const isMoving = unit.state === UnitState.MOVING;

    switch (unit.type) {
      case UnitType.CHARIOT:
        return <Chariot color={color} isMoving={isMoving} />;
      case UnitType.INFANTRY:
        return <Infantry color={color} />;
      case UnitType.ARCHER:
        return <Archer color={color} />;
      case UnitType.CAVALRY:
        return <Cavalry color={color} isMoving={isMoving} />;
      default:
        return null;
    }
  };

  return (
    <group
      ref={meshRef}
      onPointerDown={handlePointerDown}
    >
      {renderUnit()}
      <AnimatePresence>
        {unit.isFlashing && (
          <mesh position={[0, 0.5, 0]}>
            <ringGeometry args={[0.4, 0.5, 16]} />
            <meshBasicMaterial
              color="#ff0000"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </AnimatePresence>
    </group>
  );
};

const River: React.FC = () => {
  const riverShape = useMemo(() => {
    const shape = new THREE.Shape();
    const start = { x: 2, z: 3 };
    const end = { x: 8, z: 7 };
    const width = 0.5;

    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    const nx = -dz / len;
    const nz = dx / len;

    shape.moveTo(start.x + nx * width, start.z + nz * width);
    shape.lineTo(end.x + nx * width, end.z + nz * width);
    shape.lineTo(end.x - nx * width, end.z - nz * width);
    shape.lineTo(start.x - nx * width, start.z - nz * width);
    shape.closePath();

    return shape;
  }, []);

  const geometry = useMemo(() => {
    return new THREE.ShapeGeometry(riverShape);
  }, [riverShape]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <meshStandardMaterial color="#4a8ac4" transparent opacity={0.8} />
    </mesh>
  );
};

const Terrain: React.FC = () => {
  const gridHelper = useMemo(() => {
    return new THREE.GridHelper(10, 10, "#8a7a5a", "#8a7a5a");
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, 0, 5]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#b7a67b" />
      </mesh>
      <primitive object={gridHelper} position={[5, 0.01, 5]} />
      <River />
    </group>
  );
};

interface SceneContentProps {
  draggedUnitType: UnitType | null;
  onUnitPlaced: () => void;
  onFormationComplete: () => void;
}

const SceneContent: React.FC<SceneContentProps> = ({
  draggedUnitType,
  onUnitPlaced,
  onFormationComplete,
}) => {
  const {
    units,
    addUnit,
    updateUnit,
    currentFormation,
    setMatchPercentage,
    setTransformationTime,
    addScore,
    isRecording,
    addRecordFrame,
  } = useStore();

  const { camera, raycaster } = useThree();
  const [, setDraggingUnitId] = useState<string | null>(null);
  const [dustTrails, setDustTrails] = useState<
    Array<{ id: string; startX: number; startZ: number; endX: number; endZ: number }>
  >([]);
  const [particleTrigger, setParticleTrigger] = useState(false);
  const animatingRef = useRef(false);
  const groundPlane = useRef<THREE.Plane>(
    new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  );
  const lastRecordTime = useRef(0);

  const handleCanvasClick = useCallback(
    (e: any) => {
      if (!draggedUnitType) return;

      const remaining = useStore.getState().remainingUnits[draggedUnitType];
      if (remaining <= 0) return;

      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(mouse, camera);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(groundPlane.current, intersectPoint);

      if (intersectPoint) {
        const x = Math.max(0, Math.min(10, Math.round(intersectPoint.x)));
        const z = Math.max(0, Math.min(10, Math.round(intersectPoint.z)));

        const newUnit: Unit = {
          id: generateId(),
          type: draggedUnitType,
          x: x + 0.5,
          z: z + 0.5,
          rotation: 0,
          state: UnitState.IDLE,
          isInRiver: isInRiver(x + 0.5, z + 0.5),
          isFlashing: false,
        };

        addUnit(newUnit);
        useStore
          .getState()
          .setRemainingUnits(
            draggedUnitType,
            useStore.getState().remainingUnits[draggedUnitType] - 1
          );
        onUnitPlaced();

        const formation = useStore.getState().currentFormation;
        if (formation) {
          const match = calculateMatchPercentage(
            useStore.getState().units,
            formation
          );
          setMatchPercentage(match);
        }
      }
    },
    [draggedUnitType, camera, raycaster, addUnit, onUnitPlaced, setMatchPercentage]
  );

  const handleDragStart = useCallback((id: string) => {
    setDraggingUnitId(id);
  }, []);

  const handleDrag = useCallback(
    (id: string, x: number, z: number) => {
      if (animatingRef.current) return;

      const snappedX = Math.max(0, Math.min(10, Math.round(x - 0.5)) + 0.5);
      const snappedZ = Math.max(0, Math.min(10, Math.round(z - 0.5)) + 0.5);

      const unit = units.find((u) => u.id === id);
      if (unit && (unit.x !== snappedX || unit.z !== snappedZ)) {
        const inRiver = isInRiver(snappedX, snappedZ);
        updateUnit(id, {
          x: snappedX,
          z: snappedZ,
          isInRiver: inRiver,
        });

        const formation = useStore.getState().currentFormation;
        if (formation) {
          setTimeout(() => {
            const match = calculateMatchPercentage(
              useStore.getState().units,
              formation
            );
            setMatchPercentage(match);
          }, 50);
        }
      }
    },
    [units, updateUnit, setMatchPercentage]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingUnitId(null);
  }, []);

  useEffect(() => {
    if (!currentFormation || units.length === 0) return;

    const targetPositions = getFormationPositions(currentFormation, units);
    const time = calculateTransformationTime(units, targetPositions);
    setTransformationTime(time);
    setParticleTrigger(true);

    const centerX = 5;
    const centerZ = 5;

    const trails: Array<{
      id: string;
      startX: number;
      startZ: number;
      endX: number;
      endZ: number;
    }> = [];

    targetPositions.forEach((target, id) => {
      const unit = units.find((u) => u.id === id);
      if (unit) {
        trails.push({
          id: `${id}-${Date.now()}`,
          startX: unit.x,
          startZ: unit.z,
          endX: target.x,
          endZ: target.z,
        });
      }
    });
    setDustTrails(trails);

    animatingRef.current = true;
    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      units.forEach((unit) => {
        const target = targetPositions.get(unit.id);
        if (target) {
          const newX = unit.x + (target.x - unit.x) * eased;
          const newZ = unit.z + (target.z - unit.z) * eased;
          const angle = Math.atan2(centerX - unit.x, centerZ - unit.z);

          updateUnit(unit.id, {
            x: newX,
            z: newZ,
            rotation: angle,
            state: progress < 1 ? UnitState.MOVING : UnitState.IDLE,
            isInRiver: isInRiver(newX, newZ),
          });
        }
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        animatingRef.current = false;
        setTimeout(() => {
          setDustTrails([]);
        }, 1000);

        const match = calculateMatchPercentage(
          useStore.getState().units,
          currentFormation
        );
        setMatchPercentage(match);

        if (match >= 80) {
          addScore(10);
        } else if (match >= 60) {
          addScore(5);
        } else if (match >= 40) {
          addScore(1);
        }

        const riverUnits = useStore
          .getState()
          .units.filter((u) => u.isInRiver);
        if (riverUnits.length > 3) {
          riverUnits.forEach((unit) => {
            updateUnit(unit.id, { isFlashing: true });
            addScore(-2);
            setTimeout(() => {
              updateUnit(unit.id, { isFlashing: false });
            }, 500);
          });
        }

        onFormationComplete();
      }
    };

    animate();
  }, [currentFormation]);

  useFrame(() => {
    if (isRecording) {
      const now = Date.now();
      if (now - lastRecordTime.current >= 100) {
        lastRecordTime.current = now;
        const frame = {
          timestamp: now,
          units: units.map((u) => ({
            id: u.id,
            x: u.x,
            z: u.z,
            rotation: u.rotation,
            state: u.state,
          })),
        };
        addRecordFrame(frame);
      }
    }
  });

  return (
    <group onClick={handleCanvasClick}>
      <Terrain />
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
      />
      <Stars radius={100} depth={50} count={3000} factor={4} fade speed={1} />

      {units.map((unit) => (
        <UnitMesh
          key={unit.id}
          unit={unit}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrag={handleDrag}
        />
      ))}

      {dustTrails.map((trail) => (
        <DustTrail
          key={trail.id}
          startX={trail.startX}
          startZ={trail.startZ}
          endX={trail.endX}
          endZ={trail.endZ}
        />
      ))}

      <GoldParticles trigger={particleTrigger} />
    </group>
  );
};

const ThreeScene: React.FC = () => {
  const [draggedUnitType, setDraggedUnitType] = useState<UnitType | null>(null);
  const [formationKey, setFormationKey] = useState(0);

  const handleUnitPlaced = () => {
    setDraggedUnitType(null);
  };

  const handleFormationComplete = () => {
    setFormationKey((prev) => prev + 1);
  };

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const unitType = e.dataTransfer?.getData("unitType") as UnitType;
      if (unitType) {
        setDraggedUnitType(unitType);
      }
    };

    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas
        camera={{ position: [5, 12, 12], fov: 50 }}
        style={{ background: "linear-gradient(to bottom, #87ceeb, #c8b298)" }}
        onPointerMissed={() => {
          if (draggedUnitType) {
            setDraggedUnitType(null);
          }
        }}
      >
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={30}
          panSpeed={0.1}
          zoomSpeed={0.5}
        />
        <SceneContent
          key={formationKey}
          draggedUnitType={draggedUnitType}
          onUnitPlaced={handleUnitPlaced}
          onFormationComplete={handleFormationComplete}
        />
      </Canvas>
    </div>
  );
};

export default ThreeScene;
