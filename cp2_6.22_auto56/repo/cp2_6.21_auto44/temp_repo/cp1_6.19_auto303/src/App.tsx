import { useMemo } from 'react';
import { useRecipeStore } from './store/useRecipeStore';
import type { RecipeStore } from './types';
import { IngredientShelf } from './components/IngredientShelf';
import { SynthesisZone } from './components/SynthesisZone';
import { NutritionChart } from './components/NutritionChart';
import { CardGallery } from './components/CardGallery';
import styles from './App.module.css';

function App() {
  const getTotalNutrition = useRecipeStore((state: RecipeStore) => state.getTotalNutrition);
  const getNutrientPercentages = useRecipeStore(
    (state: RecipeStore) => state.getNutrientPercentages
  );

  const totalNutrition = useMemo(() => getTotalNutrition(), [getTotalNutrition]);
  const percentages = useMemo(
    () => getNutrientPercentages(),
    [getNutrientPercentages]
  );

  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>👨‍🍳</span>
            微型菜谱实验室
            <span className={styles.titleIcon}>🔬</span>
          </h1>
          <p className={styles.subtitle}>
            像科学家一样烹饪，自由组合食材，探索无限风味可能
          </p>
        </header>

        <div className={styles.mainContent}>
          <IngredientShelf />
          <SynthesisZone />
          <div className={styles.sideColumn}>
            <NutritionChart
              percentages={percentages}
              totalCalories={totalNutrition.calories}
            />
          </div>
        </div>

        <CardGallery />
      </div>
    </div>
  );
}

export default App;
