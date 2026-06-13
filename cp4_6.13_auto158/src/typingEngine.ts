export type Difficulty = 'easy' | 'normal' | 'hard';

export interface RoundResult {
  wpm: number;
  accuracy: number;
  score: number;
  timeUsed: number;
  sentence: string;
  correctChars: number;
  totalChars: number;
}

export interface KeyPressRecord {
  key: string;
  timestamp: number;
  correct: boolean;
}

type EventCallback = (...args: any[]) => void;

const WORD_LIBRARY = {
  common: [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
    'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
    'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
    'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
    'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
    'is', 'was', 'are', 'been', 'has', 'had', 'did', 'does', 'doing', 'done',
    'went', 'going', 'came', 'made', 'find', 'found', 'tell', 'told', 'ask', 'asked',
    'seem', 'felt', 'leave', 'left', 'call', 'called', 'keep', 'kept', 'let', 'begin',
    'began', 'show', 'showed', 'help', 'helped', 'play', 'played', 'move', 'moved', 'live',
    'lived', 'believe', 'bring', 'brought', 'happen', 'happened', 'write', 'wrote', 'sit', 'sat',
    'stand', 'stood', 'lose', 'lost', 'pay', 'paid', 'meet', 'met', 'include', 'included'
  ],
  medium: [
    'ability', 'accept', 'according', 'account', 'achieve', 'across', 'action', 'activity', 'actually', 'address',
    'admit', 'advance', 'advice', 'affect', 'against', 'agency', 'agree', 'agreement', 'ahead', 'allow',
    'almost', 'alone', 'along', 'already', 'although', 'always', 'among', 'amount', 'analysis', 'animal',
    'another', 'answer', 'anyone', 'anything', 'appear', 'apply', 'approach', 'area', 'argue', 'around',
    'arrive', 'article', 'artist', 'assume', 'attack', 'attention', 'audience', 'author', 'authority', 'available',
    'avoid', 'beautiful', 'because', 'become', 'before', 'begin', 'behavior', 'behind', 'believe', 'benefit',
    'better', 'between', 'beyond', 'billion', 'black', 'blood', 'board', 'body', 'book', 'born',
    'break', 'bring', 'brother', 'budget', 'build', 'building', 'business', 'camera', 'campaign', 'cancer',
    'candidate', 'capital', 'career', 'carry', 'catch', 'cause', 'center', 'central', 'century', 'certain',
    'challenge', 'chance', 'change', 'character', 'charge', 'check', 'child', 'choice', 'choose', 'church',
    'citizen', 'city', 'civil', 'claim', 'class', 'clear', 'clearly', 'close', 'coach', 'cold',
    'collection', 'college', 'color', 'combination', 'come', 'comfort', 'command', 'comment', 'commercial', 'common',
    'community', 'company', 'compare', 'computer', 'concern', 'condition', 'conference', 'congress', 'consider', 'consumer',
    'contain', 'continue', 'control', 'cost', 'could', 'country', 'couple', 'course', 'court', 'cover',
    'create', 'crime', 'cultural', 'culture', 'current', 'customer', 'dark', 'data', 'daughter', 'dead',
    'deal', 'death', 'debate', 'decade', 'decide', 'decision', 'deep', 'defense', 'degree', 'democrat',
    'department', 'depend', 'describe', 'design', 'despite', 'detail', 'determine', 'develop', 'development', 'difference',
    'different', 'difficult', 'dinner', 'direction', 'director', 'discover', 'discuss', 'discussion', 'disease', 'doctor',
    'door', 'down', 'dream', 'drive', 'drop', 'drug', 'during', 'each', 'early', 'east',
    'easy', 'economic', 'economy', 'edge', 'education', 'effect', 'effort', 'eight', 'either', 'election',
    'else', 'energy', 'enjoy', 'enough', 'enter', 'entire', 'environment', 'especially', 'establish', 'even',
    'evening', 'event', 'ever', 'every', 'everybody', 'everyone', 'everything', 'evidence', 'exactly', 'example',
    'executive', 'exist', 'expect', 'experience', 'expert', 'explain', 'express', 'extra', 'face', 'fact',
    'factor', 'fail', 'fair', 'fall', 'family', 'famous', 'far', 'fast', 'father', 'fear',
    'federal', 'feel', 'field', 'fight', 'figure', 'fill', 'film', 'final', 'finally', 'financial',
    'finger', 'finish', 'fire', 'firm', 'first', 'fish', 'five', 'floor', 'follow', 'food',
    'foot', 'force', 'foreign', 'forget', 'form', 'former', 'forward', 'four', 'free', 'friend',
    'from', 'front', 'full', 'fund', 'future', 'garden', 'generation', 'girl', 'glass', 'goal',
    'good', 'government', 'great', 'green', 'ground', 'group', 'grow', 'growth', 'guess', 'hair',
    'half', 'hand', 'hang', 'happen', 'happy', 'hard', 'have', 'head', 'health', 'hear',
    'heart', 'heat', 'heavy', 'herself', 'high', 'himself', 'history', 'hold', 'home', 'hope',
    'hospital', 'hotel', 'hour', 'house', 'however', 'huge', 'human', 'hundred', 'husband', 'idea',
    'image', 'imagine', 'impact', 'important', 'improve', 'include', 'including', 'increase', 'indeed', 'indicate',
    'individual', 'industry', 'information', 'inside', 'instead', 'institution', 'interest', 'interesting', 'international', 'interview',
    'into', 'investment', 'involve', 'issue', 'item', 'itself', 'job', 'join', 'just', 'keep',
    'kind', 'kitchen', 'knowledge', 'land', 'language', 'large', 'last', 'late', 'later', 'laugh',
    'lawyer', 'learn', 'least', 'leave', 'left', 'legal', 'less', 'level', 'life', 'light',
    'like', 'likely', 'line', 'listen', 'little', 'live', 'local', 'long', 'look', 'machine',
    'magazine', 'main', 'maintain', 'major', 'majority', 'make', 'manage', 'management', 'manager', 'many',
    'market', 'marriage', 'material', 'matter', 'maybe', 'mean', 'measure', 'media', 'medical', 'member',
    'memory', 'mention', 'message', 'method', 'middle', 'might', 'military', 'million', 'mind', 'minute',
    'miss', 'mission', 'model', 'modern', 'moment', 'money', 'month', 'more', 'morning', 'mother',
    'mouth', 'move', 'movement', 'movie', 'music', 'myself', 'name', 'nation', 'national', 'natural',
    'nature', 'near', 'nearly', 'necessary', 'need', 'network', 'never', 'news', 'newspaper', 'next',
    'nice', 'night', 'none', 'north', 'note', 'nothing', 'notice', 'number', 'occur', 'offer',
    'office', 'officer', 'official', 'often', 'operation', 'opportunity', 'option', 'order', 'organization', 'others',
    'outside', 'owner', 'page', 'pain', 'painting', 'paper', 'parent', 'part', 'particular', 'particularly',
    'partner', 'party', 'pass', 'past', 'patient', 'pattern', 'peace', 'people', 'percent', 'performance',
    'perhaps', 'period', 'person', 'personal', 'phone', 'physical', 'pick', 'picture', 'piece', 'place',
    'plan', 'plant', 'play', 'player', 'please', 'plus', 'point', 'police', 'policy', 'political',
    'poor', 'popular', 'population', 'position', 'positive', 'possible', 'power', 'practice', 'prepare', 'present',
    'president', 'pressure', 'pretty', 'prevent', 'price', 'private', 'probably', 'problem', 'process', 'produce',
    'product', 'production', 'professional', 'professor', 'program', 'project', 'property', 'protect', 'prove', 'provide',
    'public', 'pull', 'purpose', 'push', 'quality', 'question', 'quick', 'quickly', 'quiet', 'quite',
    'race', 'radio', 'raise', 'range', 'rate', 'rather', 'reach', 'read', 'ready', 'real',
    'reality', 'realize', 'really', 'reason', 'receive', 'recent', 'recently', 'recognize', 'record', 'reduce',
    'reflect', 'region', 'relate', 'relationship', 'religious', 'remain', 'remember', 'remove', 'repeat', 'report',
    'represent', 'republican', 'require', 'research', 'resource', 'respond', 'response', 'rest', 'result', 'return',
    'reveal', 'right', 'rise', 'risk', 'river', 'road', 'rock', 'role', 'room', 'rule',
    'safe', 'same', 'save', 'scene', 'school', 'science', 'score', 'sense', 'series', 'serious',
    'serve', 'service', 'seven', 'several', 'shake', 'share', 'shoot', 'short', 'shot', 'shoulder',
    'show', 'side', 'sign', 'significant', 'similar', 'simple', 'simply', 'since', 'sing', 'single',
    'sister', 'site', 'situation', 'size', 'skill', 'skin', 'small', 'smile', 'social', 'society',
    'soldier', 'somebody', 'someone', 'something', 'sometimes', 'song', 'soon', 'sort', 'sound', 'source',
    'south', 'southern', 'space', 'speak', 'special', 'specific', 'speech', 'spend', 'sport', 'spring',
    'staff', 'stage', 'stand', 'standard', 'star', 'start', 'state', 'statement', 'station', 'stay',
    'step', 'still', 'stock', 'stop', 'store', 'story', 'strategy', 'street', 'strong', 'structure',
    'student', 'study', 'stuff', 'style', 'subject', 'success', 'successful', 'suddenly', 'suffer', 'suggest',
    'summer', 'support', 'suppose', 'surface', 'system', 'table', 'talk', 'tough', 'toward', 'town',
    'trade', 'tradition', 'travel', 'treat', 'treatment', 'tree', 'trial', 'trip', 'trouble', 'true',
    'truth', 'turn', 'tv', 'under', 'understand', 'unit', 'until', 'upon', 'usually', 'value',
    'various', 'victim', 'video', 'view', 'visit', 'voice', 'wait', 'walk', 'wall', 'watch',
    'water', 'weapon', 'wear', 'week', 'weight', 'welcome', 'western', 'whether', 'which', 'while',
    'white', 'whole', 'wife', 'window', 'wish', 'within', 'without', 'woman', 'women', 'world',
    'worry', 'would', 'write', 'writer', 'wrong', 'yard', 'yeah', 'year', 'young', 'yourself'
  ],
  complex: [
    'accommodate', 'acknowledge', 'acquisition', 'administrative', 'advantageous', 'aesthetic', 'aggressive', 'algorithm', 'allegation', 'ambiguous',
    'ambitious', 'analogous', 'anonymous', 'anticipate', 'apparent', 'arbitrary', 'architectural', 'assassination', 'authentic', 'auxiliary',
    'bazaar', 'bizarre', 'bureaucracy', 'bureaucratic', 'calisthenics', 'caribbean', 'catastrophe', 'categorize', 'cemetery', 'championship',
    'chancellor', 'chaos', 'characteristic', 'chauffeur', 'chronological', 'circumstance', 'clarification', 'coincidence', 'collaborate', 'colonel',
    'commission', 'commitment', 'comparative', 'competitive', 'comprehensive', 'concede', 'conceive', 'concentration', 'conceptual', 'concession',
    'concomitant', 'condemnation', 'confidential', 'conformation', 'congratulations', 'consecutive', 'consensus', 'consequence', 'conservative', 'considerable',
    'consolidate', 'constitutional', 'contemporary', 'contradiction', 'controversial', 'controversy', 'convenience', 'cooperate', 'correspondence', 'counterfeit',
    'courteous', 'curriculum', 'deception', 'decisive', 'dedication', 'defendant', 'deficiency', 'definitely', 'demonstrate', 'demonstration',
    'denomination', 'dependent', 'depreciation', 'desperate', 'destruction', 'determination', 'developmental', 'differentiate', 'dilemma', 'diplomatic',
    'disadvantage', 'disappearance', 'disastrous', 'discrimination', 'disguise', 'dispensable', 'dissatisfaction', 'distinguish', 'diversification', 'entrepreneur',
    'environmentally', 'equilibrium', 'equivalent', 'erroneous', 'establishment', 'exaggerate', 'exacerbate', 'excellence', 'exceptional', 'exclusively',
    'exemplify', 'exhaustion', 'exhilarate', 'exorbitant', 'expedition', 'experimental', 'explanation', 'extraordinary', 'extravagant', 'facilitate',
    'fascinating', 'feasible', 'fluctuation', 'foreseeable', 'formidable', 'fulfillment', 'fundamental', 'generalization', 'glamorous', 'governmental',
    'grammatical', 'gratitude', 'guarantee', 'harassment', 'harmonious', 'hemorrhage', 'hierarchy', 'hitchhiker', 'horrific', 'hospitality',
    'hypothetical', 'illustration', 'imagination', 'immediately', 'implement', 'implementation', 'implication', 'impossibility', 'inauguration', 'incidentally',
    'incompetence', 'independent', 'indispensable', 'inefficient', 'influential', 'initialization', 'innovative', 'insatiable', 'inseparable', 'installation',
    'instantaneous', 'institutional', 'instrumentation', 'insubstantial', 'integration', 'intellectual', 'intelligible', 'intercontinental', 'interdependent', 'interdisciplinary',
    'interpretation', 'intimidating', 'intravenously', 'investigation', 'invulnerable', 'irrelevant', 'jeopardize', 'kaleidoscope', 'kindergarten', 'laboratory',
    'legitimate', 'leprechaun', 'liaison', 'libertarian', 'lieutenant', 'magnificent', 'maintenance', 'malpractice', 'managerial', 'manifestation',
    'manuscript', 'marginalized', 'materialistic', 'mathematical', 'mediterranean', 'melancholy', 'metamorphosis', 'metropolitan', 'microscopic', 'miscellaneous',
    'mischievous', 'misconception', 'misrepresentation', 'momentous', 'multilingual', 'municipality', 'mysterious', 'nefarious', 'nevertheless', 'nineteenth',
    'nonchalant', 'nondescript', 'nonetheless', 'notorious', 'notwithstanding', 'nourishment', 'nuisance', 'obfuscate', 'objectively', 'observation',
    'obsolescence', 'occasionally', 'occupation', 'omission', 'omnipotent', 'once', 'opportunistic', 'opposition', 'orchestration', 'organization',
    'ostentatious', 'outrageous', 'overwhelming', 'pandemonium', 'paradigm', 'paragraph', 'parallel', 'parliamentary', 'particular', 'passionate',
    'perceive', 'permanent', 'permissible', 'perpendicular', 'persecution', 'perseverance', 'phenomenon', 'philosophical', 'picturesque', 'plagiarism',
    'plethora', 'pneumonia', 'politician', 'polysyllabic', 'possession', 'posthumous', 'practically', 'precaution', 'precedent', 'predominant',
    'preference', 'preliminary', 'premature', 'preoccupation', 'preposterous', 'prerequisite', 'presidential', 'prestigious', 'presumption', 'prevalent',
    'privilege', 'procrastinate', 'professional', 'proficient', 'prominent', 'pronunciation', 'propaganda', 'proprietor', 'prosecution', 'prosperity',
    'protein', 'protester', 'provincial', 'psychological', 'publicly', 'pumpkin', 'questionnaire', 'quintessential', 'quixotic', 'quotient',
    'randomize', 'reasonable', 'reassurance', 'recommendation', 'reconciliation', 'reconstruction', 'recruitment', 'reduction', 'redundancy', 'reference',
    'refinement', 'regardless', 'reign', 'reimbursement', 'reinforcement', 'rejection', 'relentless', 'reminisce', 'remittance', 'renovation',
    'representative', 'reputation', 'requirement', 'reservoir', 'resemblance', 'resistance', 'resolution', 'resonance', 'restaurant', 'resuscitation',
    'retaliation', 'retrieve', 'revelation', 'reverence', 'rhetorical', 'rhythm', 'ridiculous', 'sacrilegious', 'sanctuary', 'sarcastic',
    'satellite', 'scenario', 'schedule', 'scholastic', 'scintillate', 'sculpture', 'seizure', 'segregation', 'seismologist', 'sensation',
    'sentimental', 'separation', 'sergeant', 'simultaneous', 'sophisticated', 'sovereignty', 'spectacular', 'spontaneous', 'statistics', 'stereotype',
    'stimulation', 'stochastic', 'strategic', 'stubbornness', 'subcutaneous', 'subsequent', 'substantial', 'substantiate', 'subterranean', 'succeed',
    'sufficient', 'suggestion', 'suitable', 'superintendent', 'supernatural', 'superstition', 'supplementary', 'suppression', 'surveillance', 'susceptible',
    'sustainable', 'symphony', 'synonymous', 'technological', 'telecommunications', 'temperature', 'temporary', 'tendency', 'terminology', 'terrifying',
    'theoretical', 'therefore', 'thorough', 'threshold', 'transcend', 'transferable', 'transformation', 'transient', 'transition', 'transparent',
    'transportation', 'treacherous', 'tremendous', 'trilogy', 'turbulence', 'twentieth', 'tyrannical', 'ubiquitous', 'unanimous', 'uncertainty',
    'uncomfortable', 'unconscionable', 'uncontrollable', 'unconventional', 'undoubtedly', 'unequivocal', 'unexpected', 'unfortunately', 'unhappiness', 'unification',
    'unprecedented', 'unquestionable', 'unreasonable', 'unrelenting', 'unsatisfactory', 'unsightly', 'unstoppable', 'unsuccessful', 'untimely', 'unusual',
    'upbringing', 'utilization', 'vacillate', 'vacuum', 'vague', 'vanquish', 'variable', 'vegetarian', 'vehemently', 'vengeance',
    'ventilation', 'veterinarian', 'vicarious', 'vigilance', 'vindicate', 'violinist', 'vocabulary', 'voluminous', 'vulnerability', 'wavelength',
    'weakness', 'weathering', 'whimsical', 'wholly', 'withdrawal', 'worthwhile', 'xylophone', 'yesterday', 'zeitgeist', 'zoology'
  ]
};

