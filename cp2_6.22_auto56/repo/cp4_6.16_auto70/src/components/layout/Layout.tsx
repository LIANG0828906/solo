import { Outlet } from 'react-router-dom';
import Header from './Header';

interface LayoutProps {
  onAddPlant: () => void;
}

export default function Layout({ onAddPlant }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-app-bg">
      <Header onAddPlant={onAddPlant} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="border-t border-primary/10 bg-white/50 backdrop-blur-sm py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-app-text-light">
          PlantDiary © 2026 · 用爱浇灌每一片绿意
        </div>
      </footer>
    </div>
  );
}
