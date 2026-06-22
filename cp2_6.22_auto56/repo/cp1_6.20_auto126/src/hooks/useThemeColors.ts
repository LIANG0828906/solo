import { useState, useCallback } from 'react';
import { KeyColor, KeyMaterial, ColorScheme, PresetTheme } from '../types';
import { KEYBOARD_LAYOUT } from '../data/keyboardLayout';

const DEFAULT_COLOR = '#FFFFFF';
const DEFAULT_MATERIAL: KeyMaterial = 'matte';
const SCHEME_VERSION = '1.0';

const createDefaultScheme = (): ColorScheme => {
  const keys: Record<string, KeyColor> = {};
  KEYBOARD_LAYOUT.forEach((k) => {
    keys[k.id] = { color: DEFAULT_COLOR, material: DEFAULT_MATERIAL };
  });
  return { version: SCHEME_VERSION, name: 'Default White', keys };
};

const buildThemeScheme = (name: string, rowColors: string[], accents?: Record<string, string>): ColorScheme => {
  const keys: Record<string, KeyColor> = {};
  KEYBOARD_LAYOUT.forEach((k) => {
    const color = accents?.[k.id] ?? rowColors[k.row % rowColors.length];
    keys[k.id] = { color, material: DEFAULT_MATERIAL };
  });
  return { version: SCHEME_VERSION, name, keys };
};

export const PRESET_THEMES: PresetTheme[] = [
  {
    id: 'default-white',
    name: '纯白默认',
    colors: ['#FFFFFF'],
    scheme: createDefaultScheme(),
  },
  {
    id: 'vintage-retro',
    name: '复古灰白',
    colors: ['#E8E3D9', '#D9D3C7', '#C9C2B5', '#B8B0A1', '#A89F8F', '#9A9180'],
    scheme: buildThemeScheme('复古灰白', ['#E8E3D9', '#D9D3C7', '#C9C2B5', '#B8B0A1', '#A89F8F', '#9A9180'], {
      esc: '#C47F5A',
      enter: '#C47F5A',
      space: '#B56C49',
    }),
  },
  {
    id: 'cyberpunk-neon',
    name: '赛博朋克',
    colors: ['#0A0A1A', '#1A0A2A', '#2A1A3A', '#1A2A3A', '#0A3A3A', '#1A1A4A'],
    scheme: buildThemeScheme('赛博朋克', ['#0A0A1A', '#1A0A2A', '#2A1A3A', '#1A2A3A', '#0A3A3A', '#1A1A4A'], {
      esc: '#FF1493',
      'f1': '#00FFFF',
      'f2': '#FF1493',
      'f3': '#00FFFF',
      'f4': '#FF1493',
      'f5': '#FFFF00',
      'f6': '#00FFFF',
      'f7': '#FFFF00',
      'f8': '#00FFFF',
      'f9': '#FF1493',
      'f10': '#00FFFF',
      'f11': '#FF1493',
      'f12': '#FFFF00',
      enter: '#FF1493',
      space: '#00FFFF',
    }),
  },
  {
    id: 'macaron-pinkblue',
    name: '马卡龙粉蓝',
    colors: ['#FFE4EC', '#FFD1DC', '#FFC8DD', '#BDE0FE', '#A2D2FF', '#CDB4DB'],
    scheme: buildThemeScheme('马卡龙粉蓝', ['#FFE4EC', '#FFD1DC', '#FFC8DD', '#BDE0FE', '#A2D2FF', '#CDB4DB'], {
      esc: '#FFAFCC',
      enter: '#B8C0FF',
      space: '#FFC8DD',
    }),
  },
  {
    id: 'forest-greenbrown',
    name: '森林绿棕',
    colors: ['#EFE5D0', '#D4C4A0', '#A8B894', '#7A9670', '#5A7A50', '#6B5344'],
    scheme: buildThemeScheme('森林绿棕', ['#EFE5D0', '#D4C4A0', '#A8B894', '#7A9670', '#5A7A50', '#6B5344'], {
      esc: '#5A7A50',
      enter: '#8B6914',
      space: '#6B5344',
    }),
  },
];

