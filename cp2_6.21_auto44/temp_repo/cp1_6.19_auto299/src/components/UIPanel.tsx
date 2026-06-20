import { motion, AnimatePresence } from 'framer-motion';
import {
  Atom,
  RotateCcw,
  Undo2,
  ZoomIn,
  Scissors,
  Puzzle,
  ListChecks,
  Sparkles,
} from 'lucide-react';
import { useMoleculeStore } from '../store';
import { ELEMENT_COLORS } from '../data/molecule';

export function UIPanel() {
  const atoms = useMoleculeStore((s) => s.atoms);
  const selectedAtomId = useMoleculeStore((s) => s.selectedAtomId);
  const isDisassembled = useMoleculeStore((s) => s.isDisassembled);
  const history = useMoleculeStore((s) => s.history);
  const disassembleAll = useMoleculeStore((s) => s.disassembleAll);
  const assembleAll = useMoleculeStore((s) => s.assembleAll);
  const assembleAtom = useMoleculeStore((s) => s.assembleAtom);
  const setSelectedAtom = useMoleculeStore((s) => s.setSelectedAtom);
  const undo = useMoleculeStore((s) => s.undo);
  const resetCamera = useMoleculeStore((s) => s.resetCamera);

  const assembledCount = atoms.filter((a) => a.isAssembled).length;
  const disassembledCount = atoms.length - assembledCount;

  return (
    <motion.div
      initial={{ x: -340, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.3 }}
      style={{
        position: 'absolute',
        top: 20,
        left: 20,
        width: 300,
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto',
        background: 'rgba(30, 39, 51, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '12px',
        padding: '20px 18px',
        zIndex: 1000,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        color: '#FFFFFF',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #00D2FF 0%, #3A7BD5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0,210,255,0.35)',
          }}
        >
          <Atom size={20} color="#FFFFFF" />
        </div>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: '#00D2FF',
              letterSpacing: 0.3,
            }}
          >
            分子实验室
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
            Molecule Lab · Caffeine
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          padding: '10px 12px',
          background: 'rgba(0,0,0,0.25)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>组装状态</span>
          <motion.span
            key={isDisassembled ? 'd' : 'a'}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: isDisassembled ? '#FF6B6B' : '#4ADE80',
            }}
          >
            {isDisassembled ? '已拆解' : '已组装'}
          </motion.span>
        </div>
        <div
          style={{
            marginTop: 8,
            height: 4,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <motion.div
            animate={{ width: `${(assembledCount / atoms.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #00D2FF 0%, #3A7BD5 100%)',
              borderRadius: 2,
            }}
          />
        </div>
        <div
          style={{
            marginTop: 6,
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          <span>已组装 {assembledCount}</span>
          <span>已拆解 {disassembledCount}</span>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <h2
          style={{
            margin: '0 0 10px 0',
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.55)',
            textTransform: 'uppercase',
            letterSpacing: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Sparkles size={12} />
          操作控制
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ActionButton
            icon={<Scissors size={16} />}
            label="拆解"
            onClick={disassembleAll}
            disabled={isDisassembled}
            gradient="linear-gradient(135deg, #FF6B6B 0%, #EE5A5A 100%)"
          />
          <ActionButton
            icon={<Puzzle size={16} />}
            label="重组"
            onClick={assembleAll}
            disabled={!isDisassembled && assembledCount === atoms.length}
            gradient="linear-gradient(135deg, #4ADE80 0%, #22C55E 100%)"
          />
          <ActionButton
            icon={<Undo2 size={16} />}
            label={`撤销 (${history.length})`}
            onClick={undo}
            disabled={history.length === 0}
            gradient="linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)"
          />
          <ActionButton
            icon={<RotateCcw size={16} />}
            label="重置视角"
            onClick={resetCamera}
            gradient="linear-gradient(135deg, #00D2FF 0%, #3A7BD5 100%)"
          />
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <h2
          style={{
            margin: '0 0 10px 0',
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.55)',
            textTransform: 'uppercase',
            letterSpacing: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ListChecks size={12} />
          原子列表 ({atoms.length})
        </h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            maxHeight: 280,
            overflowY: 'auto',
            paddingRight: 4,
          }}
        >
          <AnimatePresence initial={false}>
            {atoms.map((atom, idx) => (
              <motion.div
                key={atom.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28, delay: idx * 0.015 }}
                onClick={() => {
                  setSelectedAtom(atom.id);
                  if (!atom.isAssembled) {
                    assembleAtom(atom.id);
                  }
                }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background:
                    selectedAtomId === atom.id
                      ? 'rgba(52, 152, 219, 0.35)'
                      : 'rgba(255,255,255,0.04)',
                  border:
                    selectedAtomId === atom.id
                      ? '1px solid rgba(52, 152, 219, 0.6)'
                      : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: ELEMENT_COLORS[atom.element],
                    boxShadow: `0 0 8px ${ELEMENT_COLORS[atom.element]}60`,
                    border: '2px solid rgba(255,255,255,0.2)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#FFFFFF',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {atom.id}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.45)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {atom.role}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontWeight: 600,
                    background: atom.isAssembled
                      ? 'rgba(74, 222, 128, 0.18)'
                      : 'rgba(255, 107, 107, 0.18)',
                    color: atom.isAssembled ? '#4ADE80' : '#FF6B6B',
                  }}
                >
                  {atom.isAssembled ? '在位' : '拆解'}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          padding: 12,
          background: 'rgba(0, 210, 255, 0.06)',
          borderRadius: 8,
          border: '1px solid rgba(0, 210, 255, 0.15)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.55)',
            marginBottom: 6,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ZoomIn size={12} />
          操作提示
        </div>
        <ul
          style={{
            margin: 0,
            padding: '0 0 0 16px',
            fontSize: 11,
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.7,
          }}
        >
          <li>左键拖拽：旋转分子</li>
          <li>右键拖拽：平移视角</li>
          <li>滚轮：缩放</li>
          <li>悬停原子：查看信息</li>
          <li>点击列表项：原子归位</li>
        </ul>
      </div>
    </motion.div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  gradient: string;
}) {
  return (
    <motion.button
      whileHover={!disabled ? { filter: 'brightness(1.15)' } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '10px 8px',
        borderRadius: 8,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled ? 'rgba(255,255,255,0.08)' : gradient,
        color: disabled ? 'rgba(255,255,255,0.35)' : '#FFFFFF',
        fontSize: 13,
        fontWeight: 600,
        boxShadow: disabled ? 'none' : '0 2px 12px rgba(0,0,0,0.25)',
        transition: 'all 0.15s ease',
        fontFamily: 'inherit',
        letterSpacing: 0.3,
      }}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
}
