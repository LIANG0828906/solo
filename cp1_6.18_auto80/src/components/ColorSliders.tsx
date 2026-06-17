import { memo, useCallback, useRef, useEffect, useState } from 'react';
import { useColorStore } from '@/store/useColorStore';

type SliderType = 'hue' | 'saturation' | 'lightness';

const ColorSliders = memo(() => {
  const hsl = useColorStore((s) => s.hsl);
  const hex = useColorStore((s) => s.hex);
  const setHue = useColorStore((s) => s.setHue);
  const setSaturation = useColorStore((s) => s.setSaturation);
  const setLightness = useColorStore((s) => s.setLightness);
  const addToHistory = useColorStore((s) => s.addToHistory);

  const [isMobile, setIsMobile] = useState(false);
  const [dragging, setDragging] = useState<SliderType | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const hueTrackRef = useRef<HTMLDivElement>(null);
  const satTrackRef = useRef<HTMLDivElement>(null);
  const lightTrackRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(
    (type: SliderType) => (e: React.PointerEvent) => {
      e.preventDefault();
      setDragging(type);
      (e.target as Element).setPointerCapture(e.pointerId);
      updateFromPointer(type, e);
    },
    [],
  );

  const updateFromPointer = useCallback((type: SliderType, e: React.PointerEvent | PointerEvent) => {
    const refs: Record<SliderType, React.RefObject<HTMLDivElement>> = {
      hue: hueTrackRef,
      saturation: satTrackRef,
      lightness: lightTrackRef,
    };
    const track = refs[type].current;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    let value: number;

    if (isMobile) {
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const ratio = x / rect.width;
      if (type === 'hue') value = ratio * 360;
      else value = ratio * 100;
    } else {
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      const ratio = y / rect.height;
      if (type === 'hue') value = ratio * 360;
      else value = ratio * 100;
    }

    value = Math.round(value);
    if (type === 'hue') setHue(value);
    else if (type === 'saturation') setSaturation(value);
    else setLightness(value);
  }, [isMobile, setHue, setSaturation, setLightness]);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: PointerEvent) => updateFromPointer(dragging, e);
    const onUp = (e: PointerEvent) => {
      setDragging(null);
      const currentHsl = useColorStore.getState().hsl;
      const currentHex = useColorStore.getState().hex;
      addToHistory(currentHex, currentHsl);
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch (_) { /* noop */ }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, updateFromPointer, addToHistory]);

  const getTrackGradient = (type: SliderType): string => {
    if (type === 'hue') {
      return isMobile
        ? 'linear-gradient(to right, #FF0000 0%, #FFFF00 17%, #00FF00 33%, #00FFFF 50%, #0000FF 67%, #FF00FF 83%, #FF0000 100%)'
        : 'linear-gradient(to bottom, #FF0000 0%, #FFFF00 17%, #00FF00 33%, #00FFFF 50%, #0000FF 67%, #FF00FF 83%, #FF0000 100%)';
    }
    if (type === 'saturation') {
      const gray = `hsl(${hsl.h}, 0%, ${hsl.l}%)`;
      const full = `hsl(${hsl.h}, 100%, ${hsl.l}%)`;
      return isMobile
        ? `linear-gradient(to right, ${gray}, ${full})`
        : `linear-gradient(to bottom, ${gray}, ${full})`;
    }
    const dark = `hsl(${hsl.h}, ${hsl.s}%, 0%)`;
    const mid = `hsl(${hsl.h}, ${hsl.s}%, 50%)`;
    const light = `hsl(${hsl.h}, ${hsl.s}%, 100%)`;
    return isMobile
      ? `linear-gradient(to right, ${dark}, ${mid}, ${light})`
      : `linear-gradient(to bottom, ${dark}, ${mid}, ${light})`;
  };

  const getThumbPosition = (type: SliderType): number => {
    if (type === 'hue') return (hsl.h / 360) * 100;
    if (type === 'saturation') return hsl.s;
    return hsl.l;
  };

  const getValue = (type: SliderType): number => {
    if (type === 'hue') return hsl.h;
    if (type === 'saturation') return hsl.s;
    return hsl.l;
  };

  const getUnit = (type: SliderType): string => (type === 'hue' ? '°' : '%');

  const labels: Record<SliderType, { label: string; short: string }> = {
    hue: { label: '色相', short: 'H' },
    saturation: { label: '饱和度', short: 'S' },
    lightness: { label: '亮度', short: 'L' },
  };

  const renderSlider = (type: SliderType) => {
    const refs: Record<SliderType, React.RefObject<HTMLDivElement>> = {
      hue: hueTrackRef,
      saturation: satTrackRef,
      lightness: lightTrackRef,
    };
    const trackRef = refs[type];
    const pos = getThumbPosition(type);
    const active = dragging === type;

    if (isMobile) {
      return (
        <div key={type} className="slider-row">
          <div className="slider-label-wrap">
            <span className="slider-short">{labels[type].short}</span>
            <span className="slider-label-text">{labels[type].label}</span>
          </div>
          <div
            ref={trackRef}
            className={`slider-track horizontal ${active ? 'active' : ''}`}
            style={{ background: getTrackGradient(type) }}
            onPointerDown={handlePointerDown(type)}
          >
            <div
              className="slider-thumb"
              style={{ left: `${pos}%`, background: hex }}
            />
          </div>
          <span className="slider-value">{getValue(type)}{getUnit(type)}</span>
        </div>
      );
    }

    return (
      <div key={type} className="slider-column">
        <span className="slider-value-vertical">{getValue(type)}{getUnit(type)}</span>
        <div
          ref={trackRef}
          className={`slider-track vertical ${active ? 'active' : ''}`}
          style={{ background: getTrackGradient(type) }}
          onPointerDown={handlePointerDown(type)}
        >
          <div
            className="slider-thumb"
            style={{ top: `${pos}%`, background: hex }}
          />
        </div>
        <div className="slider-label-vertical">
          <span className="slider-short">{labels[type].short}</span>
          <span className="slider-label-text">{labels[type].label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`color-sliders ${isMobile ? 'horizontal-layout' : 'vertical-layout'}`}>
      {(['hue', 'saturation', 'lightness'] as SliderType[]).map(renderSlider)}
    </div>
  );
});

ColorSliders.displayName = 'ColorSliders';
export default ColorSliders;
