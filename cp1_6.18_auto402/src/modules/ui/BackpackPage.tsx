import { useMemo, useState } from 'react'
import { useGameStore } from '../../store'
import Button from '../../components/Button'
import RarityTag from '../../components/RarityTag'
import Modal from '../../components/Modal'
import { getRarityColor, getRarityName } from '../../modules/nft-core/ItemGenerator'
import { SynthesisEngine } from '../../modules/nft-core/SynthesisEngine'
import type { Fragment, Rarity } from '../../types'

const BackpackPage = () => {
  const fragments = useGameStore((s) => s.player.fragments)
  const balance = useGameStore((s) => s.player.balance)
  const selectedFragmentIds = useGameStore((s) => s.selectedFragmentIds)
  const synthFlash = useGameStore((s) => s.synthFlash)
  const toggleFragmentSelection = useGameStore((s) => s.toggleFragmentSelection)
  const clearFragmentSelection = useGameStore((s) => s.clearFragmentSelection)
  const synthesizeSelected = useGameStore((s) => s.synthesizeSelected)

  const [synthResult, setSynthResult] = useState<{ success: boolean; msg: string } | null>(null)

  const groupedFragments = useMemo(() => {
    const groups = new Map<string, Fragment[]>()
    for (const f of fragments) {
      if (!groups.has(f.groupId)) groups.set(f.groupId, [])
      groups.get(f.groupId)!.push(f)
    }
    return Array.from(groups.entries()).map(([groupId, items]) => {
      const groupName = items[0].groupName
      const rarestRarity = items.reduce((r, f) => {
        const order: Rarity[] = ['common', 'rare', 'epic', 'legendary']
        return order.indexOf(f.rarity) > order.indexOf(r) ? f.rarity : r
      }, items[0].rarity)
      return { groupId, groupName, items, rarestRarity, count: items.length }
    })
  }, [fragments])

  const selectedFragments = useMemo(
    () => fragments.filter((f) => selectedFragmentIds.has(f.id)),
    [fragments, selectedFragmentIds]
  )

  const canSynthesize = SynthesisEngine.canSynthesize(selectedFragments)

  const handleSynthesize = () => {
    const result = synthesizeSelected()
    setSynthResult({
      success: result.success,
      msg: result.success ? `🎉 成功合成艺术品：${result.artwork?.name}！` : `❌ ${result.error}`,
    })
    setTimeout(() => setSynthResult(null), 3500)
  }

  const getProgressColor = (rarity: Rarity) => {
    const c = getRarityColor(rarity)
    return `linear-gradient(90deg, ${c}80, ${c})`
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>🎒 我的背包</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
            收集碎片，同组集齐4个即可合成艺术品
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ padding: '10px 18px', background: 'rgba(255, 215, 0, 0.1)', borderRadius: 10, border: '1px solid rgba(255, 215, 0, 0.3)' }}>
            <span style={{ color: '#FFD700', fontWeight: 700, fontSize: 16 }}>🪙 {balance}</span>
          </div>
          <div style={{ padding: '10px 18px', background: 'rgba(0, 212, 170, 0.1)', borderRadius: 10, border: '1px solid rgba(0, 212, 170, 0.3)' }}>
            <span style={{ color: '#00D4AA', fontWeight: 700, fontSize: 16 }}>💎 碎片 {fragments.length}</span>
          </div>
        </div>
      </div>

      <div
        className={synthFlash ? 'synth-flash' : ''}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: `2px solid ${canSynthesize ? '#00D4AA50' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700 }}>✨ 合成区域</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={clearFragmentSelection} disabled={selectedFragments.length === 0}>
              清空
            </Button>
            <Button size="sm" onClick={handleSynthesize} disabled={!canSynthesize}>
              🔮 合成艺术品
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[0, 1, 2, 3].map((slot) => {
            const frag = selectedFragments[slot]
            return (
              <div
                key={slot}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 12,
                  border: frag
                    ? `3px solid ${getRarityColor(frag.rarity)}`
                    : '2px dashed rgba(255,255,255,0.15)',
                  background: frag
                    ? `linear-gradient(135deg, ${getRarityColor(frag.rarity)}25, #1A1A2E)`
                    : 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                {frag ? (
                  <>
                    <span style={{ fontSize: 32 }}>💎</span>
                    <span style={{ fontSize: 10, marginTop: 4, color: 'rgba(255,255,255,0.7)' }}>{frag.name}</span>
                  </>
                ) : (
                  <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.2)' }}>+</span>
                )}
              </div>
            )
          })}
        </div>

        {selectedFragments.length > 0 && !canSynthesize && (
          <p style={{ marginTop: 12, color: '#E74C3C', fontSize: 13 }}>
            需要4个同组碎片才能合成（当前已选 {selectedFragments.length} 个
            {selectedFragments.length > 0 &&
              `，组：${selectedFragments.map((f) => f.groupName).filter((v, i, a) => a.indexOf(v) === i).join('、')}`}
            ）
          </p>
        )}
      </div>

      {fragments.length === 0 ? (
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px dashed rgba(255,255,255,0.15)',
            borderRadius: 16,
            padding: 60,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 12 }}>📭</div>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>背包空空如也</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
            前往收藏品页面，通过拼图或答题收集碎片吧！
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {groupedFragments.map((group) => (
            <div
              key={group.groupId}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700 }}>{group.groupName}</h3>
                  <RarityTag rarity={group.rarestRarity} size="sm" />
                </div>
                <span
                  style={{
                    fontSize: 13,
                    color: group.count >= 4 ? '#00D4AA' : 'rgba(255,255,255,0.6)',
                    fontWeight: 600,
                  }}
                >
                  {group.count} / 4
                  {group.count >= 4 && ' ✅ 可合成'}
                </span>
              </div>

              <div
                style={{
                  width: '100%',
                  height: 6,
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (group.count / 4) * 100)}%`,
                    background: getProgressColor(group.rarestRarity),
                    borderRadius: 3,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {group.items.map((f) => {
                  const isSelected = selectedFragmentIds.has(f.id)
                  const color = getRarityColor(f.rarity)
                  return (
                    <div
                      key={f.id}
                      onClick={() => toggleFragmentSelection(f.id)}
                      style={{
                        position: 'relative',
                        width: 88,
                        padding: 10,
                        background: '#2A2A3E',
                        borderRadius: 8,
                        border: isSelected ? `3px solid ${color}` : `2px solid ${color}60`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? `0 0 15px ${color}60` : 'none',
                      }}
                    >
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: '#00D4AA',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          ✓
                        </div>
                      )}
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '1/1',
                          background: '#1A1A2E',
                          borderRadius: 6,
                          marginBottom: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 26,
                        }}
                      >
                        💎
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {f.name}
                      </div>
                      <div
                        style={{
                          height: 3,
                          borderRadius: 2,
                          background: color,
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!synthResult} onClose={() => setSynthResult(null)} width={420}>
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>{synthResult?.success ? '🎉' : '❌'}</div>
          <p style={{ fontSize: 17, fontWeight: 600 }}>{synthResult?.msg}</p>
        </div>
      </Modal>
    </div>
  )
}

export default BackpackPage
