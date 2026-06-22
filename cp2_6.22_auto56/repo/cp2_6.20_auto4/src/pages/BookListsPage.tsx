import BookListManager from '@/components/BookListManager';

export default function BookListsPage() {
  return (
    <div className="container mx-auto px-4 pt-20 pb-8">
      <h1 className="mb-6 font-serif text-2xl font-bold text-text">我的书单</h1>
      <BookListManager />
    </div>
  );
}
