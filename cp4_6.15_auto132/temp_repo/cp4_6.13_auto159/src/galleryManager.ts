import type { CharacterData } from './types';

export class GalleryManager {
  private storageKey: string;

  constructor(storageKey: string = 'fictional_portrait_gallery') {
    this.storageKey = storageKey;
  }

  saveCharacter(character: CharacterData): void {
    const characters = this.getAllCharacters();
    characters.push(character);
    localStorage.setItem(this.storageKey, JSON.stringify(characters));
  }

  getAllCharacters(): CharacterData[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        return [];
      }
      const characters = JSON.parse(data) as CharacterData[];
      return characters.sort((a, b) => b.createdAt - a.createdAt);
    } catch {
      return [];
    }
  }

  deleteCharacter(id: string): void {
    const characters = this.getAllCharacters();
    const filtered = characters.filter(c => c.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }

  searchCharacters(keyword: string): CharacterData[] {
    const characters = this.getAllCharacters();
    return characters.filter(
      c => c.name.includes(keyword) || c.description.includes(keyword)
    );
  }

  getCharacterCount(): number {
    return this.getAllCharacters().length;
  }
}
