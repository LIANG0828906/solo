import { useEffect } from 'react';
import { useExhibitStore } from './store';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import ExhibitionGrid from './components/ExhibitionGrid';
import ExhibitModal from './components/ExhibitModal';
import ExhibitForm from './components/ExhibitForm';
import FloatingButton from './components/FloatingButton';
import './App.css';

function App() {
  const { exhibits, fetchExhibits } = useExhibitStore();

  useEffect(() => {
    fetchExhibits();
  }, [fetchExhibits]);

  return (
    <div className="app">
      <div className="vertical-decoration" />
      <Navbar />
      <main className="main-content">
        <SearchBar />
        <ExhibitionGrid exhibits={exhibits} />
      </main>
      <FloatingButton />
      <ExhibitModal />
      <ExhibitForm />
    </div>
  );
}

export default App;
