import { motion, AnimatePresence } from 'framer-motion';
import { useGradientStore } from '@/store/gradientStore';
import { PRESETS } from '@/store/gradientStore';
import type { GradientDirection, GradientNode } from '@/types';

export function ControlPanel() {
  const nodes = useGradientStore((s) => s.nodes);
  const direction = useGradientStore((s) => s.direction);
  const isPanelOpen = useGradientStore((s) => s.isPanelOpen);
  const updateNode = useGradientStore((s) => s.updateNode);
  const setDirection = useGradientStore((s) => s.setDirection);
  const loadPreset = useGradientStore((s) => s.loadPreset);
  const randomize = useGradientStore((s) => s.randomize);
  const togglePanel = useGradientStore((s) => s.togglePanel);

  const sortedNodes = [...nodes].sort((a, b) => a.position - b.position);

  return (
    <>
      <button
        onClick={togglePanel}
        className="mobile-toggle"
        style={{
          display: 'none',
          position: 'fixed',
          left: '50%',
          bottom: 12,
          transform: 'translateX(-50%)',
          width: 44,
          height: 5,
          borderRadius: 3,
          background: 'rgba(255,255,255,0.35)',
          border: 'none',
          cursor: 'pointer',
          zIndex: 51,
        }}
      />
      <motion.aside
        className="control-panel"
        initial={false}
        animate={{
          x: 0,
          y: isPanelOpen ? 0 : '100%',
          opacity: 1,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 30, duration: 0.35 }}
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: 320,
          background: 'rgba(26, 26, 46, 0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          color: '#fff',
          padding: '24px 20px',
          overflowY: 'auto',
          zIndex: 40,
          boxShadow: '-8px 0 30px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ marginBottom: 6 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: 0.5 }}>
            渐变谱系编辑器
          </h1>
          <p style={{ fontSize: 12, opacity: 0.55, marginTop: 4, marginBottom: 0, lineHeight: 1.5 }}>
            定义每段区域的专属渐变，滚动时平滑交叉融合
          </p>
        </div>

        <Section title="预设主题">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {PRESETS.map((preset) => {
              const [c1, c2] = [preset.nodes[0].startColor, preset.nodes[0].endColor];
              return (
                <button
                  key={preset.name}
                  onClick={() => loadPreset(preset)}
                  className="preset-btn"
                  style={{
                    position: 'relative',
                    padding: 0,
                    border: 'none',
                    borderRadius: 12,
                    height: 54,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    background: `linear-gradient(135deg, ${c1}, ${c2})`,
                    transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      padding: '4px 0',
                      fontSize: 11,
                      fontWeight: 600,
                      background: 'rgba(0,0,0,0.4)',
                      color: '#fff',
                      textAlign: 'center',
                      letterSpacing: 0.5,
                    }}
                  >
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={randomize}
            style={{
              width: '100%',
              marginTop: 10,
              padding: '10px 14px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              letterSpacing: 0.5,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))';
            }}
          >
            🎲 随机生成渐变谱系
          </button>
        </Section>

        <Section title="渐变方向">
          <DirectionTabs value={direction} onChange={setDirection} />
        </Section>

        <Section title={`渐变节点 (${sortedNodes.length})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sortedNodes.map((node, idx) => (
              <NodeCard
                key={node.id}
                index={idx}
                node={node}
                onChange={(patch) => updateNode(node.id, patch)}
              />
            ))}
          </div>
        </Section>
      </motion.aside>

      <style>{`
        @media (max-width: 767px) {
          .control-panel {
            right: 0 !important;
            left: 0 !important;
            top: auto !important;
            width: 100% !important;
            height: 80vh !important;
            border-radius: 16px 16px 0 0;
            border-left: none;
            border-top: 1px solid rgba(255,255,255,0.08);
          }
          .mobile-toggle {
            display: block !important;
          }
        }
        .control-panel::-webkit-scrollbar { width: 6px; }
        .control-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
        .control-panel::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          opacity: 0.55,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function NodeCard({
  index,
  node,
  onChange,
}: {
  index: number;
  node: GradientNode;
  onChange: (patch: Partial<GradientNode>) => void;
}) {
  return (
    <motion.div
      layout
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              background: `linear-gradient(135deg, ${node.startColor}, ${node.endColor})`,
              color: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {index + 1}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.9 }}>
            节点 {index + 1}
          </span>
        </div>
        <span style={{ fontSize: 10, opacity: 0.5 }}>
          {node.position}%
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <ColorPicker
          label="起始色"
          value={node.startColor}
          onChange={(v) => onChange({ startColor: v })}
        />
        <ColorPicker
          label="结束色"
          value={node.endColor}
          onChange={(v) => onChange({ endColor: v })}
        />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <span style={{ fontSize: 11, opacity: 0.7 }}>混合比例</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#38EF7D' }}>{node.blendRatio}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={node.blendRatio}
          onChange={(e) => onChange({ blendRatio: Number(e.target.value) })}
          style={{
            width: '100%',
            accentColor: '#38EF7D',
            cursor: 'pointer',
          }}
        />
      </div>
    </motion.div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 4 }}>{label}</div>
      <div
        style={{
          position: 'relative',
          borderRadius: 10,
          overflow: 'hidden',
          background: value,
          height: 38,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
          cursor: 'pointer',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            letterSpacing: 0.3,
          }}
        >
          {value.toUpperCase()}
        </span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            cursor: 'pointer',
            width: '100%',
            height: '100%',
            border: 'none',
            padding: 0,
          }}
        />
      </div>
    </div>
  );
}

function DirectionTabs({
  value,
  onChange,
}: {
  value: GradientDirection;
  onChange: (d: GradientDirection) => void;
}) {
  const type = value.type;

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {(['linear', 'radial', 'conic'] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              if (t === 'linear') onChange({ type: 'linear', angle: value.type === 'linear' ? value.angle : 135 });
              if (t === 'radial') onChange({ type: 'radial', position: 'center' });
              if (t === 'conic') onChange({ type: 'conic' });
            }}
            style={{
              flex: 1,
              padding: '7px 6px',
              fontSize: 11,
              fontWeight: 600,
              background: type === t ? 'rgba(56,239,125,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${type === t ? 'rgba(56,239,125,0.5)' : 'rgba(255,255,255,0.1)'}`,
              color: type === t ? '#38EF7D' : '#fff',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              letterSpacing: 0.3,
            }}
          >
            {t === 'linear' ? '线性' : t === 'radial' ? '径向' : '锥形'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {type === 'linear' && (
          <motion.div
            key="linear"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontSize: 11, opacity: 0.7 }}>角度</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#38EF7D' }}>
                {value.type === 'linear' ? value.angle : 0}°
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              value={value.type === 'linear' ? value.angle : 0}
              onChange={(e) => onChange({ type: 'linear', angle: Number(e.target.value) })}
              style={{ width: '100%', accentColor: '#38EF7D', cursor: 'pointer' }}
            />
          </motion.div>
        )}
        {type === 'radial' && (
          <motion.div
            key="radial"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', gap: 6 }}
          >
            {(['center', 'left top'] as const).map((p) => (
              <button
                key={p}
                onClick={() => onChange({ type: 'radial', position: p })}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  background:
                    value.type === 'radial' && value.position === p
                      ? 'rgba(56,239,125,0.2)'
                      : 'rgba(255,255,255,0.05)',
                  border:
                    value.type === 'radial' && value.position === p
                      ? '1px solid rgba(56,239,125,0.5)'
                      : '1px solid rgba(255,255,255,0.1)',
                  color: value.type === 'radial' && value.position === p ? '#38EF7D' : '#fff',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {p === 'center' ? '居中' : '左上'}
              </button>
            ))}
          </motion.div>
        )}
        {type === 'conic' && (
          <motion.div
            key="conic"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            style={{ fontSize: 11, opacity: 0.6, padding: '6px 2px', lineHeight: 1.5 }}
          >
            锥形渐变围绕中心点旋转，适合制作色环、加载指示器等效果。
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
