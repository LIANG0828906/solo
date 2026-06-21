import React, { useState, useEffect } from 'react';
import { PokemonData, POKEMON_CATALOG, createPokemon } from './types';
import { fetchPokemonList } from './api';

interface CharacterSelectorProps {
  onSelect: (pokemon: PokemonData) => void;
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({ onSelect }) => {
  const [pokemonList, setPokemonList] = useState<PokemonData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchPokemonList()
      .then(setPokemonList)
      .catch(() => {
        setPokemonList(POKEMON_CATALOG.map(createPokemon));
      });
  }, []);

  const handleConfirm = () => {
    if (selectedIndex !== null && pokemonList[selectedIndex]) {
      onSelect(pokemonList[selectedIndex]);
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0F172A',
      color: '#E2E8F0',
      fontFamily: '"Press Start 2P", monospace',
      padding: '20px',
    }}>
      <h1 style={{
        fontSize: '22px',
        marginBottom: '8px',
        color: '#6366F1',
        textShadow: '0 0 20px #6366F1',
      }}>
        像素宝可梦竞技场
      </h1>
      <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '30px' }}>
        选择你的出战怪兽
      </p>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        justifyContent: 'center',
        maxWidth: '600px',
      }}>
        {pokemonList.map((p, idx) => (
          <div
            key={p.id}
            onClick={() => setSelectedIndex(idx)}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              width: '130px',
              padding: '14px',
              background: selectedIndex === idx ? '#1E293B' : '#0D1117',
              border: selectedIndex === idx ? `2px solid ${p.color}` : '2px solid #30363D',
              borderRadius: '10px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s',
              transform: hoveredIndex === idx ? 'translateY(-3px)' : 'translateY(0)',
              filter: hoveredIndex === idx ? 'brightness(1.2)' : 'brightness(1)',
            }}
          >
            <div style={{
              width: '50px',
              height: '50px',
              margin: '0 auto 10px',
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 10px)',
              gridTemplateRows: 'repeat(5, 10px)',
              imageRendering: 'pixelated',
              filter: `drop-shadow(0 0 6px ${p.color})`,
            }}>
              {[
                [0,1,1,1,0],
                [1,1,1,1,1],
                [1,0,1,0,1],
                [1,1,1,1,1],
                [0,1,0,1,0],
              ].flat().map((filled, i) => (
                <div key={i} style={{
                  width: '10px',
                  height: '10px',
                  background: filled ? p.color : 'transparent',
                }} />
              ))}
            </div>
            <div style={{ fontSize: '10px', color: p.color, marginBottom: '8px' }}>{p.name}</div>
            <div style={{ fontSize: '8px', color: '#94A3B8', lineHeight: '2' }}>
              HP:{p.maxHp} ATK:{p.attack} DEF:{p.defense}
            </div>
            <div style={{ fontSize: '7px', color: '#64748B', lineHeight: '2', marginTop: '4px' }}>
              {p.skills.map(s => s.name).join(' / ')}
            </div>
          </div>
        ))}
      </div>

      {selectedIndex !== null && (
        <button
          onClick={handleConfirm}
          style={{
            marginTop: '24px',
            padding: '12px 36px',
            fontSize: '12px',
            fontFamily: '"Press Start 2P", monospace',
            background: '#6366F1',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            animation: 'fadeIn 0.3s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.filter = 'brightness(1.2)';
            e.currentTarget.style.transform = 'translateY(-3px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.filter = 'brightness(1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          出战！
        </button>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