interface ImportResult {
  success: boolean;
  error?: string;
  scheme?: ColorScheme;
}

export interface ToastState {
  type: 'success' | 'error' | null;
  message: string;
}

export const useThemeColors = () => {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(createDefaultScheme());
  const [activeThemeId, setActiveThemeId] = useState<string>('default-white');
  const [animationTrigger, setAnimationTrigger] = useState<number>(0);
  const [toast, setToast] = useState<ToastState>({ type: null, message: '' });
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>('space');

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: null, message: '' }), type === 'success' ? 1800 : 2500);
  }, []);

  const updateKeyColor = useCallback((keyId: string, color: string) => {
    setColorScheme((prev) => ({
      ...prev,
      keys: { ...prev.keys, [keyId]: { ...prev.keys[keyId], color } },
    }));
    setActiveThemeId('');
  }, []);

  const updateKeyMaterial = useCallback((keyId: string, material: KeyMaterial) => {
    setColorScheme((prev) => ({
      ...prev,
      keys: { ...prev.keys, [keyId]: { ...prev.keys[keyId], material } },
    }));
    setActiveThemeId('');
  }, []);

  const applyPresetTheme = useCallback((themeId: string) => {
    const theme = PRESET_THEMES.find((t) => t.id === themeId);
    if (!theme) return;
    setColorScheme(theme.scheme);
    setActiveThemeId(themeId);
    setAnimationTrigger((prev) => prev + 1);
  }, []);

  const validateAndParseScheme = (raw: string): ImportResult => {
    try {
      const parsed = JSON.parse(raw) as ColorScheme;
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: '配色代码格式错误：不是有效的 JSON 对象' };
      }
      if (!parsed.version || typeof parsed.version !== 'string') {
        return { success: false, error: '配色代码缺少 version 字段' };
      }
      if (!parsed.keys || typeof parsed.keys !== 'object') {
        return { success: false, error: '配色代码缺少 keys 字段' };
      }
      const validKeys = KEYBOARD_LAYOUT.map((k) => k.id);
      for (const keyId of validKeys) {
        const kc = parsed.keys[keyId];
        if (!kc || typeof kc.color !== 'string' || typeof kc.material !== 'string') {
          return { success: false, error: `按键 ${keyId} 的配色数据格式错误` };
        }
        if (!/^#[0-9A-Fa-f]{6}$/.test(kc.color)) {
          return { success: false, error: `按键 ${keyId} 的颜色值格式错误，应为 #RRGGBB` };
        }
        if (!['matte', 'glossy', 'satin'].includes(kc.material)) {
          return { success: false, error: `按键 ${keyId} 的材质类型无效` };
        }
      }
      const sanitized: ColorScheme = {
        version: parsed.version,
        name: parsed.name || 'Imported Scheme',
        keys: {},
      };
      for (const keyId of validKeys) {
        sanitized.keys[keyId] = parsed.keys[keyId] as KeyColor;
      }
      return { success: true, scheme: sanitized };
    } catch (e) {
      return { success: false, error: 'JSON 解析失败，请检查配色代码格式' };
    }
  };

  const exportScheme = useCallback(() => {
    const jsonStr = JSON.stringify(colorScheme, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keycap-scheme-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('success', '配色方案导出成功！');
  }, [colorScheme, showToast]);

  const importScheme = useCallback((jsonText: string) => {
    const result = validateAndParseScheme(jsonText);
    if (!result.success || !result.scheme) {
      showToast('error', result.error ?? '导入失败');
      return false;
    }
    setColorScheme(result.scheme);
    setActiveThemeId('');
    setAnimationTrigger((prev) => prev + 1);
    showToast('success', '配色方案导入成功！');
    return true;
  }, [showToast]);

  return {
    colorScheme,
    activeThemeId,
    animationTrigger,
    toast,
    selectedKeyId,
    setSelectedKeyId,
    updateKeyColor,
    updateKeyMaterial,
    applyPresetTheme,
    exportScheme,
    importScheme,
  };
};
