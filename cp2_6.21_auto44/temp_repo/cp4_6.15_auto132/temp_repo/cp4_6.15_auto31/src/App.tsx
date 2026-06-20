import MenuPlanner from '@/components/MenuPlanner';
import ShoppingList from '@/components/ShoppingList';

export default function App() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-warm-cream font-nunito">
      <aside className="w-full md:w-[420px] lg:w-[480px] border-b md:border-b-0 md:border-r border-warm-cream-dark overflow-y-auto flex-shrink-0 max-h-[60vh] md:max-h-none md:h-screen">
        <MenuPlanner />
      </aside>
      <main className="flex-1 min-h-[40vh] md:h-screen bg-white/60 overflow-y-auto">
        <ShoppingList />
      </main>
    </div>
  );
}
