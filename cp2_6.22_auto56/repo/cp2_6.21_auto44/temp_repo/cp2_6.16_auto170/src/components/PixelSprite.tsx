import React, { memo } from 'react';
import type { MonsterShape } from '@/types';

const PLAYER_COLOR = '#4169E1';
const PLAYER_SKIN = '#F5DEB3';
const PLAYER_ROBE = '#1E3A8A';
const PLAYER_STAFF = '#8B4513';
const PLAYER_GEM = '#FFD700';

interface PlayerSpriteProps {
  casting?: boolean;
  hit?: boolean;
}

export const PlayerSprite: React.FC<PlayerSpriteProps> = memo(function PlayerSprite({ casting, hit }) {
  const px = (n: number) => n * 3;
  return (
    <div className={`character-sprite ${casting ? 'casting' : ''} ${hit ? 'hit' : ''}`}>
      <svg width={px(16)} height={px(16)} viewBox="0 0 16 16" shapeRendering="crispEdges">
        {/* Hat */}
        <rect x="5" y="1" width="6" height="1" fill={PLAYER_COLOR} />
        <rect x="6" y="2" width="4" height="2" fill={PLAYER_COLOR} />
        {/* Hat gem */}
        <rect x="7" y="3" width="2" height="1" fill={PLAYER_GEM} />
        {/* Head */}
        <rect x="5" y="4" width="6" height="3" fill={PLAYER_SKIN} />
        {/* Eyes */}
        <rect x="6" y="5" width="1" height="1" fill="#000" />
        <rect x="9" y="5" width="1" height="1" fill="#000" />
        {/* Robe */}
        <rect x="4" y="7" width="8" height="6" fill={PLAYER_ROBE} />
        <rect x="3" y="8" width="1" height="4" fill={PLAYER_ROBE} />
        <rect x="12" y="8" width="1" height="4" fill={PLAYER_ROBE} />
        {/* Robe belt */}
        <rect x="4" y="10" width="8" height="1" fill={PLAYER_COLOR} />
        {/* Staff */}
        <rect x="13" y="3" width="1" height="11" fill={PLAYER_STAFF} />
        <rect x="12" y="2" width="3" height="1" fill={PLAYER_STAFF} />
        {/* Staff gem */}
        <rect x="13" y="1" width="1" height="1" fill={PLAYER_GEM} className="staff-glow" style={{ opacity: casting ? 1 : 0 }} />
        {/* Feet */}
        <rect x="5" y="13" width="2" height="1" fill="#3E2723" />
        <rect x="9" y="13" width="2" height="1" fill="#3E2723" />
      </svg>
    </div>
  );
});

interface MonsterSpriteProps {
  shape: MonsterShape;
  color: string;
  isBoss?: boolean;
  hit?: boolean;
}

