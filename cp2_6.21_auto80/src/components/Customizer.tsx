import React, { useState, useCallback } from 'react'
import { useStore, FLAVORS, RIBBON_COLORS, FONT_OPTIONS } from '../store/useStore'
import ChocolatePreview from './ChocolatePreview'
import GiftBoxPreview from './GiftBoxPreview'

const SHAPES = [
  { value: 'circle' as const, label: '圆形', icon: '⬤' },
  { value: 'square' as const, label: '方形', icon: '◼' },
  { value: 'heart' as const, label: '心形', icon: '♥' },
  { value: 'shell' as const, label: '贝壳', icon: '🐚' },
]

const SHELL_COLORS = [
  '#5D4037', '#8D6E63', '#D4AF37', '#F48FB1',
  '#EF5350', '#FF7043', '#FFCA28', '#66BB6A',
  '#42A5F5', '#7E57C2', '#F5F5F5', '#212121',
]

const TEXTURES = [
  { value: 'matte' as const, label: '磨砂' },
  { value: 'glossy' as const, label: '亮面' },
  { value: 'crushed-nuts' as const, label: '碎坚果' },
  { value: 'gold-foil' as const, label: '金箔' },
]

const BOX_SHAPES = [
  { value: 'square' as const, label: '方形' },
  { value: 'heart' as const, label: '心形' },
  { value: 'drawer' as const, label: '抽拉式' },
]

const CARD_COLORS = ['#3E2723', '#D4AF37', '#C62828', '#1565C0', '#2E7D32', '#4A148C']

const sectionTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#3E2723',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: 1,
}

const activeBtn: React.CSSProperties = {
  border: '2px solid #D4AF37',
  background: 'rgba(212,175,55,0.1)',
}

const inactiveBtn: React.CSSProperties = {
  border: '2px solid #E0E0E0',
  background: 'transparent',
}

