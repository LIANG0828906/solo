import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { Droplets, Leaf, Sun, Camera, ArrowLeft, Share2 } from 'lucide-react';
import { usePlantStore } from '../stores/usePlantStore';
import { varietyNames, stageNames } from '../services/api';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

type EffectType = 'water' | 'fertilizer' | 'sunlight' | null;

export default function PlantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { plants, currentPlant, fetchPlants, setCurrentPlant, waterPlant, fertilizePlant, sunlightPlant, createPost, user } = usePlantStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const plantGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const [activeEffect, setActiveEffect] = useState<EffectType>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const plant = currentPlant || plants.find((p) => p.id === Number(id));

  useEffect(() => {
    if (!plant && plants.length === 0) {
      fetchPlants();
    } else if (plant) {
      setCurrentPlant(plant);
    }
  }, [plant, plants, fetchPlants, setCurrentPlant]);

  const createPlantModel = useCallback(() => {
    if (!plant || !plantGroupRef.current) return;

    const group = plantGroupRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    const stageScale = plant.stage === 'sprout' ? 0.4 : plant.stage === 'growing' ? 0.7 : plant.stage === 'flowering' ? 1.0 : 0.6;
    const healthMultiplier = plant.stage === 'wilting' ? 0.6 : 1.0;

    const potGeo = new THREE.CylinderGeometry(0.5, 0.4, 0.6, 16);
    const potMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.8 });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.y = -0.3;
    pot.castShadow = true;
    pot.receiveShadow = true;
    group.add(pot);

    const soilGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.1, 16);
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
    const soil = new THREE.Mesh(soilGeo, soilMat);
    soil.position.y = 0.05;
    group.add(soil);

    const stemHeight = 1.5 * stageScale * healthMultiplier;
    const stemGeo = new THREE.CylinderGeometry(0.08, 0.1, stemHeight, 8);
    const stemMat = new THREE.MeshStandardMaterial({ 
      color: plant.stage === 'wilting' ? 0x9e9e9e : 0x7cb342, 
      roughness: 0.7 
    });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = stemHeight / 2 + 0.1;
    stem.castShadow = true;
    group.add(stem);

    const leafColors = plant.variety === 'succulent' ? [0xab47bc, 0xba68c8, 0x9c27b0] 
      : plant.variety === 'cactus' ? [0x8bc34a, 0x9ccc65, 0x7cb342]
      : plant.variety === 'sunflower' ? [0x8bc34a, 0x9ccc65]
      : [0x66bb6a, 0x81c784, 0xa5d6a7];
    
    const leafCount = plant.stage === 'sprout' ? 2 : plant.stage === 'growing' ? 5 : 8;
    
    for (let i = 0; i < leafCount; i++) {
      const leafSize = (0.25 + Math.random() * 0.15) * stageScale;
      const leafGeo = new THREE.SphereGeometry(leafSize, 16, 16);
      leafGeo.scale(1, 0.6, 1.3);
      const leafMat = new THREE.MeshStandardMaterial({ 
        color: plant.stage === 'wilting' ? 0x9e9e9e : leafColors[i % leafColors.length], 
        roughness: 0.5,
        transparent: true,
        opacity: plant.stage === 'wilting' ? 0.6 : 0.95
      });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      
      const angle = (i / leafCount) * Math.PI * 2;
      const heightLevel = 0.3 + (i / leafCount) * (stemHeight - 0.2);
      const radius = 0.15 + Math.random() * 0.2 * stageScale;
      
      leaf.position.set(
        Math.cos(angle) * radius,
        heightLevel,
        Math.sin(angle) * radius
      );
      leaf.rotation.set(
        Math.random() * 0.5 - 0.25,
        angle,
        Math.random() * 0.3 - 0.15
      );
      leaf.castShadow = true;
      group.add(leaf);
    }

    if (plant.stage === 'flowering') {
      const flowerY = stemHeight + 0.1;
      if (plant.variety === 'sunflower') {
        const petalCount = 12;
        for (let i = 0; i < petalCount; i++) {
          const petalGeo = new THREE.SphereGeometry(0.12, 8, 8);
          petalGeo.scale(1, 0.4, 2);
          const petalMat = new THREE.MeshStandardMaterial({ color: 0xffc107, roughness: 0.4, emissive: 0xff9800, emissiveIntensity: 0.2 });
          const petal = new THREE.Mesh(petalGeo, petalMat);
          const angle = (i / petalCount) * Math.PI * 2;
          petal.position.set(
            Math.cos(angle) * 0.25,
            flowerY,
            Math.sin(angle) * 0.25
          );
          petal.rotation.set(0, angle, 0);
          petal.castShadow = true;
          group.add(petal);
        }
        const centerGeo = new THREE.SphereGeometry(0.18, 16, 16);
        const centerMat = new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.6 });
        const center = new THREE.Mesh(centerGeo, centerMat);
        center.position.y = flowerY;
        group.add(center);
      } else if (plant.variety === 'succulent') {
        for (let i = 0; i < 5; i++) {
          const petalGeo = new THREE.SphereGeometry(0.1, 8, 8);
          petalGeo.scale(1, 0.5, 1.5);
          const petalMat = new THREE.MeshStandardMaterial({ color: 0xf48fb1, roughness: 0.4, emissive: 0xec407a, emissiveIntensity: 0.15 });
          const petal = new THREE.Mesh(petalGeo, petalMat);
          const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
          petal.position.set(
            Math.cos(angle) * 0.18,
            flowerY + 0.1,
            Math.sin(angle) * 0.18
          );
          petal.rotation.set(Math.PI / 4, angle, 0);
          group.add(petal);
        }
        const centerGeo = new THREE.SphereGeometry(0.08, 12, 12);
        const centerMat = new THREE.MeshStandardMaterial({ color: 0xec407a, roughness: 0.4 });
        const center = new THREE.Mesh(centerGeo, centerMat);
        center.position.y = flowerY + 0.1;
        group.add(center);
      } else if (plant.variety === 'cactus') {
        const flowerGeo = new THREE.SphereGeometry(0.15, 12, 12);
        flowerGeo.scale(1, 0.8, 1);
        const flowerMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b, roughness: 0.3, emissive: 0xffc107, emissiveIntensity: 0.3 });
        const flower = new THREE.Mesh(flowerGeo, flowerMat);
        flower.position.y = flowerY + 0.15;
        group.add(flower);
      } else {
        for (let i = 0; i < 5; i++) {
          const petalGeo = new THREE.SphereGeometry(0.1, 8, 8);
          petalGeo.scale(1, 0.5, 1.3);
          const petalMat = new THREE.MeshStandardMaterial({ 
            color: i % 2 === 0 ? 0xe8f5e9 : 0xc8e6c9, 
            roughness: 0.5 
          });
          const petal = new THREE.Mesh(petalGeo, petalMat);
          const angle = (i / 5) * Math.PI * 2;
          petal.position.set(
            Math.cos(angle) * 0.15,
            flowerY,
            Math.sin(angle) * 0.15
          );
          petal.rotation.set(0, angle, 0);
          group.add(petal);
        }
      }
    }
  }, [plant]);

  useEffect(() => {
    if (!containerRef.current || !plant) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f8e9);
    scene.fog = new THREE.Fog(0xf1f8e9, 5, 15);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 4);
    camera.lookAt(0, 0.5, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(5, 8, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xa5d6a7, 0.3);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    const plantGroup = new THREE.Group();
    plantGroup.position.y = 0;
    scene.add(plantGroup);
    plantGroupRef.current = plantGroup;

    const groundGeo = new THREE.CircleGeometry(4, 64);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xe8f5e9, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.6;
    ground.receiveShadow = true;
    scene.add(ground);

    createPlantModel();

    let time = 0;
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      time += 0.016;

      if (plantGroupRef.current) {
        plantGroupRef.current.rotation.y = Math.sin(time * 0.3) * 0.15;
        plantGroupRef.current.children.forEach((child, index) => {
          if (index > 2) {
            child.rotation.z = Math.sin(time * 2 + index * 0.5) * 0.08;
          }
        });
      }

      particlesRef.current = particlesRef.current.filter((p) => {
        p.life -= 0.016;
        if (p.life <= 0) {
          scene.remove(p.mesh);
          return false;
        }
        p.mesh.position.add(p.velocity.clone().multiplyScalar(0.016));
        p.velocity.y -= 9.8 * 0.016;
        const scale = p.life / p.maxLife;
        p.mesh.scale.setScalar(scale);
        (p.mesh.material as THREE.Material).opacity = scale;
        return true;
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, [plant, createPlantModel]);

  useEffect(() => {
    if (sceneRef.current && plantGroupRef.current) {
      createPlantModel();
    }
  }, [plant?.stage, plant?.variety, createPlantModel]);

  const createParticles = (type: 'water' | 'fertilizer' | 'sunlight') => {
    if (!sceneRef.current || !plantGroupRef.current) return;

    const scene = sceneRef.current;
    const plantPos = new THREE.Vector3();
    plantGroupRef.current.getWorldPosition(plantPos);

    if (type === 'sunlight') {
      const glowGeo = new THREE.SphereGeometry(1.5, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffc107,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.copy(plantPos);
      glow.position.y += 1;
      scene.add(glow);
      particlesRef.current.push({
        mesh: glow,
        velocity: new THREE.Vector3(0, 0, 0),
        life: 1.5,
        maxLife: 1.5,
      });
      setActiveEffect('sunlight');
      setTimeout(() => setActiveEffect(null), 1500);
    } else {
      const particleCount = type === 'water' ? 20 : 15;
      const color = type === 'water' ? 0x42a5f5 : 0x8d6e63;
      const lifeTime = type === 'water' ? 0.8 : 1.2;

      for (let i = 0; i < particleCount; i++) {
        const size = type === 'water' ? 0.06 : 0.05;
        const geo = type === 'water' 
          ? new THREE.SphereGeometry(size, 8, 8) 
          : new THREE.BoxGeometry(size, size, size);
        const mat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 1,
        });
        const particle = new THREE.Mesh(geo, mat);
        particle.position.set(
          plantPos.x + (Math.random() - 0.5) * 0.4,
          plantPos.y + 2 + Math.random() * 0.3,
          plantPos.z + (Math.random() - 0.5) * 0.4
        );
        scene.add(particle);
        particlesRef.current.push({
          mesh: particle,
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            -2 - Math.random() * 2,
            (Math.random() - 0.5) * 2
          ),
          life: lifeTime,
          maxLife: lifeTime,
        });
      }
      setActiveEffect(type);
      setTimeout(() => setActiveEffect(null), lifeTime * 1000);
    }
  };

  const handleAction = async (action: 'water' | 'fertilizer' | 'sunlight') => {
    if (!plant) return;
    createParticles(action);
    try {
      if (action === 'water') await waterPlant(plant.id);
      else if (action === 'fertilizer') await fertilizePlant(plant.id);
      else await sunlightPlant(plant.id);
    } catch (err) {
      console.error('Action error:', err);
    }
  };

  const handleTakePhoto = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !plant) return;
    
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataURL = rendererRef.current.domElement.toDataURL('image/png');
    setShowShareModal(true);
  };

  const handleShare = async () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !plant || !user) return;
    
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const imageUrl = rendererRef.current.domElement.toDataURL('image/png');
    
    try {
      await createPost(plant.id, imageUrl, plant.variety);
      setShowShareModal(false);
      alert('分享成功！可在社区广场查看');
    } catch (err) {
      console.error('Share error:', err);
      alert('分享失败，请重试');
    }
  };

  if (!plant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-green-600 text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <header className="max-w-5xl mx-auto mb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-green-200 text-green-700 hover:bg-green-50 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            返回花园
          </button>
          <div className="text-right">
            <h1 className="text-xl font-bold text-green-800">{plant.name}</h1>
            <p className="text-sm text-green-600">
              {varietyNames[plant.variety]} · 已养护 {plant.days} 天
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        <div
          ref={containerRef}
          className="w-full rounded-2xl overflow-hidden shadow-xl bg-green-50 relative"
          style={{ height: '60vh', minHeight: '400px' }}
        >
          {activeEffect === 'sunlight' && (
            <div className="absolute inset-0 pointer-events-none sunlight-glow"
              style={{
                background: 'radial-gradient(circle, rgba(255,193,7,0.3) 0%, transparent 70%)',
              }}
            />
          )}
        </div>

        <div className="flex justify-center gap-6 md:gap-10 mt-8 mb-6 flex-wrap">
          <button
            className="action-btn action-btn-water"
            onClick={() => handleAction('water')}
            title="浇水"
          >
            <Droplets className="w-7 h-7 text-white" />
          </button>
          <button
            className="action-btn action-btn-fertilizer"
            onClick={() => handleAction('fertilizer')}
            title="施肥"
          >
            <Leaf className="w-7 h-7 text-white" />
          </button>
          <button
            className="action-btn action-btn-sunlight"
            onClick={() => handleAction('sunlight')}
            title="光照"
          >
            <Sun className="w-7 h-7 text-white" />
          </button>
          <button
            className="action-btn action-btn-camera"
            onClick={handleTakePhoto}
            title="拍照分享"
          >
            <Camera className="w-7 h-7 text-white" />
          </button>
        </div>

        <div className="status-dashboard mb-6">
          <div className="flex items-center gap-3 flex-1">
            <Droplets className="w-5 h-5 text-blue-500" />
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>水分</span>
                <span>{plant.water}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill-water" style={{ width: `${plant.water}%` }} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-1">
            <Leaf className="w-5 h-5 text-amber-800" />
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>肥料</span>
                <span>{plant.fertilizer}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill-fertilizer" style={{ width: `${plant.fertilizer}%` }} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-1">
            <Sun className="w-5 h-5 text-yellow-500" />
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>光照</span>
                <span>{plant.sunlight}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill-sunlight" style={{ width: `${plant.sunlight}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <span
            className="inline-block px-5 py-2 rounded-full text-sm font-semibold text-white"
            style={{
              background: plant.stage === 'sprout' ? 'linear-gradient(135deg, #81c784, #66bb6a)'
                : plant.stage === 'growing' ? 'linear-gradient(135deg, #4caf50, #388e3c)'
                : plant.stage === 'flowering' ? 'linear-gradient(135deg, #f06292, #ec407a)'
                : 'linear-gradient(135deg, #9e9e9e, #757575)'
            }}
          >
            当前状态：{stageNames[plant.stage]}
          </span>
        </div>
      </main>

      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
              <Share2 className="w-6 h-6 text-green-600" />
              分享到社区
            </h2>
            <div className="aspect-square bg-green-50 rounded-xl mb-4 overflow-hidden">
              {rendererRef.current && (
                <img
                  src={rendererRef.current.domElement.toDataURL('image/png')}
                  alt="植物快照"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <p className="text-gray-600 mb-4">
              将你的 <span className="font-semibold text-green-700">{plant.name}</span> 分享到社区广场？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
              >
                取消
              </button>
              <button onClick={handleShare} className="flex-1 btn-primary">
                分享
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
