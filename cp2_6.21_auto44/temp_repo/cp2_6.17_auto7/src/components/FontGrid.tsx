import { useFontStore } from '@/store/fontStore';
import FontCard from './FontCard';

export default function FontGrid() {
  const filteredFonts = useFontStore((s) => s.filteredFonts);

  return (
    <div className="font-grid">
      {filteredFonts.map((font) => (
        <FontCard key={font.id} font={font} />
      ))}
      {filteredFonts.length === 0 && (
        <div className="font-grid__empty">
          没有找到匹配的字体
        </div>
      )}
    </div>
  );
}
