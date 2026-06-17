import { useState, useCallback, useRef } from 'react';
import { useMenuStore, Drink } from '@/stores/menuStore';
import SeasonSelector from '@/components/SeasonSelector';
import DrinkCard from '@/components/DrinkCard';
import EditorPanel from '@/components/EditorPanel';
import MenuPreview from '@/components/MenuPreview';
import { Plus, Eye, Download, Upload, Coffee } from 'lucide-react';

export default function Home() {
  const seasonMenus = useMenuStore((s) => s.seasonMenus);
  const currentSeason = useMenuStore((s) => s.currentSeason);
  const addDrink = useMenuStore((s) => s.addDrink);
  const updateDrink = useMenuStore((s) => s.updateDrink);
  const removeDrink = useMenuStore((s) => s.removeDrink);
  const reorderDrinks = useMenuStore((s) => s.reorderDrinks);
  const setPreviewOpen = useMenuStore((s) => s.setPreviewOpen);
  const isPreviewOpen = useMenuStore((s) => s.isPreviewOpen);
  const exportData = useMenuStore((s) => s.exportData);
  const importData = useMenuStore((s) => s.importData);
  const saveToLocalStorage = useMenuStore((s) => s.saveToLocalStorage);
  const createNewDrink = useMenuStore((s) => s.createNewDrink);

  const [editingDrink, setEditingDrink] = useState<Drink | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dragItemIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const currentMenu = seasonMenus.find((m) => m.season === currentSeason);
  const drinks = currentMenu?.drinks ?? [];

  const handleOpenEditor = useCallback(() => {
    const newDrink = createNewDrink();
    setEditingDrink(newDrink);
    setIsEditorOpen(true);
  }, [createNewDrink]);

  const handleEditDrink = useCallback((drink: Drink) => {
    setEditingDrink(drink);
    setIsEditorOpen(true);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setIsEditorOpen(false);
    setEditingDrink(null);
  }, []);

  const handleSaveDrink = useCallback(
    (drink: Drink) => {
      const existing = drinks.find((d) => d.id === drink.id);
      if (existing) {
        updateDrink(drink);
      } else {
        addDrink(drink);
      }
      saveToLocalStorage();
      setIsEditorOpen(false);
      setEditingDrink(null);
    },
    [drinks, addDrink, updateDrink, saveToLocalStorage]
  );

  const handleDeleteDrink = useCallback(
    (drinkId: string) => {
      removeDrink(drinkId);
      saveToLocalStorage();
    },
    [removeDrink, saveToLocalStorage]
  );

  const handleDragStart = useCallback((_: React.DragEvent, index: number) => {
    dragItemIndex.current = index;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (_: React.DragEvent, toIndex: number) => {
      const fromIndex = dragItemIndex.current;
      if (fromIndex !== null && fromIndex !== toIndex) {
        reorderDrinks(currentSeason, fromIndex, toIndex);
        saveToLocalStorage();
      }
      dragItemIndex.current = null;
    },
    [currentSeason, reorderDrinks, saveToLocalStorage]
  );

  const handleExport = useCallback(() => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cafe-menu-${currentSeason}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportData, currentSeason]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        const result = importData(json);
        if (result.success) {
          setImportErrors([]);
          saveToLocalStorage();
        } else {
          setImportErrors(result.errors);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [importData, saveToLocalStorage]
  );

  const handlePreview = useCallback(() => {
    setPreviewOpen(true);
  }, [setPreviewOpen]);

  const handleClosePreview = useCallback(() => {
    setPreviewOpen(false);
  }, [setPreviewOpen]);

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white/80 backdrop-blur-sm border-b border-coffee-light/30 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="w-6 h-6 text-coffee-mid" />
            <h1 className="font-display text-xl font-bold text-coffee-dark">
              季节饮品菜单创作器
            </h1>
          </div>
          <button
            onClick={handlePreview}
            className="flex items-center gap-1.5 bg-btn-preview text-white rounded-lg px-4 py-2 hover:bg-btn-preview-hover btn-hover-scale transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            预览菜单
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4">
        <SeasonSelector />

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-coffee-mid">
            当前季节饮品: {drinks.length}/8
          </p>
          {drinks.length < 8 && (
            <button
              onClick={handleOpenEditor}
              className="flex items-center gap-1.5 bg-coffee-light/30 text-coffee-dark rounded-lg px-4 py-2 hover:bg-coffee-light/50 btn-hover-scale transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              添加饮品
            </button>
          )}
        </div>

        {drinks.length === 0 ? (
          <div className="text-center py-16">
            <Coffee className="w-12 h-12 text-coffee-light mx-auto mb-3" />
            <p className="text-coffee-mid font-body">
              还没有饮品，点击上方按钮开始创建
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {drinks.map((drink, index) => (
              <DrinkCard
                key={drink.id}
                drink={drink}
                index={index}
                onEdit={handleEditDrink}
                onDelete={handleDeleteDrink}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))}
          </div>
        )}

        {importErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-error-red/30 rounded-xl animate-fade-in">
            <p className="text-error-red text-sm font-medium mb-1">导入错误：</p>
            <ul className="list-disc list-inside text-xs text-error-red/80">
              {importErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-coffee-light/30 flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-white rounded-lg px-4 py-2 btn-hover-scale transition-colors text-sm font-medium"
            style={{ backgroundColor: '#555' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#777')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#555')}
          >
            <Download className="w-4 h-4" />
            导出 JSON
          </button>
          <button
            onClick={handleImport}
            className="flex items-center gap-1.5 text-white rounded-lg px-4 py-2 btn-hover-scale transition-colors text-sm font-medium"
            style={{ backgroundColor: '#555' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#777')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#555')}
          >
            <Upload className="w-4 h-4" />
            导入 JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </main>

      {isEditorOpen && (
        <EditorPanel
          drink={editingDrink}
          onClose={handleCloseEditor}
          onSave={handleSaveDrink}
        />
      )}

      {isPreviewOpen && <MenuPreview onClose={handleClosePreview} />}
    </div>
  );
}