export const MonsterSprite: React.FC<MonsterSpriteProps> = memo(function MonsterSprite({
  shape,
  color,
  isBoss,
  hit,
}) {
  const scale = isBoss ? 4 : 3;
  const size = isBoss ? 16 : 16;
  const px = (n: number) => n * scale;

  const renderSlime = () => (
    <>
      {/* Body */}
      <rect x="3" y="7" width="10" height="7" fill={color} rx="1" />
      <rect x="2" y="9" width="12" height="4" fill={color} />
      <rect x="4" y="5" width="8" height="2" fill={color} />
      {/* Highlight */}
      <rect x="4" y="8" width="2" height="2" fill="#FFFFFF" opacity="0.4" />
      {/* Eyes */}
      <rect x="5" y="10" width="2" height="2" fill="#FFF" />
      <rect x="9" y="10" width="2" height="2" fill="#FFF" />
      <rect x="6" y="10" width="1" height="1" fill="#000" />
      <rect x="10" y="10" width="1" height="1" fill="#000" />
      {/* Mouth */}
      <rect x="6" y="12" width="4" height="1" fill="#000" />
    </>
  );

  const renderBat = () => (
    <>
      {/* Wings */}
      <rect x="0" y="5" width="5" height="4" fill={color} />
      <rect x="11" y="5" width="5" height="4" fill={color} />
      <rect x="1" y="4" width="3" height="1" fill={color} />
      <rect x="12" y="4" width="3" height="1" fill={color} />
      <rect x="0" y="8" width="2" height="1" fill={color} />
      <rect x="14" y="8" width="2" height="1" fill={color} />
      {/* Body */}
      <rect x="5" y="6" width="6" height="5" fill={color} />
      <rect x="6" y="5" width="4" height="1" fill={color} />
      {/* Ears */}
      <rect x="5" y="3" width="1" height="2" fill={color} />
      <rect x="10" y="3" width="1" height="2" fill={color} />
      {/* Eyes */}
      <rect x="6" y="7" width="1" height="1" fill="#F00" />
      <rect x="9" y="7" width="1" height="1" fill="#F00" />
      {/* Fangs */}
      <rect x="6" y="9" width="1" height="1" fill="#FFF" />
      <rect x="9" y="9" width="1" height="1" fill="#FFF" />
    </>
  );

  const renderSpider = () => (
    <>
      {/* Legs */}
      <rect x="0" y="6" width="3" height="1" fill={color} />
      <rect x="0" y="8" width="3" height="1" fill={color} />
      <rect x="0" y="10" width="3" height="1" fill={color} />
      <rect x="13" y="6" width="3" height="1" fill={color} />
      <rect x="13" y="8" width="3" height="1" fill={color} />
      <rect x="13" y="10" width="3" height="1" fill={color} />
      {/* Body */}
      <rect x="3" y="6" width="10" height="6" fill={color} />
      <rect x="4" y="5" width="8" height="1" fill={color} />
      <rect x="4" y="12" width="8" height="1" fill={color} />
      {/* Eyes */}
      <rect x="5" y="7" width="1" height="1" fill="#FF0" />
      <rect x="7" y="7" width="1" height="1" fill="#FF0" />
      <rect x="9" y="7" width="1" height="1" fill="#FF0" />
      <rect x="11" y="7" width="1" height="1" fill="#FF0" />
      {/* Marking */}
      <rect x="7" y="9" width="2" height="2" fill="#FFF" opacity="0.5" />
    </>
  );

  const renderSkeleton = () => (
    <>
      {/* Skull */}
      <rect x="5" y="2" width="6" height="5" fill={color} />
      <rect x="4" y="3" width="1" height="3" fill={color} />
      <rect x="11" y="3" width="1" height="3" fill={color} />
      {/* Eye sockets */}
      <rect x="5" y="4" width="2" height="2" fill="#000" />
      <rect x="9" y="4" width="2" height="2" fill="#000" />
      {/* Teeth */}
      <rect x="6" y="6" width="1" height="1" fill="#000" />
      <rect x="8" y="6" width="1" height="1" fill="#000" />
      <rect x="10" y="6" width="1" height="1" fill="#000" />
      {/* Spine/ribs */}
      <rect x="7" y="7" width="2" height="5" fill={color} />
      <rect x="5" y="8" width="6" height="1" fill={color} />
      <rect x="5" y="10" width="6" height="1" fill={color} />
      {/* Arms */}
      <rect x="3" y="7" width="2" height="1" fill={color} />
      <rect x="2" y="8" width="1" height="3" fill={color} />
      <rect x="11" y="7" width="2" height="1" fill={color} />
      <rect x="13" y="8" width="1" height="3" fill={color} />
      {/* Legs */}
      <rect x="5" y="12" width="2" height="3" fill={color} />
      <rect x="9" y="12" width="2" height="3" fill={color} />
    </>
  );

  const renderCyclops = () => (
    <>
      {/* Horns */}
      <rect x="1" y="2" width="2" height="2" fill="#444" />
      <rect x="13" y="2" width="2" height="2" fill="#444" />
      <rect x="2" y="1" width="1" height="1" fill="#444" />
      <rect x="13" y="1" width="1" height="1" fill="#444" />
      {/* Head */}
      <rect x="3" y="3" width="10" height="8" fill={color} />
      <rect x="2" y="4" width="1" height="6" fill={color} />
      <rect x="13" y="4" width="1" height="6" fill={color} />
      {/* Big eye */}
      <rect x="5" y="5" width="6" height="3" fill="#FFF" />
      <rect x="7" y="5" width="2" height="3" fill="#F00" />
      <rect x="7" y="6" width="1" height="1" fill="#000" />
      {/* Brow */}
      <rect x="4" y="4" width="8" height="1" fill="#222" />
      {/* Teeth */}
      <rect x="4" y="9" width="8" height="1" fill="#FFF" />
      <rect x="5" y="10" width="1" height="1" fill="#000" />
      <rect x="7" y="10" width="2" height="1" fill="#000" />
      <rect x="10" y="10" width="1" height="1" fill="#000" />
      {/* Body */}
      <rect x="2" y="11" width="12" height="5" fill={color} />
      <rect x="1" y="12" width="1" height="3" fill={color} />
      <rect x="14" y="12" width="1" height="3" fill={color} />
      {/* Muscle lines */}
      <rect x="5" y="12" width="1" height="3" fill="#000" opacity="0.4" />
      <rect x="10" y="12" width="1" height="3" fill="#000" opacity="0.4" />
    </>
  );

  const render = () => {
    switch (shape) {
      case 'slime':
        return renderSlime();
      case 'bat':
        return renderBat();
      case 'spider':
        return renderSpider();
      case 'skeleton':
        return renderSkeleton();
      case 'cyclops':
        return renderCyclops();
    }
  };

  return (
    <div className={`character-sprite ${isBoss ? 'boss-sprite' : ''} ${hit ? 'hit' : ''}`}>
      <svg
        width={px(size)}
        height={px(size)}
        viewBox={`0 0 ${size} ${size}`}
        shapeRendering="crispEdges"
        style={{ filter: isBoss ? `drop-shadow(0 0 8px ${color})` : 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}
      >
        {render()}
      </svg>
    </div>
  );
});
