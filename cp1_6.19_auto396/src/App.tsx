import React, { useEffect } from 'react';
import ColorPicker from './components/ColorPicker';
import MixSlider from './components/MixSlider';
import ColorPreview from './components/ColorPreview';
import RecipeList from './components/RecipeList';
import { usePaletteStore } from './store/paletteStore';

const App: React.FC = () => {
  const loadRecipes = usePaletteStore((state) => state.loadRecipes);
  const toast = usePaletteStore((state) => state.toast);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  return (
    <div className="app-container">
      <div className="workspace-panel">
        <h1 className="panel-title" style={{ marginBottom: 0 }}>
          🎨 水彩调色台
        </h1>
        <ColorPicker />
        <MixSlider />
        <ColorPreview />
      </div>
      <div className="recipes-panel">
        <RecipeList />
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default App;
