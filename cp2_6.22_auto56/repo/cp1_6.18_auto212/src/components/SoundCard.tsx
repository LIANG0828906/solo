import { SOUND_PRESETS, CATEGORY_COLORS, CATEGORY_LABEL } from '@/engine/SoundBlock';
import type { SoundCategory } from '@/engine/SoundBlock';
import { useSoundStore } from '@/store/useSoundStore';
import type { HotSpot } from '@/scenes/CityScene';

interface Props {
  hotspot: HotSpot;
}

export function SoundCard({ hotspot }: Props): JSX.Element {
  const { addBlockByPresetId, setShowCardForHotspot } = useSoundStore();
  const filtered = SOUND_PRESETS.filter((p) => p.category === hotspot.category);
  const others = SOUND_PRESETS.filter((p) => p.category !== hotspot.category);
  const list = [...filtered, ...others];

  return (
    <div className="sound-card-overlay" onClick={() => setShowCardForHotspot(null)}>
      <div className="sound-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="sound-card-title">{hotspot.label}</h3>
        <p className="sound-card-sub">选择一种音效加入音景（{CATEGORY_LABEL[hotspot.category as SoundCategory]} 类优先）</p>
        <div className="sound-card-grid">
          {list.map((p) => (
            <button
              key={p.id}
              type="button"
              className="sound-card-item"
              onClick={() => addBlockByPresetId(p.id, hotspot.id)}
            >
              <span
                className="sound-card-dot"
                style={{ background: CATEGORY_COLORS[p.category] }}
              />
              {p.name}
            </button>
          ))}
        </div>
        <button type="button" className="sound-card-close" onClick={() => setShowCardForHotspot(null)}>
          关闭
        </button>
      </div>
    </div>
  );
}
