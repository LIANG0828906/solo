import { useEffect, useMemo, useRef, useState } from 'react';
import { debounce } from 'lodash';
import FontCardList, { type FontData } from './FontCardList';

export type Category = 'all' | 'serif' | 'sans-serif' | 'monospace' | 'display' | 'handwriting';
export type SortBy = 'popularity' | 'alpha';

const SAMPLE_TEXT = 'Quick brown fox jumps over the lazy dog';

const mockFonts: FontData[] = [
  { name: 'Roboto', family: 'Roboto', category: 'sans-serif', weights: [100, 300, 400, 500, 700, 900], popularity: 100 },
  { name: 'Open Sans', family: 'Open Sans', category: 'sans-serif', weights: [300, 400, 600, 700, 800], popularity: 98 },
  { name: 'Lato', family: 'Lato', category: 'sans-serif', weights: [100, 300, 400, 700, 900], popularity: 95 },
  { name: 'Montserrat', family: 'Montserrat', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], popularity: 93 },
  { name: 'Playfair Display', family: 'Playfair Display', category: 'serif', weights: [400, 500, 600, 700, 800, 900], popularity: 90 },
  { name: 'Merriweather', family: 'Merriweather', category: 'serif', weights: [300, 400, 700, 900], popularity: 88 },
  { name: 'Source Sans Pro', family: 'Source Sans Pro', category: 'sans-serif', weights: [200, 300, 400, 600, 700, 900], popularity: 86 },
  { name: 'Raleway', family: 'Raleway', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], popularity: 84 },
  { name: 'Poppins', family: 'Poppins', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], popularity: 92 },
  { name: 'Ubuntu', family: 'Ubuntu', category: 'sans-serif', weights: [300, 400, 500, 700], popularity: 82 },
  { name: 'Nunito', family: 'Nunito', category: 'sans-serif', weights: [200, 300, 400, 600, 700, 800, 900], popularity: 80 },
  { name: 'Quicksand', family: 'Quicksand', category: 'sans-serif', weights: [300, 400, 500, 600, 700], popularity: 78 },
  { name: 'Muli', family: 'Muli', category: 'sans-serif', weights: [200, 300, 400, 600, 700, 800, 900], popularity: 76 },
  { name: 'Cabin', family: 'Cabin', category: 'sans-serif', weights: [400, 500, 600, 700], popularity: 74 },
  { name: 'Josefin Sans', family: 'Josefin Sans', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700], popularity: 72 },
  { name: 'Work Sans', family: 'Work Sans', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], popularity: 85 },
  { name: 'Fira Sans', family: 'Fira Sans', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], popularity: 70 },
  { name: 'Lora', family: 'Lora', category: 'serif', weights: [400, 500, 600, 700], popularity: 83 },
  { name: 'Oswald', family: 'Oswald', category: 'sans-serif', weights: [200, 300, 400, 500, 600, 700], popularity: 87 },
  { name: 'Inconsolata', family: 'Inconsolata', category: 'monospace', weights: [200, 300, 400, 500, 600, 700, 800, 900], popularity: 75 },
  { name: 'Space Mono', family: 'Space Mono', category: 'monospace', weights: [400, 700], popularity: 68 },
  { name: 'PT Serif', family: 'PT Serif', category: 'serif', weights: [400, 700], popularity: 79 },
  { name: 'Cardo', family: 'Cardo', category: 'serif', weights: [400, 700], popularity: 60 },
  { name: 'Georgia', family: 'Georgia', category: 'serif', weights: [400, 700], popularity: 96 },
  { name: 'Arial', family: 'Arial', category: 'sans-serif', weights: [400, 700], popularity: 99 },
  { name: 'Helvetica', family: 'Helvetica', category: 'sans-serif', weights: [400, 700], popularity: 97 },
  { name: 'Times New Roman', family: 'Times New Roman', category: 'serif', weights: [400, 700], popularity: 94 },
  { name: 'Courier New', family: 'Courier New', category: 'monospace', weights: [400, 700], popularity: 89 },
  { name: 'Pacifico', family: 'Pacifico', category: 'handwriting', weights: [400], popularity: 77 },
  { name: 'Dancing Script', family: 'Dancing Script', category: 'handwriting', weights: [400, 500, 600, 700], popularity: 73 },
];