export default function Customizer() {
  const {
    selectedChocolates,
    giftBox,
    selectedChocolateId,
    updateChocolate,
    updateGiftBox,
    submitOrder,
  } = useStore()

  const [orderSuccess, setOrderSuccess] = useState(false)
  const [customHex, setCustomHex] = useState('')

  const selectedChocolate = selectedChocolates.find((c) => c.id === selectedChocolateId) ?? null

  const handleShape = useCallback(
    (value: string) => {
      if (selectedChocolate) updateChocolate(selectedChocolate.id, { shape: value as any })
    },
    [selectedChocolate, updateChocolate],
  )

  const handleColor = useCallback(
    (value: string) => {
      if (selectedChocolate) {
        updateChocolate(selectedChocolate.id, { color: value })
        setCustomHex(value)
      }
    },
    [selectedChocolate, updateChocolate],
  )

  const handleHexInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.slice(0, 7)
      setCustomHex(val)
      if (/^#[0-9A-Fa-f]{6}$/.test(val) && selectedChocolate) {
        updateChocolate(selectedChocolate.id, { color: val })
      }
    },
    [selectedChocolate, updateChocolate],
  )

  const handleTexture = useCallback(
    (value: string) => {
      if (selectedChocolate) updateChocolate(selectedChocolate.id, { texture: value as any })
    },
    [selectedChocolate, updateChocolate],
  )

  const handleBoxShape = useCallback(
    (value: string) => updateGiftBox({ boxShape: value as any }),
    [updateGiftBox],
  )

  const handleRibbonColor = useCallback(
    (value: string) => updateGiftBox({ ribbonColor: value }),
    [updateGiftBox],
  )

  const handleCardText = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => updateGiftBox({ cardText: e.target.value.slice(0, 200) }),
    [updateGiftBox],
  )

  const handleCardFont = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => updateGiftBox({ cardFont: e.target.value }),
    [updateGiftBox],
  )

  const handleCardColor = useCallback(
    (value: string) => updateGiftBox({ cardColor: value }),
    [updateGiftBox],
  )

  const handleSubmit = useCallback(async () => {
    try {
      await submitOrder()
      setOrderSuccess(true)
      setTimeout(() => setOrderSuccess(false), 2500)
    } catch {
      setOrderSuccess(false)
    }
  }, [submitOrder])

  return (
    <div
      style={{
        width: 380,
        background: '#FAFAFA',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='0.5' fill='%23e0e0e0' fill-opacity='0.3'/%3E%3C/svg%3E")`,
        padding: 20,
        overflowY: 'auto',
        fontFamily: 'Inter, sans-serif',
        height: '100vh',
        boxSizing: 'border-box',
      }}
    >
      {selectedChocolateId !== null && (
        <div style={{ marginBottom: 24 }}>
          <div style={sectionTitle}>巧克力定制</div>
          {selectedChocolate ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>形状</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {SHAPES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => handleShape(s.value)}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        lineHeight: 1,
                        ...(selectedChocolate.shape === s.value ? activeBtn : inactiveBtn),
                      }}
                    >
                      <span>{s.icon}</span>
                      <span style={{ fontSize: 9, marginTop: 2 }}>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>外壳颜色</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SHELL_COLORS.map((c) => (
                    <div
                      key={c}
                      onClick={() => handleColor(c)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        background: c,
                        border: selectedChocolate.color === c ? '2px solid #D4AF37' : '2px solid transparent',
                        transform: selectedChocolate.color === c ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.15s, border 0.15s',
                      }}
                    />
                  ))}
                </div>
                <input
                  value={customHex}
                  onChange={handleHexInput}
                  maxLength={7}
                  placeholder="#000000"
                  style={{
                    marginTop: 8,
                    width: 90,
                    padding: '4px 8px',
                    border: '1px solid #DDD',
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>表面质感</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {TEXTURES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => handleTexture(t.value)}
                      style={{
                        padding: '8px 0',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 13,
                        ...(selectedChocolate.texture === t.value ? activeBtn : inactiveBtn),
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>预览</div>
                <div style={{ width: 160, height: 160, borderRadius: 12, overflow: 'hidden' }}>
                  <ChocolatePreview
                    shape={selectedChocolate.shape}
                    color={selectedChocolate.color}
                    texture={selectedChocolate.texture}
                    size={1}
                  />
                </div>
              </div>
            </>
          ) : (
            <div style={{ color: '#999', fontSize: 13, padding: '12px 0' }}>
              请先选择一颗巧克力进行定制
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <div style={sectionTitle}>包装定制</div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>盒型</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {BOX_SHAPES.map((b) => (
              <button
                key={b.value}
                onClick={() => handleBoxShape(b.value)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                  ...(giftBox.boxShape === b.value ? activeBtn : inactiveBtn),
                }}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>绸带颜色</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {RIBBON_COLORS.map((r) => (
              <div
                key={r.name}
                onClick={() => handleRibbonColor(r.value)}
                style={{
                  width: 40,
                  height: 28,
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: r.value,
                  border: giftBox.ribbonColor === r.value ? '2px solid #D4AF37' : '2px solid transparent',
                  transition: 'border 0.15s',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>贺卡</div>
          <textarea
            value={giftBox.cardText}
            onChange={handleCardText}
            maxLength={200}
            placeholder="写下你的祝福..."
            style={{
              width: '100%',
              height: 72,
              resize: 'none',
              border: '1px solid #DDD',
              borderRadius: 8,
              padding: 8,
              fontSize: 13,
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: 11, color: '#999', marginTop: 4, textAlign: 'right' }}>
            {giftBox.cardText.length}/200
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <select
              value={giftBox.cardFont}
              onChange={handleCardFont}
              style={{
                flex: 1,
                padding: '6px 8px',
                border: '1px solid #DDD',
                borderRadius: 6,
                fontSize: 13,
                outline: 'none',
                background: '#FFF',
              }}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {CARD_COLORS.map((c) => (
              <div
                key={c}
                onClick={() => handleCardColor(c)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  background: c,
                  border: giftBox.cardColor === c ? '2px solid #D4AF37' : '2px solid transparent',
                  transition: 'border 0.15s',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={sectionTitle}>3D礼盒预览</div>
        <div style={{ width: 280, height: 280, borderRadius: 16, overflow: 'hidden' }}>
          <GiftBoxPreview
            boxShape={giftBox.boxShape}
            ribbonColor={giftBox.ribbonColor}
            cardText={giftBox.cardText}
            cardFont={giftBox.cardFont}
            cardColor={giftBox.cardColor}
            chocolates={selectedChocolates.map((c) => ({
              flavorId: c.flavorId,
              shape: c.shape,
              color: c.color,
              texture: c.texture,
            }))}
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={selectedChocolates.length < 3}
        style={{
          width: '100%',
          height: 48,
          borderRadius: 12,
          border: 'none',
          background: selectedChocolates.length < 3 ? '#CCC' : '#D4AF37',
          color: selectedChocolates.length < 3 ? '#888' : '#3E2723',
          fontSize: 16,
          fontWeight: 600,
          cursor: selectedChocolates.length < 3 ? 'not-allowed' : 'pointer',
          fontFamily: 'Inter, sans-serif',
          transition: 'background 0.2s',
        }}
      >
        提交订单 ¥299
      </button>

      {orderSuccess && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#D4AF37',
            color: '#3E2723',
            padding: '12px 32px',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 15,
            boxShadow: '0 4px 20px rgba(212,175,55,0.4)',
            zIndex: 9999,
          }}
        >
          订单提交成功！
        </div>
      )}
    </div>
  )
}
