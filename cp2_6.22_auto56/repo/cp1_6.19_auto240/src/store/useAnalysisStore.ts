import { create } from 'zustand';
import type {
  Character,
  Relation,
  RelationType,
  ConflictData,
  CharacterPair,
  MentionSnippet,
  SceneMention,
} from '../types';
import { useStoryStore } from './useStoryStore';

interface AnalysisState {
  characters: Character[];
  relations: Relation[];
  conflictData: ConflictData[];
  selectedCharacterId: string | null;
  addCharacter: (char: Omit<Character, 'id'>) => void;
  updateCharacter: (charId: string, data: Partial<Character>) => void;
  removeCharacter: (charId: string) => void;
  addRelation: (charId1: string, charId2: string, type: RelationType, description: string) => void;
  updateRelation: (relationId: string, data: Partial<Relation>) => void;
  removeRelation: (relationId: string) => void;
  setSelectedCharacter: (charId: string | null) => void;
  calculateConflictData: () => void;
}

const defaultCharacters: Character[] = [
  { id: 'char-1', name: '艾琳', avatarColor: '#E74C3C', tags: ['勇敢', '果断', '孤独'] },
  { id: 'char-2', name: '马克', avatarColor: '#3498DB', tags: ['忠诚', '谨慎', '幽默'] },
  { id: 'char-3', name: '苏菲', avatarColor: '#2ECC71', tags: ['聪明', '神秘', '敏感'] },
  { id: 'char-4', name: '凯恩', avatarColor: '#F39C12', tags: ['冷酷', '野心', '狡猾'] },
];

const defaultRelations: Relation[] = [
  {
    id: 'rel-1',
    characterId1: 'char-1',
    characterId2: 'char-2',
    type: 'ally',
    description: '多年战友，彼此信任',
  },
  {
    id: 'rel-2',
    characterId1: 'char-1',
    characterId2: 'char-3',
    type: 'lover',
    description: '隐藏的恋情，因身份而克制',
  },
  {
    id: 'rel-3',
    characterId1: 'char-1',
    characterId2: 'char-4',
    type: 'enemy',
    description: '理念对立，权力斗争',
  },
  {
    id: 'rel-4',
    characterId1: 'char-2',
    characterId2: 'char-3',
    type: 'stranger',
    description: '不太熟悉，保持距离',
  },
];

const generateId = () => Math.random().toString(36).slice(2, 10);

const getPairKey = (id1: string, id2: string): string => {
  return [id1, id2].sort().join('-');
};

const findMentionsInText = (text: string, characters: Character[]): string[] => {
  const mentioned: string[] = [];
  for (const char of characters) {
    if (text.includes(char.name)) {
      mentioned.push(char.id);
    }
  }
  return mentioned;
};

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  characters: defaultCharacters,
  relations: defaultRelations,
  conflictData: [],
  selectedCharacterId: null,

  addCharacter: (char) =>
    set((state) => ({
      characters: [...state.characters, { ...char, id: generateId() }],
    })),

  updateCharacter: (charId, data) =>
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === charId ? { ...c, ...data } : c
      ),
    })),

  removeCharacter: (charId) =>
    set((state) => ({
      characters: state.characters.filter((c) => c.id !== charId),
      relations: state.relations.filter(
        (r) => r.characterId1 !== charId && r.characterId2 !== charId
      ),
    })),

  addRelation: (charId1, charId2, type, description) => {
    const key = getPairKey(charId1, charId2);
    const existing = get().relations.find(
      (r) => getPairKey(r.characterId1, r.characterId2) === key
    );
    if (existing) return;
    set((state) => ({
      relations: [
        ...state.relations,
        { id: generateId(), characterId1: charId1, characterId2: charId2, type, description },
      ],
    }));
  },

  updateRelation: (relationId, data) =>
    set((state) => ({
      relations: state.relations.map((r) =>
        r.id === relationId ? { ...r, ...data } : r
      ),
    })),

  removeRelation: (relationId) =>
    set((state) => ({
      relations: state.relations.filter((r) => r.id !== relationId),
    })),

  setSelectedCharacter: (charId) => set({ selectedCharacterId: charId }),

  calculateConflictData: () => {
    const { characters } = get();
    const { project } = useStoryStore.getState();

    if (characters.length < 2) {
      set({ conflictData: [] });
      return;
    }

    const pairs: CharacterPair[] = [];
    for (let i = 0; i < characters.length; i++) {
      for (let j = i + 1; j < characters.length; j++) {
        pairs.push({
          char1: characters[i].id,
          char2: characters[j].id,
          key: getPairKey(characters[i].id, characters[j].id),
        });
      }
    }

    const conflictMap = new Map<string, ConflictData>();
    for (const pair of pairs) {
      const c1 = characters.find((c) => c.id === pair.char1)!;
      const c2 = characters.find((c) => c.id === pair.char2)!;
      conflictMap.set(pair.key, {
        pairKey: pair.key,
        char1Name: c1.name,
        char2Name: c2.name,
        sceneMentions: [],
        totalCount: 0,
      });
    }

    for (const act of project.acts) {
      for (const scene of act.scenes) {
        const sceneMentions = new Map<string, MentionSnippet[]>();

        for (const para of scene.paragraphs) {
          const mentioned = findMentionsInText(para.content, characters);
          if (mentioned.length >= 2) {
            for (let i = 0; i < mentioned.length; i++) {
              for (let j = i + 1; j < mentioned.length; j++) {
                const pairKey = getPairKey(mentioned[i], mentioned[j]);
                if (!sceneMentions.has(pairKey)) {
                  sceneMentions.set(pairKey, []);
                }
                sceneMentions.get(pairKey)!.push({
                  id: para.id,
                  content: para.content,
                  timestamp: para.createdAt,
                  scenePath: `${act.title} / ${scene.title}`,
                  isParagraph: true,
                });
              }
            }
          }
        }

        for (const anno of scene.annotations) {
          const mentioned = findMentionsInText(anno.content, characters);
          if (mentioned.length >= 2) {
            for (let i = 0; i < mentioned.length; i++) {
              for (let j = i + 1; j < mentioned.length; j++) {
                const pairKey = getPairKey(mentioned[i], mentioned[j]);
                if (!sceneMentions.has(pairKey)) {
                  sceneMentions.set(pairKey, []);
                }
                sceneMentions.get(pairKey)!.push({
                  id: anno.id,
                  content: anno.content,
                  timestamp: anno.createdAt,
                  scenePath: `${act.title} / ${scene.title}`,
                  isParagraph: false,
                });
              }
            }
          }
        }

        for (const [pairKey, snippets] of sceneMentions) {
          const conflict = conflictMap.get(pairKey);
          if (conflict) {
            const sceneMention: SceneMention = {
              sceneId: scene.id,
              sceneTitle: scene.title,
              actId: act.id,
              actTitle: act.title,
              count: snippets.length,
              snippets,
            };
            conflict.sceneMentions.push(sceneMention);
            conflict.totalCount += snippets.length;
          }
        }
      }
    }

    set({ conflictData: Array.from(conflictMap.values()) });
  },
}));
