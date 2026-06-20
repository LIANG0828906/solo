import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store';
import PresetCard from './PresetCard';
import type { InstrumentType } from '@/types';
import { instrumentLabels } from '@/utils/colors';

const instruments: InstrumentType[] = ['vocal', 'guitar', 'keyboard', 'drums', 'bass'];

export default function PresetPanel() {
  const presets = useAppStore((s) => s.presets);
  const addPreset = useAppStore((s) => s.addPreset);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [instrument, setInstrument] = useState<InstrumentType>('guitar');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    addPreset({
      name: name.trim(),
      instrument,
      description: description.trim(),
      imageUrl: imageUrl.trim(),
    });
    setName('');
    setDescription('');
    setImageUrl('');
    setShowForm(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#121212',
        borderLeft: '1px solid #424242',
      }}
    >
      <div
        style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid #424242',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 14,
            fontWeight: 700,
            color: '#64B5F6',
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          ♬ 音色预设
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            backgroundColor: '#64B5F6',
            color: '#121212',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {showForm ? '✕' : '+ 新建'}
        </motion.button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              padding: 12,
              borderBottom: '1px solid #424242',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              overflow: 'hidden',
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="预设名称..."
              style={{
                padding: '6px 10px',
                borderRadius: 4,
                backgroundColor: '#2A2A2A',
                border: '1px solid #424242',
                color: '#FFFFFF',
                fontSize: 12,
              }}
            />
            <select
              value={instrument}
              onChange={(e) => setInstrument(e.target.value as InstrumentType)}
              style={{
                padding: '6px 10px',
                borderRadius: 4,
                backgroundColor: '#2A2A2A',
                border: '1px solid #424242',
                color: '#FFFFFF',
                fontSize: 12,
              }}
            >
              {instruments.map((ins) => (
                <option key={ins} value={ins}>{instrumentLabels[ins]}</option>
              ))}
            </select>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="音色描述..."
              style={{
                padding: '6px 10px',
                borderRadius: 4,
                backgroundColor: '#2A2A2A',
                border: '1px solid #424242',
                color: '#FFFFFF',
                fontSize: 12,
              }}
            />
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="图片 URL (可选)"
              style={{
                padding: '6px 10px',
                borderRadius: 4,
                backgroundColor: '#2A2A2A',
                border: '1px solid #424242',
                color: '#FFFFFF',
                fontSize: 12,
              }}
            />
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleSubmit}
              style={{
                padding: '6px 12px',
                borderRadius: 4,
                backgroundColor: '#66BB6A',
                color: '#121212',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              创建预设
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
        }}
      >
        {presets.length === 0 ? (
          <div
            style={{
              color: '#757575',
              fontSize: 12,
              textAlign: 'center',
              padding: 40,
            }}
          >
            暂无音色预设，点击「+ 新建」创建
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
            }}
          >
            {presets.map((p) => (
              <PresetCard key={p.id} preset={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
