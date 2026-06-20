import wordBank from './data/wordBank.json' assert { type: 'json' };
import type { WordDetail, Example, WordBankEntry } from './types';

const inflectionRules: Record<string, (word: string) => string> = {
  pastTense: (word) => {
    if (word.endsWith('e')) return word + 'd';
    if (word.endsWith('y')) return word.slice(0, -1) + 'ied';
    return word + 'ed';
  },
  presentParticiple: (word) => {
    if (word.endsWith('e')) return word.slice(0, -1) + 'ing';
    return word + 'ing';
  },
  pastParticiple: (word) => {
    if (word.endsWith('e')) return word + 'd';
    if (word.endsWith('y')) return word.slice(0, -1) + 'ied';
    return word + 'ed';
  },
  plural: (word) => {
    if (word.endsWith('s') || word.endsWith('x') || word.endsWith('ch') || word.endsWith('sh')) return word + 'es';
    if (word.endsWith('y')) return word.slice(0, -1) + 'ies';
    return word + 's';
  },
  comparative: (word) => {
    if (word.endsWith('e')) return word + 'r';
    if (word.endsWith('y')) return word.slice(0, -1) + 'ier';
    return word + 'er';
  },
  superlative: (word) => {
    if (word.endsWith('e')) return word + 'st';
    if (word.endsWith('y')) return word.slice(0, -1) + 'iest';
    return word + 'est';
  }
};

const irregularVerbs: Record<string, Record<string, string>> = {
  learn: { pastTense: 'learned/learnt', pastParticiple: 'learned/learnt' },
  be: { pastTense: 'was/were', pastParticiple: 'been' },
  have: { pastTense: 'had', pastParticiple: 'had' },
  do: { pastTense: 'did', pastParticiple: 'done' },
  go: { pastTense: 'went', pastParticiple: 'gone' },
  see: { pastTense: 'saw', pastParticiple: 'seen' },
  say: { pastTense: 'said', pastParticiple: 'said' },
  make: { pastTense: 'made', pastParticiple: 'made' },
  take: { pastTense: 'took', pastParticiple: 'taken' },
  get: { pastTense: 'got', pastParticiple: 'got/gotten' },
};

const irregularPlurals: Record<string, string> = {
  child: 'children',
  person: 'people',
  man: 'men',
  woman: 'women',
  foot: 'feet',
  tooth: 'teeth',
  mouse: 'mice',
  goose: 'geese',
  sheep: 'sheep',
  fish: 'fish',
};

const irregularAdjectives: Record<string, Record<string, string>> = {
  good: { comparative: 'better', superlative: 'best' },
  bad: { comparative: 'worse', superlative: 'worst' },
  far: { comparative: 'farther/further', superlative: 'farthest/furthest' },
  little: { comparative: 'less', superlative: 'least' },
  much: { comparative: 'more', superlative: 'most' },
  many: { comparative: 'more', superlative: 'most' },
};

function getLemma(word: string): string {
  const lowerWord = word.toLowerCase();
  
  const entry = wordBank[lowerWord as keyof typeof wordBank];
  if (entry) {
    return entry.word;
  }
  
  if (lowerWord.endsWith('ies')) {
    const singular = lowerWord.slice(0, -3) + 'y';
    if (wordBank[singular as keyof typeof wordBank]) return singular;
  }
  if (lowerWord.endsWith('es')) {
    const singular = lowerWord.slice(0, -2);
    if (wordBank[singular as keyof typeof wordBank]) return singular;
  }
  if (lowerWord.endsWith('s')) {
    const singular = lowerWord.slice(0, -1);
    if (wordBank[singular as keyof typeof wordBank]) return singular;
  }
  
  if (lowerWord.endsWith('ing')) {
    const base1 = lowerWord.slice(0, -3);
    if (wordBank[base1 as keyof typeof wordBank]) return base1;
    const base2 = lowerWord.slice(0, -3) + 'e';
    if (wordBank[base2 as keyof typeof wordBank]) return base2;
  }
  
  if (lowerWord.endsWith('ied')) {
    const base = lowerWord.slice(0, -3) + 'y';
    if (wordBank[base as keyof typeof wordBank]) return base;
  }
  if (lowerWord.endsWith('ed')) {
    const base1 = lowerWord.slice(0, -2);
    if (wordBank[base1 as keyof typeof wordBank]) return base1;
    const base2 = lowerWord.slice(0, -1);
    if (wordBank[base2 as keyof typeof wordBank]) return base2;
  }
  
  return lowerWord;
}

function getWordBankEntry(word: string): WordBankEntry | null {
  const lemma = getLemma(word);
  return wordBank[lemma as keyof typeof wordBank] as WordBankEntry || null;
}