const STORAGE_KEY = 'fontSelector.selection';

interface StoredSelection {
  heading: string;
  body: string;
}

const rootStyles = `
  .fs-panel { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .fs-search {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 14px;
    font-size: 14px;
    border: 1px solid #E0E0E0;
    border-radius: 8px;
    outline: none;
    background: #FDFDFD;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .fs-search:focus {
    border-color: #E27D60;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06), 0 0 0 3px rgba(226, 125, 96, 0.12);
  }
  .fs-search::placeholder { color: #B8B8B8; }

  .fs-tab-row {
    display: flex;
    background: #F4F4F4;
    border-radius: 8px;
    padding: 3px;
  }
  .fs-tab {
    flex: 1;
    padding: 8px 10px;
    font-size: 13px;
    border: none;
    background: transparent;
    color: #666;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .fs-tab.active {
    background: #FFFFFF;
    color: #E27D60;
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .fs-filter-row { display: flex; gap: 10px; }
  .fs-select {
    flex: 1;
    padding: 8px 10px;
    font-size: 12px;
    border: 1px solid #E0E0E0;
    border-radius: 7px;
    background: #FFFFFF;
    color: #444;
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s ease;
  }
  .fs-select:focus { border-color: #E27D60; }

  .fs-preview {
    background: #FFFBF8;
    border: 1px solid #F5E6DE;
    border-radius: 10px;
    padding: 14px;
  }
  .fs-preview-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #C98B76;
    margin-bottom: 4px;
    font-weight: 600;
  }
  .fs-preview-heading {
    font-size: 20px;
    color: #2C2C2C;
    line-height: 1.3;
    margin-bottom: 12px;
    font-weight: 600;
  }
  .fs-preview-body {
    font-size: 13px;
    color: #555;
    line-height: 1.6;
  }
`;

function dispatchFontSelected(type: 'heading' | 'body', font: FontData) {
  if (typeof window === 'undefined') return;
  try {
    const event = new CustomEvent('fontSelected', { detail: { type, font } });
    window.dispatchEvent(event);
  } catch {
    /* ignore */
  }
}

