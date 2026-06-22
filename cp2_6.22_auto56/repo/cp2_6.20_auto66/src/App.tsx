import { Routes, Route, Navigate } from 'react-router-dom';
import CharacterCreation from './modules/character/CharacterCreation';
import GameLayout from './components/GameLayout';
import DungeonUI from './modules/dungeon/DungeonUI';
import CombatUI from './modules/combat/CombatUI';
import CharacterSheet from './modules/character/CharacterSheet';
import { useGameStore } from './store/gameStore';

function App() {
  const { character } = useGameStore();

  return (
    <Routes>
      <Route
        path="/"
        element={character ? <Navigate to="/game" replace /> : <CharacterCreation />}
      />
      <Route
        path="/game"
        element={character ? <GameLayout /> : <Navigate to="/" replace />}
      >
        <Route index element={<DungeonUI />} />
        <Route path="combat" element={<CombatUI />} />
        <Route path="character" element={<CharacterSheet />} />
      </Route>
    </Routes>
  );
}

export default App;