function determinePartOfSpeech(word: string, context: string): string {
  const lowerWord = word.toLowerCase();
  const contextLower = context.toLowerCase();
  
  const verbIndicators = ['is ', 'are ', 'was ', 'were ', 'have ', 'has ', 'had ', 'will ', 'would ', 'can ', 'could ', 'should ', 'may ', 'might ', 'must ', 'be ', 'being ', 'been '];
  const nounIndicators = ['a ', 'an ', 'the ', 'this ', 'that ', 'these ', 'those ', 'my ', 'your ', 'his ', 'her ', 'its ', 'our ', 'their ', 'some ', 'many ', 'few ', 'much '];
  const adjectiveIndicators = ['very ', 'so ', 'too ', 'more ', 'most ', 'less ', 'least '];
  
  const patterns = [
    { pos: 'adverb', test: () => lowerWord.endsWith('ly') },
    { pos: 'verb', test: () => verbIndicators.some(ind => contextLower.includes(ind + lowerWord)) },
    { pos: 'noun', test: () => nounIndicators.some(ind => contextLower.includes(ind + lowerWord)) },
    { pos: 'adjective', test: () => adjectiveIndicators.some(ind => contextLower.includes(ind + lowerWord)) },
  ];
  
  for (const pattern of patterns) {
    if (pattern.test()) {
      return pattern.pos;
    }
  }
  
  const entry = getWordBankEntry(word);
  if (entry) {
    const defs = Object.keys(entry.definitions);
    if (defs.length > 0) {
      return defs[0];
    }
  }
  
  return 'noun';
}

function analyzeContext(word: string, context: string, paragraph: string): { definition: string; partOfSpeech: string } {
  const lemma = getLemma(word);
  const entry = getWordBankEntry(word);
  const partOfSpeech = determinePartOfSpeech(word, context);
  
  if (entry && entry.definitions[partOfSpeech]) {
    return {
      definition: entry.definitions[partOfSpeech].meaning,
      partOfSpeech: entry.definitions[partOfSpeech].pos
    };
  }
  
  if (entry) {
    const firstDef = Object.values(entry.definitions)[0];
    if (firstDef) {
      return {
        definition: firstDef.meaning,
        partOfSpeech: firstDef.pos
      };
    }
  }
  
  return {
    definition: '根据上下文理解含义',
    partOfSpeech: '未知'
  };
}

function getInflections(word: string): Record<string, string> {
  const lemma = getLemma(word);
  const entry = getWordBankEntry(word);
  
  if (entry?.inflections) {
    return entry.inflections;
  }
  
  const inflections: Record<string, string> = {};
  
  if (irregularVerbs[lemma]) {
    Object.assign(inflections, irregularVerbs[lemma]);
  } else {
    inflections.pastTense = inflectionRules.pastTense(lemma);
    inflections.presentParticiple = inflectionRules.presentParticiple(lemma);
    inflections.pastParticiple = inflectionRules.pastParticiple(lemma);
  }
  
  if (irregularPlurals[lemma]) {
    inflections.plural = irregularPlurals[lemma];
  } else {
    inflections.plural = inflectionRules.plural(lemma);
  }
  
  if (irregularAdjectives[lemma]) {
    Object.assign(inflections, irregularAdjectives[lemma]);
  } else {
    inflections.comparative = inflectionRules.comparative(lemma);
    inflections.superlative = inflectionRules.superlative(lemma);
  }
  
  return inflections;
}

function getExamples(word: string): Example[] {
  const lemma = getLemma(word);
  const entry = getWordBankEntry(word);
  
  if (!entry) {
    return [
      {
        english: `This is a simple example with ${lemma}.`,
        chinese: `这是一个使用 ${lemma} 的简单例句。`,
        difficulty: 'easy' as const,
        highlightStart: 28,
        highlightEnd: 28 + lemma.length
      },
      {
        english: `In a more complex sentence structure, the word ${lemma} demonstrates its versatile usage across different contexts and grammatical patterns.`,
        chinese: `在更复杂的句子结构中，${lemma} 这个词展示了它在不同语境和语法模式中的灵活用法。`,
        difficulty: 'complex' as const,
        highlightStart: 52,
        highlightEnd: 52 + lemma.length
      }
    ];
  }
  
  const examples: Example[] = [];
  const allDefinitions = Object.values(entry.definitions);
  
  for (const def of allDefinitions) {
    for (const ex of def.examples) {
      const highlightStart = ex.english.toLowerCase().indexOf(lemma.toLowerCase());
      const highlightEnd = highlightStart >= 0 ? highlightStart + lemma.length : 0;
      
      examples.push({
        english: ex.english,
        chinese: ex.chinese,
        difficulty: ex.difficulty,
        highlightStart: highlightStart >= 0 ? highlightStart : 0,
        highlightEnd: highlightEnd > 0 ? highlightEnd : ex.english.length
      });
      
      if (examples.length >= 2) break;
    }
    if (examples.length >= 2) break;
  }
  
  return examples;
}

export function getWordDetail(word: string, context: string, paragraph: string): WordDetail | null {
  const startTime = performance.now();
  
  const lemma = getLemma(word);
  const entry = getWordBankEntry(word);
  
  if (!entry) {
    return null;
  }
  
  const { definition, partOfSpeech } = analyzeContext(word, context, paragraph);
  const inflections = getInflections(word);
  const examples = getExamples(word);
  
  const dictionaryDefinition = Object.values(entry.definitions)
    .map(d => `${d.pos} ${d.meaning}`)
    .join('; ');
  
  const result: WordDetail = {
    word: word.toLowerCase(),
    lemma,
    phonetic: entry.phonetic,
    partOfSpeech,
    contextDefinition: definition,
    dictionaryDefinition,
    inflections,
    examples
  };
  
  const endTime = performance.now();
  console.log(`[NLP] Word analysis for "${word}" completed in ${(endTime - startTime).toFixed(2)}ms`);
  
  return result;
}

export function getSentenceExamples(word: string): Example[] {
  return getExamples(word);
}
