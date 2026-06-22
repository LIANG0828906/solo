import { useState, useRef, useEffect } from 'react';
import { Search, X, Clock } from 'lucide-react';
import { usePetStore } from '@/store';
import { Pet, SPECIES_LABELS, PetSpecies } from '@/types';

export default function SearchBar() {
  const { searchQuery, setSearchQuery, addSearchHistory, searchHistory, petList } = usePetStore();
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matchingPets = searchQuery
    ? petList.filter(
        (pet: Pet) =>
          pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          SPECIES_LABELS[pet.species as PetSpecies].toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center bg-base-card border border-base-border rounded-[20px] px-4 py-2.5 transition-all${
          isFocused ? ' border-accent ring-1 ring-accent/30' : ''
        }`}
      >
        <Search size={18} className="text-text-secondary mr-2 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="bg-transparent outline-none text-text-primary placeholder:text-text-secondary/50 w-full text-sm"
          placeholder="搜索宠物名字或种类..."
        />
        {searchQuery && (
          <X
            size={16}
            className="text-text-secondary hover:text-text-primary ml-2 shrink-0 cursor-pointer"
            onClick={() => setSearchQuery('')}
          />
        )}
      </div>

      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-base-card border border-[#3A3A5C] rounded-xl overflow-hidden z-50 animate-slide-down">
          {searchHistory.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs text-text-secondary font-medium border-b border-base-border">
                搜索历史
              </div>
              {searchHistory.map((item: string, index: number) => (
                <div
                  key={index}
                  className="px-4 py-2.5 text-sm text-text-primary hover:bg-base-hover cursor-pointer flex items-center gap-2"
                  onClick={() => {
                    setSearchQuery(item);
                    addSearchHistory(item);
                  }}
                >
                  <Clock size={14} />
                  {item}
                </div>
              ))}
            </div>
          )}

          {matchingPets.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs text-text-secondary font-medium border-b border-base-border border-t">
                匹配结果
              </div>
              {matchingPets.map((pet: Pet) => (
                <div
                  key={pet.id}
                  className="px-4 py-2.5 text-sm text-text-primary hover:bg-base-hover cursor-pointer flex items-center gap-2"
                  onClick={() => {
                    setSearchQuery(pet.name);
                    addSearchHistory(pet.name);
                  }}
                >
                  {pet.avatarIcon}
                  {pet.name} · {SPECIES_LABELS[pet.species as PetSpecies]}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
