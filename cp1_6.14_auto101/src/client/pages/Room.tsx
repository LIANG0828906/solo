import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import InteractionPanel from '../components/InteractionPanel';
import axios from 'axios';
import { Socket } from 'socket.io-client';
import { PlayerData, PuzzleState, InteractableObject } from '../types';

interface RoomProps {
  socket: Socket;
}

const Room: React.FC<RoomProps> = ({ socket }) => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number>(0);
  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef({ x: 0, y: 0, locked: false });
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const raycasterRef = useRef(new THREE.Raycaster());
  const interactablesRef = useRef<THREE.Mesh[]>([]);
  const hoveredObjectRef = useRef<THREE.Mesh | null>(null);
  const lastMoveEmitRef = useRef(0);
  const bobTimeRef = useRef(0);
  const doorRef = useRef<THREE.Mesh | null>(null);
  const victoryCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const victoryAnimRef = useRef<number>(0);
  const joystickRef = useRef<{ active: boolean; dx: number; dy: number; startX: number; startY: number }>({
    active: false, dx: 0, dy: 0, startX: 0, startY: 0,
  });

  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [puzzleState, setPuzzleState] = useState<PuzzleState>({
    codebox1: false,
    painting1: false,
    book1: false,
    coop_buttons: false,
  });
  const [selectedObject, setSelectedObject] = useState<InteractableObject | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState(Date.now());
  const [showVictory, setShowVictory] = useState(false);
  const [isMobile] = useState(window.innerWidth < 768);

  const doorOpenRef = useRef(false);

  const handlePuzzleSolved = useCallback((puzzleId: string) => {
    setPuzzleState((prev) => {
      const next = { ...prev, [puzzleId]: true };
      const allSolved = Object.values(next).every(Boolean);
      if (allSolved) {
        doorOpenRef.current = true;
        socket.emit('puzzle-solved', { roomCode: code, puzzleId });
      }
      return next;
    });
  }, [socket, code]);

  const playerIdRef = useRef<string>('');

  useEffect(() => {
    const playerName = 'Player' + Math.floor(Math.random() * 900 + 100);

    axios.post(`/api/rooms/${code}/join`, { playerName }).then((res) => {
      const { player } = res.data;
      playerIdRef.current = player.id;
      socket.emit('join-room', { roomCode: code, playerId: player.id, playerName });
    }).catch(() => {
      socket.emit('join-room', { roomCode: code, playerId: '', playerName });
    });

    const onRoomUpdated = (data: { players: PlayerData[] }) => {
      if (data && data.players) {
        setPlayers(data.players);
      }
    };
    const onPlayerJoined = (data: { id: string; name: string }) => {
    };
    const onPuzzleSolved = (data: { puzzleId: string; puzzleState: Record<string, boolean> }) => {
      if (data.puzzleState) {
        setPuzzleState(data.puzzleState);
      }
      const allSolved = Object.values(data.puzzleState || {}).every(Boolean);
      if (allSolved) {
        doorOpenRef.current = true;
        setGameWon(true);
        setTimeout(() => setShowVictory(true), 500);
      }
    };
    const onGameWon = () => {
      doorOpenRef.current = true;
      setGameWon(true);
      setTimeout(() => setShowVictory(true), 500);
    };
    const onCooperativeProgress = (data: { isComplete: boolean }) => {
      if (data.isComplete) {
        handlePuzzleSolved('coop_buttons');
      }
    };

    socket.on('room-updated', onRoomUpdated);
    socket.on('player-joined', onPlayerJoined);
    socket.on('puzzle-solved', onPuzzleSolved);
    socket.on('game-won', onGameWon);
    socket.on('cooperative-progress', onCooperativeProgress);

    return () => {
      socket.off('room-updated', onRoomUpdated);
      socket.off('player-joined', onPlayerJoined);
      socket.off('puzzle-solved', onPuzzleSolved);
      socket.off('game-won', onGameWon);
      socket.off('cooperative-progress', onCooperativeProgress);
    };
  }, [socket, code, handlePuzzleSolved]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1a1a2e, 1, 30);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.6, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const floorGeo = new THREE.PlaneGeometry(12, 12);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const ceilingGeo = new THREE.PlaneGeometry(12, 12);
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x2c2c3e, roughness: 0.9 });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 3;
    scene.add(ceiling);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xd4c5a9, roughness: 0.7 });

    const northWall = new THREE.Mesh(new THREE.BoxGeometry(12, 3, 0.2), wallMat);
    northWall.position.set(0, 1.5, -6);
    scene.add(northWall);

    const southWall = new THREE.Mesh(new THREE.BoxGeometry(12, 3, 0.2), wallMat);
    southWall.position.set(0, 1.5, 6);
    scene.add(southWall);

    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 12), wallMat);
    eastWall.position.set(6, 1.5, 0);
    scene.add(eastWall);

    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 12), wallMat);
    westWall.position.set(-6, 1.5, 0);
    scene.add(westWall);

    const doorGeo = new THREE.BoxGeometry(1.5, 2.5, 0.3);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.6 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1.25, -5.9);
    scene.add(door);
    doorRef.current = door;

    const tableMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.6 });
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 1), tableMat);
    tableTop.position.set(2, 0.75, -3);
    scene.add(tableTop);

    const legGeo = new THREE.BoxGeometry(0.08, 0.75, 0.08);
    const positions: [number, number, number][] = [
      [1.35, 0.375, -2.55],
      [2.65, 0.375, -2.55],
      [1.35, 0.375, -3.45],
      [2.65, 0.375, -3.45],
    ];
    for (const pos of positions) {
      const leg = new THREE.Mesh(legGeo, tableMat);
      leg.position.set(...pos);
      scene.add(leg);
    }

    const codeboxMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.4, metalness: 0.3 });
    const codebox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.3), codeboxMat);
    codebox.position.set(2, 0.92, -3);
    codebox.userData = {
      id: 'codebox1',
      type: 'codebox',
      name: '密码箱',
      puzzleId: 'codebox1',
      interactable: true,
    };
    scene.add(codebox);
    interactablesRef.current.push(codebox);

    const paintingGroup = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.5 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.2, 0.05), frameMat);
    paintingGroup.add(frame);

    const colors = [0xff5722, 0xffeb3b, 0x4caf50, 0x2196f3, 0x9c27b0, 0xe91e63];
    const stripWidth = 1.5 / colors.length;
    for (let i = 0; i < colors.length; i++) {
      const stripMat = new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.5 });
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(stripWidth, 0.9), stripMat);
      strip.position.set(-0.65 + stripWidth * i + stripWidth / 2, 0, 0.03);
      paintingGroup.add(strip);
    }
    paintingGroup.position.set(-4, 2, -5.9);
    scene.add(paintingGroup);

    const paintingHitbox = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    paintingHitbox.position.set(-4, 2, -5.85);
    paintingHitbox.userData = {
      id: 'painting1',
      type: 'painting',
      name: '神秘画作',
      puzzleId: 'painting1',
      interactable: true,
    };
    scene.add(paintingHitbox);
    interactablesRef.current.push(paintingHitbox);

    const bookMat = new THREE.MeshStandardMaterial({ color: 0xb71c1c, roughness: 0.7 });
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.4), bookMat);
    book.position.set(-2, 0.025, 1);
    book.userData = {
      id: 'book1',
      type: 'book',
      name: '古老书籍',
      puzzleId: 'book1',
      interactable: true,
    };
    scene.add(book);
    interactablesRef.current.push(book);

    const buttonMat1 = new THREE.MeshStandardMaterial({ color: 0xf44336, roughness: 0.3, metalness: 0.5 });
    const button1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 16), buttonMat1);
    button1.rotation.x = Math.PI / 2;
    button1.position.set(-5.89, 1.5, -2);
    button1.userData = {
      id: 'button1',
      type: 'button',
      name: '机关按钮A',
      puzzleId: 'coop_buttons',
      interactable: true,
    };
    scene.add(button1);
    interactablesRef.current.push(button1);

    const buttonMat2 = new THREE.MeshStandardMaterial({ color: 0x2196f3, roughness: 0.3, metalness: 0.5 });
    const button2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 16), buttonMat2);
    button2.rotation.x = Math.PI / 2;
    button2.position.set(5.89, 1.5, 2);
    button2.rotation.z = Math.PI;
    button2.userData = {
      id: 'button2',
      type: 'button',
      name: '机关按钮B',
      puzzleId: 'coop_buttons',
      interactable: true,
    };
    scene.add(button2);
    interactablesRef.current.push(button2);

    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 15);
    pointLight.position.set(0, 2.5, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);

    const spotLight = new THREE.SpotLight(0xffe0b2, 0.8);
    spotLight.position.set(2, 2.8, -3);
    spotLight.target.position.set(2, 0, -3);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.5;
    scene.add(spotLight);
    scene.add(spotLight.target);

    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const onClick = () => {
      if (!mouseRef.current.locked) {
        renderer.domElement.requestPointerLock();
      }
    };
    renderer.domElement.addEventListener('click', onClick);

    const onPointerLockChange = () => {
      mouseRef.current.locked = document.pointerLockElement === renderer.domElement;
    };
    document.addEventListener('pointerlockchange', onPointerLockChange);

    const onMouseMove = (e: MouseEvent) => {
      if (!mouseRef.current.locked) return;
      yawRef.current -= e.movementX * 0.002;
      pitchRef.current -= e.movementY * 0.002;
      pitchRef.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, pitchRef.current));
    };
    document.addEventListener('mousemove', onMouseMove);

    const onMouseClick = (e: MouseEvent) => {
      if (!mouseRef.current.locked) return;
      raycasterRef.current.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycasterRef.current.intersectObjects(interactablesRef.current);
      if (intersects.length > 0) {
        const obj = intersects[0].object;
        if (obj.userData.interactable) {
          setSelectedObject({
            id: obj.userData.id,
            type: obj.userData.type,
            name: obj.userData.name,
            position: [obj.position.x, obj.position.y, obj.position.z],
            puzzleId: obj.userData.puzzleId,
          });
          document.exitPointerLock();
        }
      }
    };
    renderer.domElement.addEventListener('click', onMouseClick);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const halfW = container.clientWidth / 2;
        if (touch.clientX < halfW) {
          joystickRef.current.active = true;
          joystickRef.current.startX = touch.clientX;
          joystickRef.current.startY = touch.clientY;
          joystickRef.current.dx = 0;
          joystickRef.current.dy = 0;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const halfW = container.clientWidth / 2;
        if (touch.clientX >= halfW || joystickRef.current.active) {
          if (joystickRef.current.active && touch.clientX < halfW) {
            joystickRef.current.dx = touch.clientX - joystickRef.current.startX;
            joystickRef.current.dy = touch.clientY - joystickRef.current.startY;
          } else if (touch.clientX >= halfW) {
            const dx = touch.clientX - (halfW + (container.clientWidth - halfW) / 2);
            const dy = touch.clientY - container.clientHeight / 2;
            yawRef.current -= dx * 0.0003;
            pitchRef.current -= dy * 0.0003;
            pitchRef.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, pitchRef.current));
          }
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        joystickRef.current.active = false;
        joystickRef.current.dx = 0;
        joystickRef.current.dy = 0;
      }
    };

    if (isMobile) {
      container.addEventListener('touchstart', onTouchStart, { passive: false });
      container.addEventListener('touchmove', onTouchMove, { passive: false });
      container.addEventListener('touchend', onTouchEnd);
    }

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const keys = keysRef.current;
      const speed = 0.05;
      let moveX = 0;
      let moveZ = 0;
      let isMoving = false;

      if (keys['w'] || keys['arrowup']) { moveZ -= speed; isMoving = true; }
      if (keys['s'] || keys['arrowdown']) { moveZ += speed; isMoving = true; }
      if (keys['a'] || keys['arrowleft']) { moveX -= speed; isMoving = true; }
      if (keys['d'] || keys['arrowright']) { moveX += speed; isMoving = true; }

      if (isMobile && joystickRef.current.active) {
        const jx = joystickRef.current.dx / 50;
        const jy = joystickRef.current.dy / 50;
        moveX += Math.max(-1, Math.min(1, jx)) * speed;
        moveZ += Math.max(-1, Math.min(1, jy)) * speed;
        isMoving = Math.abs(jx) > 0.1 || Math.abs(jy) > 0.1;
      }

      const sinYaw = Math.sin(yawRef.current);
      const cosYaw = Math.cos(yawRef.current);
      const worldMoveX = moveX * cosYaw - moveZ * sinYaw;
      const worldMoveZ = moveX * sinYaw + moveZ * cosYaw;

      camera.position.x = Math.max(-5, Math.min(5, camera.position.x + worldMoveX));
      camera.position.z = Math.max(-5, Math.min(5, camera.position.z + worldMoveZ));

      if (isMoving) {
        bobTimeRef.current += 0.1;
        camera.position.y = 1.6 + Math.sin(bobTimeRef.current) * 0.04;
      } else {
        camera.position.y += (1.6 - camera.position.y) * 0.1;
      }

      const euler = new THREE.Euler(pitchRef.current, yawRef.current, 0, 'YXZ');
      camera.quaternion.setFromEuler(euler);

      raycasterRef.current.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycasterRef.current.intersectObjects(interactablesRef.current);

      if (hoveredObjectRef.current) {
        const prevMat = (hoveredObjectRef.current as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (prevMat.emissive) {
          prevMat.emissive.setHex(0x000000);
        }
        hoveredObjectRef.current = null;
      }

      if (intersects.length > 0 && intersects[0].object.userData.interactable) {
        const hitObj = intersects[0].object as THREE.Mesh;
        const hitMat = hitObj.material as THREE.MeshStandardMaterial;
        if (hitMat.emissive) {
          hitMat.emissive.setHex(0xffff00);
        }
        hoveredObjectRef.current = hitObj;
        renderer.domElement.style.cursor = 'pointer';
      } else {
        renderer.domElement.style.cursor = 'default';
      }

      const now = Date.now();
      if (isMoving && now - lastMoveEmitRef.current > 100) {
        socket.emit('player-move', {
          roomCode: code,
          position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
          rotation: { yaw: yawRef.current, pitch: pitchRef.current },
        });
        lastMoveEmitRef.current = now;
      }

      if (doorRef.current && doorOpenRef.current) {
        if (doorRef.current.rotation.y > -Math.PI / 2) {
          doorRef.current.rotation.y -= 0.02;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('click', onMouseClick);
      if (isMobile) {
        container.removeEventListener('touchstart', onTouchStart);
        container.removeEventListener('touchmove', onTouchMove);
        container.removeEventListener('touchend', onTouchEnd);
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [socket, code, isMobile]);

  useEffect(() => {
    if (!showVictory) return;
    const canvas = victoryCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Firework {
      x: number;
      y: number;
      vy: number;
      particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[];
      exploded: boolean;
      life: number;
    }

    const fireworks: Firework[] = [];

    const animate = () => {
      victoryAnimRef.current = requestAnimationFrame(animate);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (Math.random() < 0.05) {
        fireworks.push({
          x: Math.random() * canvas.width,
          y: canvas.height,
          vy: -(Math.random() * 4 + 6),
          particles: [],
          exploded: false,
          life: 1,
        });
      }

      for (let i = fireworks.length - 1; i >= 0; i--) {
        const fw = fireworks[i];
        if (!fw.exploded) {
          fw.y += fw.vy;
          fw.vy += 0.05;
          ctx.beginPath();
          ctx.arc(fw.x, fw.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#ffcc00';
          ctx.fill();
          if (fw.vy >= 0) {
            fw.exploded = true;
            const hue = Math.floor(Math.random() * 360);
            for (let j = 0; j < 30; j++) {
              const angle = (Math.PI * 2 * j) / 30;
              const speed = Math.random() * 3 + 1;
              fw.particles.push({
                x: fw.x,
                y: fw.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: `hsl(${hue + Math.random() * 40}, 100%, 60%)`,
              });
            }
          }
        } else {
          for (let j = fw.particles.length - 1; j >= 0; j--) {
            const p = fw.particles[j];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.03;
            p.life -= 0.015;
            if (p.life <= 0) {
              fw.particles.splice(j, 1);
              continue;
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2 * p.life, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
          if (fw.particles.length === 0) {
            fireworks.splice(i, 1);
          }
        }
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(victoryAnimRef.current);
    };
  }, [showVictory]);

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {players.map((player) => {
          const allDone = player.completedTasks && player.completedTasks.length >= 3;
          return (
            <div
              key={player.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(20, 20, 50, 0.7)',
                padding: '6px 12px',
                borderRadius: 20,
                border: allDone ? '2px solid #4caf50' : '2px solid transparent',
                animation: allDone ? 'spin 2s linear infinite' : 'none',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: player.color || '#7b2ff7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ color: '#e0e0ff', fontSize: '0.85rem', fontFamily: '"Segoe UI", sans-serif' }}>
                {player.name}
              </span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'rgba(20, 20, 50, 0.8)',
          border: '1px solid rgba(142, 45, 226, 0.4)',
          borderRadius: 10,
          padding: '8px 16px',
          color: '#c0b0ee',
          fontFamily: 'monospace',
          fontSize: '1rem',
          letterSpacing: 2,
        }}
      >
        房间: {code}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 56,
          right: 16,
          background: 'rgba(20, 20, 50, 0.8)',
          border: '1px solid rgba(142, 45, 226, 0.3)',
          borderRadius: 10,
          padding: '6px 14px',
          color: '#a0a0cc',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
        }}
      >
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          background: 'rgba(20, 20, 50, 0.7)',
          borderRadius: 8,
          padding: '6px 12px',
          color: '#8888bb',
          fontSize: '0.75rem',
          fontFamily: '"Segoe UI", sans-serif',
        }}
      >
        {isMobile ? '左侧摇杆移动，右侧滑动视角' : '点击画面锁定鼠标 | WASD移动 | 鼠标转向 | 点击交互'}
      </div>

      {isMobile && (
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: 30,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(142, 45, 226, 0.2)',
            border: '2px solid rgba(142, 45, 226, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(142, 45, 226, 0.6)',
              border: '1px solid rgba(200, 150, 255, 0.5)',
              transform: `translate(${joystickRef.current.dx * 0.3}px, ${joystickRef.current.dy * 0.3}px)`,
              transition: 'transform 0.05s',
            }}
          />
        </div>
      )}

      {hoveredObjectRef.current && !selectedObject && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#ffff00',
            fontSize: '0.8rem',
            fontFamily: '"Segoe UI", sans-serif',
            pointerEvents: 'none',
            marginTop: 30,
            textAlign: 'center',
          }}
        >
          □ 点击交互
        </div>
      )}

      {selectedObject && (
        <InteractionPanel
          object={selectedObject}
          puzzleState={puzzleState}
          socket={socket}
          onClose={() => setSelectedObject(null)}
          onSolved={handlePuzzleSolved}
        />
      )}

      {showVictory && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 100,
          }}
        >
          <canvas
            ref={victoryCanvasRef}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.4)',
            }}
          >
            <h1
              style={{
                fontFamily: 'cursive',
                fontSize: '4rem',
                color: '#ffd700',
                textShadow: '0 0 30px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 215, 0, 0.3)',
                marginBottom: 16,
              }}
            >
              恭喜逃脱
            </h1>
            <p
              style={{
                color: '#e0e0ff',
                fontSize: '1.4rem',
                fontFamily: '"Segoe UI", sans-serif',
                marginBottom: 32,
              }}
            >
              用时: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                border: 'none',
                borderRadius: 12,
                padding: '16px 40px',
                color: '#1a1a2e',
                fontSize: '1.3rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: '"Segoe UI", sans-serif',
                transition: 'transform 0.15s, box-shadow 0.15s',
                boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4)',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.transform = 'translateY(-3px)';
                (e.target as HTMLButtonElement).style.boxShadow = '0 8px 30px rgba(255, 215, 0, 0.6)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.target as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(255, 215, 0, 0.4)';
              }}
            >
              再来一局
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Room;
