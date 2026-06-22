import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PetSpecies, PetBreed, ColorScheme, BreedInfo } from '../types';
import { petApi } from '../api';
import { useGameStore } from '../stores/gameStore';
import PetSprite from '../components/PetSprite';
import { sfx } from '../utils/audio';
import { uid } from '../utils/helpers';

const PetSelection: React.FC = () => {
  const navigate = useNavigate();
  const registerUser = useGameStore(s => s.registerUser);
  const createPet = useGameStore(s => s.createPet);

  const [nickname, setNickname] = useState('');
  const [petName, setPetName] = useState('');
  const [species, setSpecies] = useState<PetSpecies>('cat');
  const [breed, setBreed] = useState<PetBreed>('domestic');
  const [scheme, setScheme] = useState<ColorScheme>(0);
  const [breeds, setBreeds] = useState<{ cats: BreedInfo[]; dogs: BreedInfo[] } | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    petApi.getBreeds().then(setBreeds);
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem('pet_user_id');
    const petId = localStorage.getItem('pet_id');
    if (userId && petId) {
      petApi.getPet(petId).then(p => {
        useGameStore.getState().registerUser(localStorage.getItem('pet_nickname') ?? '主人');
        useGameStore.getState().restorePet(p);
        navigate('/room', { replace: true });
      }).catch(() => { /* ignore */ });
    }
  }, [navigate]);

  const currentList = species === 'cat' ? breeds?.cats : breeds?.dogs;
  const currentBreedInfo = currentList?.find(b => b.id === breed);

  const previewPet = currentBreedInfo ? {
    id: 'preview',
    ownerId: 'x',
    ownerName: '预览',
    name: petName || '小可爱',
    species,
    breed,
    colorScheme: scheme,
    level: 1,
    exp: 0,
    hunger: 80, happiness: 80, cleanliness: 80, energy: 80,
  } : null;

  const canNext1 = nickname.trim().length >= 2;
  const canNext3 = petName.trim().length >= 1;

  return (
    <div className="page-container" style={{
      background: 'linear-gradient(135deg, #E3F2FD 0%, #FCE4EC 50%, #FFF8E1 100%)',
    }}>
      <div className="cartoon-card" style={{
        maxWidth: 520, width: '100%',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h1 style={{
            fontFamily: 'var(--font-cartoon)',
            fontSize: 32,
            background: 'linear-gradient(135deg, #FF6B35, #FFA726)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>🐾 萌宠乐园 🐾</h1>
          <p style={{ color: '#8D6E63', fontSize: 14, marginTop: 4 }}>
            领养属于你的专属小伙伴吧~
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 18 }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800,
              background: step >= (n as 1 | 2 | 3) ? 'linear-gradient(135deg,#FFE082,#FFA726)' : '#E0E0E0',
              color: step >= (n as 1 | 2 | 3) ? '#fff' : '#9E9E9E',
              boxShadow: step >= (n as 1 | 2 | 3) ? '0 4px 10px rgba(255,152,0,0.35)' : 'none',
              transition: 'all 0.4s',
              border: '2px solid rgba(255,255,255,0.6)',
            }}>{n}</div>
          ))}
        </div>

        {step === 1 && (
          <div style={{ animation: 'levelup-badge 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <h3 style={{ color: '#5D4037', marginBottom: 14, fontSize: 17 }}>👋 先告诉我你的昵称吧~</h3>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="输入你的昵称（至少2字）"
              style={{
                width: '100%', padding: '14px 18px', borderRadius: 14,
                background: '#FFF8E1', border: '2.5px solid #FFCC80',
                fontSize: 16, color: '#5D4037', fontWeight: 600,
              }}
            />
            <button
              className="cartoon-btn"
              style={{ width: '100%', marginTop: 18, padding: '14px' }}
              disabled={!canNext1}
              onClick={() => { sfx.success(); registerUser(nickname.trim()); setStep(2); }}
            >下一步 →</button>
          </div>
        )}

        {step === 2 && breeds && (
          <div style={{ animation: 'levelup-badge 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <h3 style={{ color: '#5D4037', marginBottom: 14, fontSize: 17 }}>🐱🐶 选择宠物种类</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {(['cat', 'dog'] as PetSpecies[]).map(sp => (
                <button
                  key={sp}
                  onClick={() => {
                    sfx.click();
                    setSpecies(sp);
                    const list = sp === 'cat' ? breeds.cats : breeds.dogs;
                    setBreed(list[0].id as PetBreed);
                    setScheme(0);
                  }}
                  style={{
                    padding: '16px', borderRadius: 16,
                    background: species === sp ? 'linear-gradient(135deg,#FFE082,#FFB74D)' : '#FFF8E1',
                    border: species === sp ? '3px solid #FF9800' : '2.5px solid #FFE0B2',
                    fontWeight: 800, fontSize: 18, color: species === sp ? '#fff' : '#5D4037',
                    transition: 'var(--transition-fast)',
                    boxShadow: species === sp ? '0 8px 20px rgba(255,152,0,0.3)' : 'none',
                  }}
                >{sp === 'cat' ? '🐱 我要猫咪' : '🐶 我要狗狗'}</button>
              ))}
            </div>

            <h4 style={{ color: '#5D4037', margin: '8px 0 10px', fontSize: 14 }}>选择品种</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
              {currentList?.map(b => (
                <button
                  key={b.id}
                  onClick={() => { sfx.click(); setBreed(b.id as PetBreed); setScheme(0); }}
                  style={{
                    padding: '10px 6px', borderRadius: 12,
                    background: breed === b.id ? 'linear-gradient(135deg,#CE93D8,#AB47BC)' : '#F3E5F5',
                    border: breed === b.id ? '2.5px solid #8E24AA' : '2px solid #E1BEE7',
                    color: breed === b.id ? '#fff' : '#6A1B9A',
                    fontWeight: 700, fontSize: 12,
                    transition: 'var(--transition-fast)',
                  }}
                >{b.name}</button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <button onClick={() => { sfx.click(); setStep(1); }}
                style={{
                  padding: '12px 22px', borderRadius: 12,
                  background: '#FFCCBC', color: '#BF360C',
                  fontWeight: 700,
                }}>← 返回</button>
              <button
                className="cartoon-btn"
                onClick={() => { sfx.success(); setStep(3); }}
              >下一步 →</button>
            </div>
          </div>
        )}

        {step === 3 && currentBreedInfo && (
          <div style={{ animation: 'levelup-badge 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <h3 style={{ color: '#5D4037', marginBottom: 10, fontSize: 17 }}>✨ 最后一步！取名字 + 选配色</h3>
            <input
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="给宝贝起个名字~"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                background: '#FFF8E1', border: '2.5px solid #FFCC80',
                fontSize: 15, color: '#5D4037', fontWeight: 600,
                marginBottom: 10,
              }}
            />
            <div style={{
              background: 'linear-gradient(135deg,#E3F2FD,#FCE4EC)',
              borderRadius: 20, padding: 14, marginBottom: 12,
              display: 'flex', justifyContent: 'center',
              minHeight: 180, alignItems: 'center',
            }}>
              {previewPet && <PetSprite pet={previewPet} size={170} />}
            </div>
            <h4 style={{ color: '#5D4037', margin: '4px 0 8px', fontSize: 13 }}>选择配色</h4>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
              {currentBreedInfo.colors.map((col, idx) => (
                <button
                  key={idx}
                  onClick={() => { sfx.click(); setScheme(idx as ColorScheme); }}
                  style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${col.body}, ${col.ears})`,
                    border: scheme === idx ? '4px solid #FF9800' : '3px solid #fff',
                    boxShadow: scheme === idx ? '0 6px 18px rgba(255,152,0,0.45)' : '0 2px 6px rgba(0,0,0,0.1)',
                    position: 'relative',
                    transition: 'var(--transition-fast)',
                    transform: scheme === idx ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
                    width: 8, height: 8, borderRadius: '50%', background: col.eyes,
                    boxShadow: '0 0 0 1.5px rgba(255,255,255,0.8)',
                  }} />
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <button onClick={() => { sfx.click(); setStep(2); }}
                style={{
                  padding: '12px 22px', borderRadius: 12,
                  background: '#FFCCBC', color: '#BF360C',
                  fontWeight: 700,
                }}>← 返回</button>
              <button
                className="cartoon-btn"
                disabled={!canNext3 || loading}
                onClick={async () => {
                  setLoading(true);
                  sfx.success();
                  try {
                    await createPet({
                      ownerName: nickname.trim(),
                      species, breed, colorScheme: scheme,
                      name: petName.trim(),
                    });
                    setTimeout(() => navigate('/room', { replace: true }), 300);
                  } catch (e) {
                    setLoading(false);
                  }
                }}
              >{loading ? '领养中...' : '🎉 立即领养！'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetSelection;
