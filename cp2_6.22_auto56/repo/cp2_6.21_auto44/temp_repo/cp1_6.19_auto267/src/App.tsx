import { Workbench } from './components/Workbench';
import { PotionPreview } from './components/PotionPreview';
import { RecipeBook } from './components/RecipeBook';
import { NewRecipeModal } from './components/NewRecipeModal';
import { useGameStore } from './store';

function App() {
  const { synthesisResult, closeSynthesisResult, newlyUnlockedRecipe, closeNewRecipe } =
    useGameStore();

  return (
    <div className="min-h-screen">
      <Workbench />
      <PotionPreview result={synthesisResult} onClose={closeSynthesisResult} />
      <RecipeBook />
      <NewRecipeModal recipe={newlyUnlockedRecipe} onClose={closeNewRecipe} />
    </div>
  );
}

export default App;
