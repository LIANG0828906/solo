import { motion } from 'framer-motion';
import { useSoundStore, type Vec3 } from '@/store/useSoundStore';

const WALL_NAMES = ['前墙', '后墙', '左墙', '右墙', '天花板', '地板'];

const MATERIALS: { name: string; value: number; color: string }[] = [
  { name: '玻璃', value: 0.1, color: '#B8E6FF' },
  { name: '石膏', value: 0.3, color: '#E8DFD3' },
  { name: '木板', value: 0.5, color: '#A0522D' },
  { name: '毛毯', value: 0.8, color: '#8B4513' },
];

const AXIS_CONFIG: { key: keyof Vec3; label: string; min: number; max: number }[] = [
  { key: 'x', label: 'X', min: -6, max: 6 },
  { key: 'y', label: 'Y', min: 0, max: 8 },
  { key: 'z', label: 'Z', min: -2, max: 2 },
];

function getMaterialColor(absorption: number): string {
  const mat = MATERIALS.find((m) => Math.abs(m.value - absorption) < 0.001);
  return mat ? mat.color : '#FFFFFF';
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}

function SliderRow({ label, value, min, max, onChange }: SliderRowProps) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#A0AEC0' }}>{label}</span>
        <span style={{ fontSize: 12, color: '#FFFFFF', textAlign: 'right' }}>
          {value.toFixed(2)}
        </span>
      </div>
      <motion.input
        type="range"
        min={min}
        max={max}
        step={0.1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.1 }}
        className="control-panel-slider"
      />
    </div>
  );
}

export default function ControlPanel() {
  const sourcePos = useSoundStore((s) => s.sourcePos);
  const receiverPos = useSoundStore((s) => s.receiverPos);
  const wallAbsorption = useSoundStore((s) => s.wallAbsorption);
  const rt60 = useSoundStore((s) => s.rt60);
  const setSourcePos = useSoundStore((s) => s.setSourcePos);
  const setReceiverPos = useSoundStore((s) => s.setReceiverPos);
  const setWallAbsorption = useSoundStore((s) => s.setWallAbsorption);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 120, duration: 0.2 }}
      style={{
        backgroundColor: '#16213E',
        borderRadius: 12,
        padding: 16,
        width: 320,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>
        <div
          style={{
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: 12,
          }}
        >
          声场控制面板
        </div>

        <div style={{ marginTop: 12 }}>
          <div
            style={{
              fontSize: 12,
              color: '#A0AEC0',
              fontWeight: 'bold',
              marginBottom: 8,
            }}
          >
            声源位置
          </div>
          {AXIS_CONFIG.map(({ key, label, min, max }) => (
            <SliderRow
              key={`source-${key}`}
              label={label}
              value={sourcePos[key]}
              min={min}
              max={max}
              onChange={(v) => setSourcePos({ ...sourcePos, [key]: v })}
            />
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontSize: 12,
              color: '#A0AEC0',
              fontWeight: 'bold',
              marginBottom: 8,
            }}
          >
            接收点位置
          </div>
          {AXIS_CONFIG.map(({ key, label, min, max }) => (
            <SliderRow
              key={`receiver-${key}`}
              label={label}
              value={receiverPos[key]}
              min={min}
              max={max}
              onChange={(v) => setReceiverPos({ ...receiverPos, [key]: v })}
            />
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontSize: 12,
              color: '#A0AEC0',
              fontWeight: 'bold',
              marginBottom: 8,
            }}
          >
            墙面材质
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}
          >
            {WALL_NAMES.map((name, index) => (
              <motion.div
                key={name}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      backgroundColor: getMaterialColor(wallAbsorption[index]),
                    }}
                  />
                  <span style={{ fontSize: 12, color: '#FFFFFF' }}>{name}</span>
                </div>
                <motion.select
                  value={wallAbsorption[index]}
                  onChange={(e) => setWallAbsorption(index, parseFloat(e.target.value))}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.1 }}
                  style={{
                    backgroundColor: '#0F3460',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 4,
                    padding: '4px 8px',
                    fontSize: 12,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {MATERIALS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.name}
                    </option>
                  ))}
                </motion.select>
              </motion.div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontSize: 12,
              color: '#A0AEC0',
              fontWeight: 'bold',
              marginBottom: 4,
            }}
          >
            混响时间 RT60
          </div>
          <div
            style={{
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 'bold',
            }}
          >
            {(rt60 * 1000).toFixed(0)} ms
          </div>
        </div>
      </div>
    </motion.div>
  );
}
