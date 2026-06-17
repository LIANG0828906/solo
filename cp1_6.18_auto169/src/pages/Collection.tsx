import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PetInstance } from '@/data/petData';
import { openBlindBox, canOpenBlindBox } from '@/engine/blindBoxEngine';
import { useUserStore } from '@/stores/userStore';
import { useNavigate } from 'react-router-dom';
import ShelfScene from '@/components/ShelfScene';
import PetDetailCard from '@/components/PetDetailCard';
import UserPanel from '@/components/UserPanel';
import BlindBoxAnimation from '@/components/BlindBoxAnimation';

export default function Collection() {
  const navigate = useNavigate();
  const { selectedPetUid, pets, selectPet } = useUserStore();
  const [detailPet, setDetailPet] = useState<PetInstance | null>(null);
  const [blindBoxPet, setBlindBoxPet] = useState<PetInstance | null>(null);
  const [showBlindBox, setShowBlindBox] = useState(false);

  const selectedPet = pets.find((p) => p.uid === selectedPetUid) ?? null;

  const handleSlotClick = useCallback(
    (pet: PetInstance | null) => {
      if (pet) {
        setDetailPet(pet);
        selectPet(pet.uid);
      }
    },
    [selectPet]
  );

  const handleOpenBlindBox = useCallback(() => {
    if (!canOpenBlindBox()) {
      alert('积分不足！需要100积分才能开盲盒');
      return;
    }
    const pet = openBlindBox();
    if (!pet) {
      alert('展柜已满！请先整理展柜');
      return;
    }
    setBlindBoxPet(pet);
    setShowBlindBox(true);
  }, []);

  const handleBlindBoxComplete = useCallback(() => {
    setShowBlindBox(false);
    setBlindBoxPet(null);
  }, []);

  const handleBattle = useCallback(() => {
    if (selectedPet) {
      navigate('/battle', { state: { petUid: selectedPet.uid } });
    }
  }, [selectedPet, navigate]);

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        background: '#121212',
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas
          shadows
          camera={{ position: [0, 0, 20], fov: 50 }}
          style={{ background: '#121212' }}
          onCreated={({ camera }) => {
            camera.lookAt(0, 0, 0);
          }}
        >
          <ShelfScene onSlotClick={handleSlotClick} />
          <OrbitControls
            enablePan={false}
            rotateSpeed={0.5}
            minDistance={8}
            maxDistance={35}
            enableDamping
            dampingFactor={0.05}
          />
        </Canvas>

        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            color: '#e0e0e0',
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 24,
            fontWeight: 700,
            textShadow: '0 0 10px rgba(102,126,234,0.5)',
            letterSpacing: 2,
          }}
        >
          云宝阁
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 16,
            color: '#555',
            fontSize: 11,
          }}
        >
          拖拽旋转展柜 · 滚轮缩放 · 点击格子查看宠物
        </div>
      </div>

      <UserPanel onOpenBlindBox={handleOpenBlindBox} onBattle={handleBattle} selectedPet={selectedPet} />

      {detailPet && <PetDetailCard pet={detailPet} onClose={() => setDetailPet(null)} />}

      {showBlindBox && blindBoxPet && (
        <BlindBoxAnimation pet={blindBoxPet} onComplete={handleBlindBoxComplete} />
      )}
    </div>
  );
}
