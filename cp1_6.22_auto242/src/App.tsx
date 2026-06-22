import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import IngredientsPage from './pages/IngredientsPage';
import RecipesPage from './pages/RecipesPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import TestingPage from './pages/TestingPage';
import ReportsPage from './pages/ReportsPage';
import type { Ingredient, Recipe, TestingRecord } from './types';

type Page = 'ingredients' | 'recipes' | 'testing' | 'reports';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('ingredients');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [testings, setTestings] = useState<TestingRecord[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ingRes, recRes, testRes] = await Promise.all([
        fetch('/api/ingredients'),
        fetch('/api/recipes'),
        fetch('/api/testings'),
      ]);
      
      const [ingData, recData, testData] = await Promise.all([
        ingRes.json(),
        recRes.json(),
        testRes.json(),
      ]);
      
      setIngredients(ingData);
      setRecipes(recData);
      setTestings(testData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setSelectedRecipe(null);
  };

  const handleAddIngredient = async (data: Omit<Ingredient, 'id'>) => {
    try {
      const res = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const newIng = await res.json();
      setIngredients(prev => [...prev, newIng]);
    } catch (error) {
      console.error('添加原料失败:', error);
    }
  };

  const handleUpdateIngredient = async (id: string, data: Partial<Ingredient>) => {
    try {
      const res = await fetch(`/api/ingredients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      setIngredients(prev => prev.map(i => i.id === id ? updated : i));
    } catch (error) {
      console.error('更新原料失败:', error);
    }
  };

  const handleDeleteIngredient = async (id: string) => {
    try {
      await fetch(`/api/ingredients/${id}`, { method: 'DELETE' });
      setIngredients(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('删除原料失败:', error);
    }
  };

  const handleAddRecipe = async (data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'versions'>) => {
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const newRecipe = await res.json();
      setRecipes(prev => [...prev, newRecipe]);
      setSelectedRecipe(newRecipe);
      setCurrentPage('recipes');
    } catch (error) {
      console.error('创建配方失败:', error);
    }
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleUpdateRecipe = async (id: string, data: Partial<Recipe>, versionNote?: string) => {
    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, versionNote }),
      });
      const updated = await res.json();
      setRecipes(prev => prev.map(r => r.id === id ? updated : r));
      setSelectedRecipe(updated);
    } catch (error) {
      console.error('更新配方失败:', error);
    }
  };

  const handleRollbackRecipe = async (recipeId: string, versionId: string) => {
    try {
      const res = await fetch(`/api/recipes/${recipeId}/rollback/${versionId}`, {
        method: 'POST',
      });
      const updated = await res.json();
      setRecipes(prev => prev.map(r => r.id === recipeId ? updated : r));
      setSelectedRecipe(updated);
    } catch (error) {
      console.error('回滚配方失败:', error);
    }
  };

  const handleAddTesting = async (data: Omit<TestingRecord, 'id'>) => {
    try {
      const res = await fetch('/api/testings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const newTesting = await res.json();
      setTestings(prev => [...prev, newTesting]);
    } catch (error) {
      console.error('添加试香记录失败:', error);
    }
  };

  const sidebarContent = () => {
    if (currentPage === 'ingredients') {
      return (
        <div>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#3C2415',
            fontFamily: "'Inter', sans-serif",
            margin: '0 0 16px 0',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            快速统计
          </h3>
          
          <div style={{
            backgroundColor: '#FDFBF7',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '16px',
            border: '1px solid #E0D6C8',
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#C9A96E',
              fontFamily: "'Playfair Display', serif",
              marginBottom: '4px',
            }}>
              {ingredients.length}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#8B7355',
              fontFamily: "'Inter', sans-serif",
            }}>
              种香料原料
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#7C9A73',
              }} />
              <span style={{
                fontSize: '12px',
                color: '#5C4033',
                fontFamily: "'Inter', sans-serif",
              }}>
                库存充足
              </span>
              <span style={{
                marginLeft: 'auto',
                fontSize: '12px',
                fontWeight: 600,
                color: '#7C9A73',
                fontFamily: "'Inter', sans-serif",
              }}>
                {ingredients.filter(i => i.stock >= 20).length}
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#D4A373',
              }} />
              <span style={{
                fontSize: '12px',
                color: '#5C4033',
                fontFamily: "'Inter', sans-serif",
              }}>
                低库存
              </span>
              <span style={{
                marginLeft: 'auto',
                fontSize: '12px',
                fontWeight: 600,
                color: '#D4A373',
                fontFamily: "'Inter', sans-serif",
              }}>
                {ingredients.filter(i => i.stock > 0 && i.stock < 20).length}
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#C47A7A',
              }} />
              <span style={{
                fontSize: '12px',
                color: '#5C4033',
                fontFamily: "'Inter', sans-serif",
              }}>
                缺货
              </span>
              <span style={{
                marginLeft: 'auto',
                fontSize: '12px',
                fontWeight: 600,
                color: '#C47A7A',
                fontFamily: "'Inter', sans-serif",
              }}>
                {ingredients.filter(i => i.stock <= 0).length}
              </span>
            </div>
          </div>
        </div>
      );
    }
    
    if (currentPage === 'recipes' || (currentPage === 'recipes' && !selectedRecipe)) {
      return (
        <div>
          <h3 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#3C2415',
          fontFamily: "'Inter', sans-serif",
          margin: '0 0 16px 0',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          配方概览
        </h3>
        
        <div style={{
          backgroundColor: '#FDFBF7',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '16px',
          border: '1px solid #E0D6C8',
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#C9A96E',
            fontFamily: "'Playfair Display', serif",
            marginBottom: '4px',
          }}>
            {recipes.length}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#8B7355',
            fontFamily: "'Inter', sans-serif",
          }}>
            个配方
          </div>
        </div>
        
        <div style={{
          fontSize: '12px',
          color: '#8B7355',
          fontFamily: "'Inter', sans-serif",
          lineHeight: 1.6,
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #E0D6C8',
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#5C4033' }}>💡 小贴士</p>
          <p style={{ margin: 0 }}>
            点击配方卡片可进入详情页，编辑配方配比并查看成本分析。
          </p>
        </div>
        </div>
      );
    }
    
    if (currentPage === 'testing') {
      return (
        <div>
          <h3 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#3C2415',
          fontFamily: "'Inter', sans-serif",
          margin: '0 0 16px 0',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          试香统计
        </h3>
        
        <div style={{
          backgroundColor: '#FDFBF7',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '16px',
          border: '1px solid #E0D6C8',
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#C9A96E',
            fontFamily: "'Playfair Display', serif",
            marginBottom: '4px',
          }}>
            {testings.length}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#8B7355',
            fontFamily: "'Inter', sans-serif",
          }}>
            条试香记录
          </div>
        </div>
        
        <div style={{
          fontSize: '12px',
          color: '#8B7355',
          fontFamily: "'Inter', sans-serif",
          lineHeight: 1.6,
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #E0D6C8',
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#5C4033' }}>📝 记录要点</p>
          <p style={{ margin: 0 }}>
            详细记录每一次试香感受，追踪配方迭代时参考。
          </p>
        </div>
        </div>
      );
    }
    
    if (currentPage === 'reports') {
      return (
        <div>
          <h3 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#3C2415',
          fontFamily: "'Inter', sans-serif",
          margin: '0 0 16px 0',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          报告中心
        </h3>
        
        <div style={{
          backgroundColor: '#FDFBF7',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '16px',
          border: '1px solid #E0D6C8',
        }}>
          <div style={{
            fontSize: '13px',
            color: '#5C4033',
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.6,
          }}>
            查看库存统计、成本分析，支持导出PDF报告。
          </div>
        </div>
        
        <div style={{
          fontSize: '12px',
          color: '#8B7355',
          fontFamily: "'Inter', sans-serif",
          lineHeight: 1.6,
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #E0D6C8',
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#5C4033' }}>📊 功能说明</p>
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            <li style={{ marginBottom: '4px' }}>库存预警提醒</li>
            <li style={{ marginBottom: '4px' }}>配方成本分析</li>
            <li>PDF报告导出</li>
          </ul>
        </div>
        </div>
      );
    }
    
    return null;
  };

  const renderPage = () => {
    if (loading) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          color: '#8B7355',
          fontSize: '16px',
          fontFamily: "'Inter', sans-serif",
        }}>
          加载中...
        </div>
      );
    }

    switch (currentPage) {
      case 'ingredients':
        return (
          <IngredientsPage
            ingredients={ingredients}
            onAddIngredient={handleAddIngredient}
            onUpdateIngredient={handleUpdateIngredient}
            onDeleteIngredient={handleDeleteIngredient}
          />
        );
      case 'recipes':
        if (selectedRecipe) {
          return (
            <RecipeDetailPage
              recipe={selectedRecipe}
              ingredients={ingredients}
              onBack={() => setSelectedRecipe(null)}
              onUpdate={handleUpdateRecipe}
              onRollback={handleRollbackRecipe}
            />
          );
        }
        return (
          <RecipesPage
            recipes={recipes}
            ingredients={ingredients}
            onAddRecipe={handleAddRecipe}
            onSelectRecipe={handleSelectRecipe}
          />
        );
      case 'testing':
        return (
          <TestingPage
            records={testings}
            recipes={recipes}
            onAddRecord={handleAddTesting}
          />
        );
      case 'reports':
        return (
          <ReportsPage
            recipes={recipes}
            ingredients={ingredients}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FDFBF7',
      color: '#3C2415',
      fontFamily: "'Inter', 'Noto Serif SC', sans-serif",
    }}>
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
      
      <div style={{ display: 'flex', paddingTop: '56px' }}>
        <Sidebar isOpen={sidebarOpen}>
          {sidebarContent()}
        </Sidebar>
        
        <main style={{
          flex: 1,
          padding: '24px 32px',
          minWidth: 0,
        }}>
          {renderPage()}
        </main>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          background-color: #FDFBF7;
        }
        
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #F0EBE0;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #D4C5A9;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #C9A96E;
        }
        
        input:focus, select:focus, textarea:focus {
          box-shadow: 0 0 0 3px rgba(201,169,110,0.3) !important;
          border-color: #C9A96E !important;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 1024px) {
          main {
            padding: 20px !important;
          }
        }
        
        @media (max-width: 768px) {
          main {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default App;

