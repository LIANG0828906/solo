import { Molecule } from './components/Molecule';
import { UIPanel } from './components/UIPanel';

export default function App() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
      }}
    >
      <Molecule />
      <UIPanel />
    </div>
  );
}
