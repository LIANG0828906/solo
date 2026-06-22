import { v4 as uuidv4 } from 'uuid';
import type { Character } from './types';
import { STORYBOARD_CHANGED_EVENT, storyboardManager } from './StoryboardManager';

export const CHARACTER_CHANGED_EVENT = 'character:changed';
export const CHARACTER_REQUEST_EVENT = 'character:request';

const DEFAULT_COLORS = ['#E57373', '#64B5F6', '#81C784', '#FFD54F', '#BA68C8', '#4DB6AC', '#FF8A65', '#7986CB'];

export class CharacterManager {
  private characters: Map<string, Character> = new Map();

  constructor() {
    this.initializeMockData();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    document.addEventListener(STORYBOARD_CHANGED_EVENT, () => {
      this.validateAssociations();
    });
  }

  private emitChanged(): void {
    document.dispatchEvent(new CustomEvent(CHARACTER_CHANGED_EVENT));
  }

  private initializeMockData(): void {
    const mockCharacters: Array<Omit<Character, 'id'>> = [
      {
        name: '林远',
        avatarColor: DEFAULT_COLORS[0],
        personalityTags: ['勇敢', '坚定', '理想主义'],
        catchphrase: '星辰大海，皆是征途！',
      },
      {
        name: '苏晴',
        avatarColor: DEFAULT_COLORS[1],
        personalityTags: ['冷静', '理智', '细心'],
        catchphrase: '数据不会说谎。',
      },
      {
        name: '陈锋',
        avatarColor: DEFAULT_COLORS[2],
        personalityTags: ['豪爽', '忠诚', '可靠'],
        catchphrase: '交给我，放心！',
      },
      {
        name: '白月',
        avatarColor: DEFAULT_COLORS[4],
        personalityTags: ['神秘', '聪慧', '寡言'],
        catchphrase: '命运已经写下。',
      },
    ];

    mockCharacters.forEach((ch, idx) => {
      const id = `mock-char-${idx}`;
      this.characters.set(id, { ...ch, id });
    });
  }

  private validateAssociations(): void {
    // 可以在这里清理无效关联，当前已在 StoryboardManager 删除时处理
  }

  getCharacters(): Character[] {
    return Array.from(this.characters.values());
  }

  getCharacter(id: string): Character | null {
    return this.characters.get(id) ?? null;
  }

  getCharacterName(id: string): string {
    return this.characters.get(id)?.name ?? '未知角色';
  }

  getCharacterColor(id: string): string {
    return this.characters.get(id)?.avatarColor ?? '#CCCCCC';
  }

  requestCharacter(characterId: string): Character | null {
    return this.characters.get(characterId) ?? null;
  }

  addCharacter(name: string): Character {
    const id = uuidv4();
    const usedColors = this.getCharacters().map((c) => c.avatarColor);
    const availableColor = DEFAULT_COLORS.find((c) => !usedColors.includes(c)) ?? DEFAULT_COLORS[0];
    const character: Character = {
      id,
      name,
      avatarColor: availableColor,
      personalityTags: [],
      catchphrase: '',
    };
    this.characters.set(id, character);
    this.emitChanged();
    return character;
  }

  updateCharacter(id: string, updates: Partial<Omit<Character, 'id'>>): void {
    const character = this.characters.get(id);
    if (character) {
      this.characters.set(id, { ...character, ...updates });
      this.emitChanged();
    }
  }

  removeCharacter(id: string): void {
    if (this.characters.has(id)) {
      this.characters.delete(id);
      storyboardManager.removeCharacterFromAllPanels(id);
      this.emitChanged();
    }
  }

  addPersonalityTag(characterId: string, tag: string): void {
    const character = this.characters.get(characterId);
    if (character && character.personalityTags.length < 5 && !character.personalityTags.includes(tag)) {
      character.personalityTags.push(tag);
      this.emitChanged();
    }
  }

  removePersonalityTag(characterId: string, tagIndex: number): void {
    const character = this.characters.get(characterId);
    if (character && tagIndex >= 0 && tagIndex < character.personalityTags.length) {
      character.personalityTags.splice(tagIndex, 1);
      this.emitChanged();
    }
  }
}

export const characterManager = new CharacterManager();