function buildGoogleFontsUrl(fonts: FontData[]): string {
  const families = fonts
    .map((f) => {
      const w = f.weights.join(';');
      return `${encodeURIComponent(f.family.replace(/\s+/g, '+'))}:wght@${w}`;
    })
    .join('&family=');
  return `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
}

export default function FontSelector() {
  const [styleMounted, setStyleMounted] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'heading' | 'body'>('heading');
  const [category, setCategory] = useState<Category>('all');
  const [sortBy, setSortBy] = useState<SortBy>('popularity');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedHeading, setSelectedHeading] = useState('Roboto');
  const [selectedBody, setSelectedBody] = useState('Open Sans');
  const fontsLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('font-selector-styles')) {
      const el = document.createElement('style');
      el.id = 'font-selector-styles';
      el.textContent = rootStyles;
      document.head.appendChild(el);
    }
    setStyleMounted(true);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredSelection;
        if (parsed.heading) setSelectedHeading(parsed.heading);
        if (parsed.body) setSelectedBody(parsed.body);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ heading: selectedHeading, body: selectedBody } as StoredSelection)
      );
    } catch {
      /* ignore */
    }
  }, [selectedHeading, selectedBody]);

  const debouncedSetter = useMemo(
    () => debounce((val: string) => setDebouncedSearch(val), 300),
    []
  );
  useEffect(() => {
    debouncedSetter(searchTerm);
    return () => debouncedSetter.cancel();
  }, [searchTerm, debouncedSetter]);

  useEffect(() => {
    if (typeof document === 'undefined' || fontsLoadedRef.current) return;
    fontsLoadedRef.current = true;
    const existing = document.getElementById('google-fonts-loaded-by-selector');
    if (existing) return;
    const link = document.createElement('link');
    link.id = 'google-fonts-loaded-by-selector';
    link.rel = 'stylesheet';
    link.href = buildGoogleFontsUrl(mockFonts);
    document.head.appendChild(link);
  }, []);

  const filteredFonts = useMemo(() => {
    let result = [...mockFonts];
    if (category !== 'all') {
      result = result.filter((f) => f.category === category);
    }
    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.family.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'popularity') {
      result.sort((a, b) => b.popularity - a.popularity);
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [category, debouncedSearch, sortBy]);

  const headingFont = mockFonts.find((f) => f.family === selectedHeading) ?? mockFonts[0];
  const bodyFont = mockFonts.find((f) => f.family === selectedBody) ?? mockFonts[1];

  const handleSelectHeading = (font: FontData) => {
    setSelectedHeading(font.family);
    dispatchFontSelected('heading', font);
  };
  const handleSelectBody = (font: FontData) => {
    setSelectedBody(font.family);
    dispatchFontSelected('body', font);
  };

  return (
    <aside
      className="fs-panel"
      style={{
        width: 320,
        minWidth: 320,
        background: '#FFFFFF',
        borderRight: '1px solid #EEE',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {styleMounted && null}

      <div style={{ padding: '18px 18px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#2C2C2C', letterSpacing: -0.01 }}>
            字体选择器
          </h2>
          <span style={{ fontSize: 11, color: '#B0B0B0' }}>{mockFonts.length} 种字体</span>
        </div>

        <input
          type="text"
          className="fs-search"
          placeholder="搜索字体名称、分类..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={{ padding: '14px 18px 0' }}>
        <div className="fs-tab-row" role="tablist">
          <button
            role="tab"
            aria-selected={selectionMode === 'heading'}
            className={`fs-tab${selectionMode === 'heading' ? ' active' : ''}`}
            onClick={() => setSelectionMode('heading')}
          >
            选择标题
          </button>
          <button
            role="tab"
            aria-selected={selectionMode === 'body'}
            className={`fs-tab${selectionMode === 'body' ? ' active' : ''}`}
            onClick={() => setSelectionMode('body')}
          >
            选择正文
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 18px 0' }}>
        <div className="fs-filter-row">
          <select
            className="fs-select"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            <option value="all">全部分类</option>
            <option value="serif">Serif 衬线</option>
            <option value="sans-serif">Sans-serif 无衬线</option>
            <option value="monospace">Monospace 等宽</option>
            <option value="display">Display 装饰</option>
            <option value="handwriting">Handwriting 手写</option>
          </select>
          <select
            className="fs-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
          >
            <option value="popularity">按热度</option>
            <option value="alpha">按字母</option>
          </select>
        </div>
      </div>

      <div style={{ padding: '14px 18px 0' }}>
        <div className="fs-preview">
          <div className="fs-preview-label">预览 · 标题</div>
          <div
            className="fs-preview-heading"
            style={{ fontFamily: headingFont.family }}
          >
            {SAMPLE_TEXT}
          </div>
          <div className="fs-preview-label">预览 · 正文</div>
          <div
            className="fs-preview-body"
            style={{ fontFamily: bodyFont.family }}
          >
            The quick brown fox jumps over the lazy dog. Typography is the art and technique of arranging type.
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 200px)',
          padding: '16px 18px 20px',
          marginTop: 10,
        }}
      >
        {filteredFonts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 10px',
              color: '#B0B0B0',
              fontSize: 13,
            }}
          >
            未找到匹配的字体
          </div>
        ) : (
          <FontCardList
            fonts={filteredFonts}
            selectedHeading={selectedHeading}
            selectedBody={selectedBody}
            onSelectHeading={handleSelectHeading}
            onSelectBody={handleSelectBody}
            selectionMode={selectionMode}
          />
        )}
      </div>
    </aside>
  );
}
