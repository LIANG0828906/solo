import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ParameterPanel from './components/ParameterPanel';
import CanvasRenderer from './components/CanvasRenderer';
import GalleryPage from './components/GalleryPage';
import { saveLogo, getGallery, toggleFavorite, getPresets, Logo, LogoParams, Preset } from './services/apiService';

const presetMap: Record<string, LogoParams> = {
  '几何风暴': { hue: 0, rotation: 45, shapeCount: 12 },
  '光纤漩涡': { hue: 180, rotation: 270, shapeCount: 8 },
  '像素浪潮': { hue: 60, rotation: 135, shapeCount: 15 },
};

const App: React.FC = () => {
  const [params, setParams] = useState<LogoParams>({ hue: 210, rotation: 0, shapeCount: 7 });
  const [logos, setLogos] = useState<Logo[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);

  const fetchGallery = useCallback(async () => {
    try {
      const data = await getGallery();
      setLogos(data);
    } catch (err) {
      console.error('Failed to fetch gallery:', err);
    }
  }, []);

  const fetchPresets = useCallback(async () => {
    try {
      const data = await getPresets();
      setPresets(data);
      data.forEach((p) => {
        presetMap[p.name] = p.params;
      });
    } catch (err) {
      console.error('Failed to fetch presets:', err);
    }
  }, []);

  useEffect(() => {
    fetchGallery();
    fetchPresets();
  }, [fetchGallery, fetchPresets]);

  const handlePresetClick = useCallback((name: string) => {
    const presetParams = presetMap[name];
    if (presetParams) {
      setParams(presetParams);
    }
  }, []);

  const handleSave = useCallback(async (imageData: string) => {
    try {
      await saveLogo({
        name: `标志 ${Date.now()}`,
        params,
        imageData,
      });
      fetchGallery();
    } catch (err) {
      console.error('Failed to save logo:', err);
    }
  }, [params, fetchGallery]);

  const handleToggleFavorite = useCallback(async (id: string) => {
    try {
      await toggleFavorite(id);
      fetchGallery();
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  }, [fetchGallery]);

  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <ParameterPanel
                  params={params}
                  onParamsChange={setParams}
                  onPresetClick={handlePresetClick}
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <nav
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 24,
                      zIndex: 10,
                      display: 'flex',
                      gap: 8,
                    }}
                  >
                    <Link
                      to="/gallery"
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(255,255,255,0.1)',
                        color: '#D4C9B3',
                        borderRadius: 8,
                        textDecoration: 'none',
                        fontSize: 14,
                        transition: 'all 0.2s',
                        border: '1px solid rgba(212,201,179,0.3)',
                      }}
                    >
                      画廊
                    </Link>
                  </nav>
                  <CanvasRenderer params={params} onSave={handleSave} />
                </div>
              </>
            }
          />
          <Route
            path="/gallery"
            element={<GalleryPage logos={logos} onToggleFavorite={handleToggleFavorite} />}
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
