import { useMemo } from 'react';
import { usePetStore } from '@/store';
import PetCard from '@/components/PetCard';
import SearchBar from '@/components/SearchBar';
import RecommendSection from '@/components/RecommendSection';
import { Pet } from '@/types';

export default function Dashboard() {
  const { petList, searchQuery, isLoading } = usePetStore();

  const filteredPets = useMemo(() => {
    if (!searchQuery) return petList;
    const q = searchQuery.toLowerCase();
    return petList.filter(
      (pet) =>
        pet.name.toLowerCase().includes(q) ||
        pet.species.toLowerCase().includes(q)
    );
  }, [petList, searchQuery]);

  const handleSelect = (pet: Pet) => {
    window.location.hash = '#/pet/' + pet.id;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text-primary">宠物看板</h1>
      <p className="text-sm text-text-secondary mt-1">发现需要照料的宠物伙伴</p>

      <SearchBar />
      <RecommendSection />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-base-card rounded-2xl h-48 animate-pulse min-w-[240px]" />
          ))}
        </div>
      ) : filteredPets.length === 0 ? (
        <div className="text-center text-text-secondary py-16">
          没有找到匹配的宠物
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredPets.map((pet) => (
            <PetCard key={pet.id} pet={pet} onSelect={handleSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
