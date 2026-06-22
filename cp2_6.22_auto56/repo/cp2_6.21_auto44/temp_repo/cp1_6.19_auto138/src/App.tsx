import { StoryProvider } from './context/StoryContext';
import { MainPanel } from './ui/MainPanel';

export default function App() {
  return (
    <StoryProvider>
      <MainPanel />
    </StoryProvider>
  );
}