const ROUND_DURATION = 5000;

export class TypingEngine {
  private events: Record<string, EventCallback[]> = {};

  private difficulty: Difficulty = 'normal';
  private currentSentence: string = '';
  private userInput: string = '';
  private currentIndex: number = 0;

  private timerStart: number = 0;
  private timerEnd: number = 0;
  private roundActive: boolean = false;

  private correctChars: number = 0;
  private totalInputChars: number = 0;

  private keyCountMap: Record<string, number> = {};
  private recentPresses: { key: string; timestamp: number }[] = [];

  private history: RoundResult[] = [];

  private shakeIndices: Record<number, number> = {};
  private correctAnimationIndices: Record<number, number> = {};

  private timerInterval: number | null = null;

  constructor() {
    this.loadHistory();
  }

  on(event: 'roundEnd', cb: (result: RoundResult) => void): void;
  on(event: 'inputChange', cb: () => void): void;
  on(event: 'keyPress', cb: (record: KeyPressRecord) => void): void;
  on(event: 'timerTick', cb: () => void): void;
  on(event: string, cb: EventCallback): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(cb);
  }

  private emit(event: string, ...args: any[]): void {
    const callbacks = this.events[event];
    if (callbacks) {
      callbacks.forEach(cb => cb(...args));
    }
  }

  setDifficulty(d: Difficulty): void {
    this.difficulty = d;
  }

  getDifficulty(): Difficulty {
    return this.difficulty;
  }

  startNewRound(): string {
    this.stopTimer();
    this.currentSentence = this.generateSentence();
    this.userInput = '';
    this.currentIndex = 0;
    this.correctChars = 0;
    this.totalInputChars = 0;
    this.roundActive = false;
    this.shakeIndices = {};
    this.correctAnimationIndices = {};
    return this.currentSentence;
  }

  private generateSentence(): string {
    let wordCount: number;
    const words: string[] = [];

    switch (this.difficulty) {
      case 'easy':
        wordCount = 6 + Math.floor(Math.random() * 3);
        for (let i = 0; i < wordCount; i++) {
          const idx = Math.floor(Math.random() * WORD_LIBRARY.common.length);
          let w = WORD_LIBRARY.common[idx];
          if (i === 0) w = w.charAt(0).toUpperCase() + w.slice(1);
          words.push(w);
        }
        break;
      case 'normal':
        wordCount = 10 + Math.floor(Math.random() * 3);
        const mediumCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < Math.min(mediumCount, wordCount); i++) {
          const idx = Math.floor(Math.random() * WORD_LIBRARY.medium.length);
          words.push(WORD_LIBRARY.medium[idx]);
        }
        while (words.length < wordCount) {
          const idx = Math.floor(Math.random() * (WORD_LIBRARY.common.length + WORD_LIBRARY.medium.length));
          const pool = idx < WORD_LIBRARY.common.length ? WORD_LIBRARY.common : WORD_LIBRARY.medium;
          const wIdx = idx < WORD_LIBRARY.common.length ? idx : idx - WORD_LIBRARY.common.length;
          words.push(pool[wIdx]);
        }
        break;
      case 'hard':
      default:
        wordCount = 14 + Math.floor(Math.random() * 3);
        const complexCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < Math.min(complexCount, wordCount); i++) {
          const idx = Math.floor(Math.random() * WORD_LIBRARY.complex.length);
          words.push(WORD_LIBRARY.complex[idx]);
        }
        const hardMediumCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < hardMediumCount && words.length < wordCount; i++) {
          const idx = Math.floor(Math.random() * WORD_LIBRARY.medium.length);
          words.push(WORD_LIBRARY.medium[idx]);
        }
        while (words.length < wordCount) {
          const r = Math.random();
          let pool: string[];
          if (r < 0.3) pool = WORD_LIBRARY.complex;
          else if (r < 0.6) pool = WORD_LIBRARY.medium;
          else pool = WORD_LIBRARY.common;
          const idx = Math.floor(Math.random() * pool.length);
          words.push(pool[idx]);
        }
        break;
    }

    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }

    if (words.length > 0) {
      words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    }

    return words.join(' ') + '.';
  }

  startTimer(): void {
    if (this.roundActive) return;
    this.timerStart = performance.now();
    this.timerEnd = this.timerStart + ROUND_DURATION;
    this.roundActive = true;

    this.timerInterval = window.setInterval(() => {
      this.emit('timerTick');
      if (performance.now() >= this.timerEnd) {
        this.endRound();
      }
    }, 50);
  }

  stopTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.roundActive = false;
  }

  handleInput(char: string): boolean {
    if (!this.roundActive && this.currentIndex === 0) {
      this.startTimer();
    }

    const expectedChar = this.currentSentence[this.currentIndex];
    const isCorrect = char === expectedChar;
    const lowerKey = char.toLowerCase();

    this.totalInputChars++;
    this.keyCountMap[lowerKey] = (this.keyCountMap[lowerKey] || 0) + 1;
    this.recentPresses.push({ key: lowerKey, timestamp: performance.now() });
    if (this.recentPresses.length > 500) {
      this.recentPresses.shift();
    }

    this.emit('keyPress', {
      key: lowerKey,
      timestamp: performance.now(),
      correct: isCorrect
    } as KeyPressRecord);

    if (isCorrect) {
      this.userInput += char;
      this.correctChars++;
      this.correctAnimationIndices[this.currentIndex] = performance.now();
      this.currentIndex++;
    } else {
      this.shakeIndices[this.currentIndex] = performance.now();
    }

    this.emit('inputChange');

    if (this.currentIndex >= this.currentSentence.length) {
      // 等待用户回车确认完成，这里不直接结束
    }

    return isCorrect;
  }

  handleBackspace(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.userInput = this.userInput.slice(0, -1);
      delete this.correctAnimationIndices[this.currentIndex];
      this.emit('inputChange');
    }
  }

  handleEnter(): boolean {
    if (this.currentIndex >= this.currentSentence.length) {
      this.endRound();
      return true;
    }
    return false;
  }

  private endRound(): void {
    if (!this.roundActive && this.currentIndex === 0) return;

    this.stopTimer();
    const now = performance.now();
    const timeUsed = this.timerStart > 0 ? Math.min(ROUND_DURATION, now - this.timerStart) : 0;

    const wpm = this.calculateWPM(timeUsed);
    const accuracy = this.calculateAccuracy();
    const score = this.calculateScore(wpm, accuracy);

    const result: RoundResult = {
      wpm,
      accuracy,
      score,
      timeUsed,
      sentence: this.currentSentence,
      correctChars: this.correctChars,
      totalChars: this.totalInputChars
    };

    this.history.push(result);
    if (this.history.length > 50) {
      this.history = this.history.slice(-50);
    }
    this.saveHistory();

    this.emit('roundEnd', result);
  }

  private calculateWPM(timeUsedMs: number): number {
    if (timeUsedMs <= 0) return 0;
    const minutes = timeUsedMs / 60000;
    const words = this.correctChars / 5;
    return Math.round(words / minutes);
  }

  private calculateAccuracy(): number {
    if (this.totalInputChars === 0) return 100;
    return Math.round((this.correctChars / this.totalInputChars) * 100);
  }

  private calculateScore(wpm: number, accuracy: number): number {
    const normalizedWpm = Math.min(wpm, 120) / 120 * 100;
    return Math.min(100, Math.round(normalizedWpm * 0.6 + accuracy * 0.4));
  }

  getCurrentSentence(): string {
    return this.currentSentence;
  }

  getUserInput(): string {
    return this.userInput;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getWPM(): number {
    const now = performance.now();
    const timeUsed = this.timerStart > 0 ? Math.min(ROUND_DURATION, now - this.timerStart) : 0;
    return this.calculateWPM(timeUsed);
  }

  getAccuracy(): number {
    return this.calculateAccuracy();
  }

  getScore(): number {
    return this.calculateScore(this.getWPM(), this.getAccuracy());
  }

  getTimeRemaining(): number {
    if (!this.roundActive && this.currentIndex === 0) return ROUND_DURATION;
    const now = performance.now();
    return Math.max(0, this.timerEnd - now);
  }

  getTotalDuration(): number {
    return ROUND_DURATION;
  }

  getKeyCountMap(): Record<string, number> {
    return { ...this.keyCountMap };
  }

  getRecentKeyPresses(): { key: string; timestamp: number }[] {
    return [...this.recentPresses];
  }

  getRemainingWords(): number {
    const remaining = this.currentSentence.slice(this.currentIndex);
    if (remaining.trim().length === 0) return 0;
    return remaining.trim().split(/\s+/).length;
  }

  getHistory(): RoundResult[] {
    return [...this.history];
  }

  isRoundActive(): boolean {
    return this.roundActive;
  }

  getShakeIndices(): Record<number, number> {
    return { ...this.shakeIndices };
  }

  getCorrectAnimationIndices(): Record<number, number> {
    return { ...this.correctAnimationIndices };
  }

  resetKeyCounts(): void {
    this.keyCountMap = {};
    this.recentPresses = [];
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem('typing_trainer_history');
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch (e) {
      this.history = [];
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem('typing_trainer_history', JSON.stringify(this.history));
    } catch (e) {
      // ignore
    }
  }
}
