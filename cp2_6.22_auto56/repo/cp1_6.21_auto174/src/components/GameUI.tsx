import { useState } from 'react';
import { RunesModule } from '../modules/runes';
import { Fragment, Recipe, SlotItem } from '../context/GameContext';

interface GameUIProps {
  onCombine: () => void;
  onAddToSlot: (fragmentId: number) => boolean;
  onRemoveFromSlot: (slotIndex: number) => void;
  runesModule: RunesModule | null;
  gameState: any;
}

const typeColors: { [key: string]: string } = {
  fire: '#EF4444',
  water: '#3B82F6',
  earth: '#84CC16',
  wind: '#22D3EE',
  light: '#FBBF24',
};

const typeNames: { [key: string]: string } = {
  fire: '火焰',
  water: '水流',
  earth: '大地',
  wind: '疾风',
  light: '圣光',
};

function GameUI({ onCombine, onAddToSlot, onRemoveFromSlot, gameState }: GameUIProps) {
  const [draggedFragment, setDraggedFragment] = useState<Fragment | null>(null);

  const fragments: Fragment[] = gameState.fragments || [];
  const recipes: Recipe[] = gameState.recipes || [];
  const slots: (SlotItem | null)[] = gameState.slots || [null, null, null];
  const isNearAltar: boolean = gameState.isNearAltar || false;
  const collectedCount: number = gameState.collectedCount || 0;
  const newRecipeName: string | null = gameState.newRecipeName || null;
  const showNewRecipe: boolean = !!newRecipeName;

  const totalFragments = fragments.length || 20;
  const progress = totalFragments > 0 ? (collectedCount / totalFragments) * 100 : 0;

  const collectedFragments = fragments.filter(f => f.collected);
  const unlockedRecipes = recipes.filter(r => r.unlocked);

  const handleSlotClick = (index: number) => {
    if (slots[index]) {
      onRemoveFromSlot(index);
    }
  };

  const handleFragmentDragStart = (fragment: Fragment, e: React.DragEvent) => {
    setDraggedFragment(fragment);
    e.dataTransfer.setData('text/plain', String(fragment.id));
  };

  const handleSlotDrop = (slotIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    const fragmentId = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (fragmentId) {
      onAddToSlot(fragmentId);
    }
    setDraggedFragment(null);
  };

  const handleSlotDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleFragmentClick = (fragment: Fragment) => {
    onAddToSlot(fragment.id);
  };

  const canCombine = slots.every(s => s !== null);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 100,
    }}>
      {showNewRecipe && newRecipeName && (
        <div style={{
          position: 'absolute',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#F59E0B',
          fontSize: '24px',
          fontWeight: 'bold',
          textShadow: '0 0 20px rgba(245, 158, 11, 0.8)',
          animation: 'fadeInOut 5s ease-in-out',
          pointerEvents: 'none',
        }}>
          ✨ 解锁新配方：{newRecipeName} ✨
        </div>
      )}

      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        pointerEvents: 'auto',
      }}>
        <div style={{
          color: '#94A3B8',
          fontSize: '12px',
          marginBottom: '6px',
          fontWeight: '500',
        }}>
          符文收集进度
        </div>
        <div style={{
          width: '200px',
          height: '8px',
          backgroundColor: '#334155',
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div 
            style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: '#8B5CF6',
              borderRadius: '4px',
              transition: 'width 0.3s ease-out',
              boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
            }}
          />
        </div>
        <div style={{
          color: '#CBD5E1',
          fontSize: '11px',
          marginTop: '4px',
        }}>
          {collectedCount} / {totalFragments}
        </div>
      </div>

      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '200px',
        pointerEvents: 'auto',
      }}>
        <div style={{
          color: '#94A3B8',
          fontSize: '12px',
          marginBottom: '8px',
          fontWeight: '500',
        }}>
          已解锁配方
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          {unlockedRecipes.length === 0 ? (
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#1E293B',
              borderRadius: '8px',
              color: '#64748B',
              textAlign: 'left',
              fontSize: '12px',
            }}>
              暂无已解锁配方
            </div>
          ) : (
            unlockedRecipes.map(recipe => (
              <div
                key={recipe.id}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#1E293B',
                  borderRadius: '8px',
                  color: '#E2E8F0',
                  fontSize: '13px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#334155';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1E293B';
                }}
              >
                <div style={{ fontWeight: '500' }}>{recipe.name}</div>
                <div style={{ 
                  fontSize: '11px', 
                  color: '#94A3B8',
                  marginTop: '2px',
                }}>
                  {recipe.effect}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isNearAltar && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          borderRadius: '16px',
          padding: '12px',
          backdropFilter: 'blur(10px)',
          pointerEvents: 'auto',
          minWidth: '320px',
          animation: 'slideUp 0.3s ease-out',
        }}>
          <div style={{
            color: '#A78BFA',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '12px',
            textAlign: 'center',
          }}>
            ✦ 符文组合台 ✦
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '12px',
          }}>
            {slots.map((slot, index) => (
              <div
                key={index}
                onClick={() => handleSlotClick(index)}
                onDragOver={handleSlotDragOver}
                onDrop={(e) => handleSlotDrop(index, e)}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: `2px ${slot ? 'solid' : 'dashed'} ${slot ? typeColors[slot.type] || '#6366F1' : '#6366F1'}`,
                  backgroundColor: slot ? `${typeColors[slot.type] || '#6366F1'}20` : 'rgba(99, 102, 241, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: slot ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  boxShadow: slot ? `0 0 15px ${typeColors[slot.type] || '#6366F1'}40` : 'none',
                }}
              >
                {slot ? (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: typeColors[slot.type] || '#6366F1',
                    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                    boxShadow: `0 0 10px ${typeColors[slot.type] || '#6366F1'}`,
                  }} />
                ) : (
                  <span style={{ color: '#475569', fontSize: '20px' }}>+</span>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={onCombine}
            disabled={!canCombine}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: canCombine ? '#8B5CF6' : '#334155',
              color: canCombine ? '#FFFFFF' : '#64748B',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: canCombine ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (canCombine) {
                e.currentTarget.style.backgroundColor = '#7C3AED';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(139, 92, 246, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = canCombine ? '#8B5CF6' : '#334155';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {canCombine ? '✨ 组合符文' : '放入符文碎片'}
          </button>

          {collectedFragments.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{
                color: '#94A3B8',
                fontSize: '11px',
                marginBottom: '6px',
              }}>
                已收集的碎片（点击添加）：
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                maxHeight: '80px',
                overflowY: 'auto',
                padding: '4px',
              }}>
                {collectedFragments.map(fragment => (
                  <div
                    key={fragment.id}
                    draggable
                    onDragStart={(e) => handleFragmentDragStart(fragment, e)}
                    onClick={() => handleFragmentClick(fragment)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: `${typeColors[fragment.type] || '#6366F1'}30`,
                      border: `1px solid ${typeColors[fragment.type] || '#6366F1'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title={`${typeNames[fragment.type] || '未知'}碎片 - 点击添加到插槽`}
                  >
                    <div style={{
                      width: '14px',
                      height: '14px',
                      backgroundColor: typeColors[fragment.type] || '#6366F1',
                      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                    }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {collectedFragments.length === 0 && (
            <div style={{
              marginTop: '12px',
              color: '#64748B',
              fontSize: '12px',
              textAlign: 'center',
            }}>
              收集符文碎片以进行组合
            </div>
          )}
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        color: '#64748B',
        fontSize: '11px',
        textAlign: 'right',
        lineHeight: '1.6',
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        padding: '8px 12px',
        borderRadius: '8px',
        pointerEvents: 'auto',
      }}>
        <div>WASD - 移动</div>
        <div>鼠标左键 - 传送</div>
        <div>靠近祭坛 - 组合符文</div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          20% { opacity: 1; transform: translateX(-50%) translateY(0); }
          80% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 2px;
        }
        ::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 2px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #64748B;
        }
      `}</style>
    </div>
  );
}

export default GameUI;
