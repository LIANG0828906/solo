import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import UserProfile from '@/components/UserProfile';
import SearchFilter from '@/components/SearchFilter';
import CardList from '@/components/CardList';
import BookForm from '@/components/BookForm';
import { useBookStore } from '@/stores/bookStore';
import { useDriftStore } from '@/stores/driftStore';
import { useUserStore } from '@/stores/userStore';

export default function Home() {
  const { fetchBooks } = useBookStore();
  const { fetchRecords } = useDriftStore();
  const { fetchUser } = useUserStore();

  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    void fetchBooks();
    void fetchRecords();
    void fetchUser();
  }, [fetchBooks, fetchRecords, fetchUser]);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-oak-800">我的漂流墙</h2>
          <UserProfile />
        </section>

        <section className="mb-6">
          <SearchFilter onAddBook={() => setShowAddModal(true)} />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-oak-800">漂流书籍</h2>
        </div>
          <CardList />
        </section>
      </main>

      <BookForm isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
