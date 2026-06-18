import { Routes, Route } from 'react-router-dom';
import CabinetView from '@/components/CabinetView';
import CardDetail from '@/components/CardDetail';
import CardForm from '@/components/CardForm';
import KnowledgeGraph from '@/components/KnowledgeGraph';
import { useStore } from '@/store/useStore';

export default function App() {
  const isFormOpen = useStore((state) => state.isFormOpen);
  const isGraphOpen = useStore((state) => state.isGraphOpen);

  return (
    <div className="min-h-screen fade-in">
      <Routes>
        <Route path="/" element={<CabinetView />} />
        <Route path="/card/:id" element={<CardDetail />} />
        <Route path="/tag/:tag" element={<CabinetView />} />
      </Routes>

      {isFormOpen && <CardForm />}
      {isGraphOpen && <KnowledgeGraph />}
    </div>
  );
}
