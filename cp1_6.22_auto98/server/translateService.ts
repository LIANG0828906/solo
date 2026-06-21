type Language = 'zh' | 'en' | 'ja' | 'fr' | 'de';

const translationDictionary: Record<string, Record<string, string[]>> = {
  'en-zh': {
    'The quick brown fox jumps over the lazy dog.': ['敏捷的棕色狐狸跳过了懒狗。', '快速的棕色狐狸跃过懒狗。'],
    'Artificial intelligence is transforming the world.': ['人工智能正在改变世界。', 'AI正在革新全球。'],
    'Machine learning enables computers to learn from data.': ['机器学习使计算机能够从数据中学习。', 'ML让电脑从数据获取知识。'],
    'Natural language processing helps machines understand human language.': ['自然语言处理帮助机器理解人类语言。', 'NLP助力机器解读人类语言。'],
    'Translation memory improves efficiency and consistency.': ['翻译记忆提高效率和一致性。', 'TM增强效率与统一度。'],
    'The project deadline is approaching quickly.': ['项目截止日期即将到来。', '项目限期逼近。'],
    'Quality assurance ensures high standards.': ['质量保证确保高标准。', 'QA保障高品质。'],
    'Cloud computing offers scalable resources.': ['云计算提供可扩展资源。', '云端运算供应弹性资源。'],
    'Data privacy is a critical concern.': ['数据隐私是一个关键问题。', '资料隐私至关重要。'],
    'User experience design focuses on usability.': ['用户体验设计注重可用性。', 'UX设计聚焦易用性。'],
    'Hello world': ['你好世界', '哈喽世界'],
    'technology': ['技术', '科技'],
    'translation': ['翻译', '译文'],
    'memory': ['记忆', '内存'],
    'term': ['术语', '词项'],
  },
  'en-ja': {
    'The quick brown fox jumps over the lazy dog.': ['素早い茶色のキツネが怠け者の犬を飛び越える。'],
    'Artificial intelligence is transforming the world.': ['人工知能が世界を変革している。'],
    'Machine learning enables computers to learn from data.': ['機械学習によりコンピュータはデータから学習できる。'],
    'Natural language processing helps machines understand human language.': ['自然言語処理は機械が人間の言語を理解するのを助ける。'],
    'Translation memory improves efficiency and consistency.': ['翻訳メモリは効率と一貫性を向上させる。'],
    'The project deadline is approaching quickly.': ['プロジェクトの締め切りが迫っている。'],
    'Quality assurance ensures high standards.': ['品質保証は高い基準を保証する。'],
    'Cloud computing offers scalable resources.': ['クラウドコンピューティングはスケーラブルなリソースを提供する。'],
    'Data privacy is a critical concern.': ['データプライバシーは重要な懸念事項である。'],
    'User experience design focuses on usability.': ['ユーザーエクスペリエンスデザインは使いやすさに焦点を当てる。'],
    'Hello world': ['ハローワールド'],
    'technology': ['テクノロジー', '技術'],
    'translation': ['翻訳'],
    'memory': ['メモリ', '記憶'],
    'term': ['用語'],
  },
  'en-fr': {
    'The quick brown fox jumps over the lazy dog.': ['Le renard brun rapide saute par-dessus le chien paresseux.'],
    'Artificial intelligence is transforming the world.': ["L'intelligence artificielle transforme le monde."],
    'Machine learning enables computers to learn from data.': ['Le machine learning permet aux ordinateurs d\'apprendre à partir de données.'],
    'Natural language processing helps machines understand human language.': ['Le traitement automatique des langues aide les machines à comprendre le langage humain.'],
    'Translation memory improves efficiency and consistency.': ['La mémoire de traduction améliore l\'efficacité et la cohérence.'],
    'The project deadline is approaching quickly.': ['La date limite du projet approche rapidement.'],
    'Quality assurance ensures high standards.': ["L'assurance qualité garantit des normes élevées."],
    'Cloud computing offers scalable resources.': ['Le cloud computing offre des ressources évolutives.'],
    'Data privacy is a critical concern.': ['La confidentialité des données est une préoccupation critique.'],
    'User experience design focuses on usability.': ['La conception de l\'expérience utilisateur se concentre sur l\'ergonomie.'],
    'Hello world': ['Bonjour le monde'],
    'technology': ['technologie'],
    'translation': ['traduction'],
    'memory': ['mémoire'],
    'term': ['terme'],
  },
  'en-de': {
    'The quick brown fox jumps over the lazy dog.': ['Der schnelle braune Fuchs springt über den faulen Hund.'],
    'Artificial intelligence is transforming the world.': ['Künstliche Intelligenz verändert die Welt.'],
    'Machine learning enables computers to learn from data.': ['Maschinelles Lernen ermöglicht Computern, aus Daten zu lernen.'],
    'Natural language processing helps machines understand human language.': ['Verarbeitung natürlicher Sprache hilft Maschinen, menschliche Sprache zu verstehen.'],
    'Translation memory improves efficiency and consistency.': ['Translation Memory verbessert Effizienz und Konsistenz.'],
    'The project deadline is approaching quickly.': ['Die Projektfrist rückt schnell näher.'],
    'Quality assurance ensures high standards.': ['Qualitätssicherung gewährleistet hohe Standards.'],
    'Cloud computing offers scalable resources.': ['Cloud Computing bietet skalierbare Ressourcen.'],
    'Data privacy is a critical concern.': ['Datenschutz ist ein kritisches Anliegen.'],
    'User experience design focuses on usability.': ['User Experience Design konzentriert sich auf Benutzerfreundlichkeit.'],
    'Hello world': ['Hallo Welt'],
    'technology': ['Technologie'],
    'translation': ['Übersetzung'],
    'memory': ['Erinnerung', 'Speicher'],
    'term': ['Begriff', 'Terminus'],
  },
};

const fallbackTranslations: Record<string, string> = {
  zh: '（机器翻译建议）',
  ja: '（機械翻訳の提案）',
  fr: '(Suggestion de traduction automatique)',
  de: '(Maschinelle Übersetzungsvorschlag)',
};

export function translate(
  text: string,
  sourceLang: Language,
  targetLang: Language
): string {
  const key = `${sourceLang}-${targetLang}`;
  const dict = translationDictionary[key];

  if (dict && dict[text]) {
    const options = dict[text];
    return options[Math.floor(Math.random() * options.length)];
  }

  const fallback = fallbackTranslations[targetLang] || '(Machine translation suggestion)';
  return `[${text}] ${fallback}`;
}

export const sampleSentences: Record<Language, string[]> = {
  en: [
    'The quick brown fox jumps over the lazy dog.',
    'Artificial intelligence is transforming the world.',
    'Machine learning enables computers to learn from data.',
    'Natural language processing helps machines understand human language.',
    'Translation memory improves efficiency and consistency.',
    'The project deadline is approaching quickly.',
    'Quality assurance ensures high standards.',
    'Cloud computing offers scalable resources.',
    'Data privacy is a critical concern.',
    'User experience design focuses on usability.',
  ],
  zh: [
    '敏捷的棕色狐狸跳过了懒狗。',
    '人工智能正在改变世界。',
    '机器学习使计算机能够从数据中学习。',
    '自然语言处理帮助机器理解人类语言。',
    '翻译记忆提高效率和一致性。',
    '项目截止日期即将到来。',
    '质量保证确保高标准。',
    '云计算提供可扩展资源。',
    '数据隐私是一个关键问题。',
    '用户体验设计注重可用性。',
  ],
  ja: [
    '素早い茶色のキツネが怠け者の犬を飛び越える。',
    '人工知能が世界を変革している。',
    '機械学習によりコンピュータはデータから学習できる。',
    '自然言語処理は機械が人間の言語を理解するのを助ける。',
    '翻訳メモリは効率と一貫性を向上させる。',
    'プロジェクトの締め切りが迫っている。',
    '品質保証は高い基準を保証する。',
    'クラウドコンピューティングはスケーラブルなリソースを提供する。',
    'データプライバシーは重要な懸念事項である。',
    'ユーザーエクスペリエンスデザインは使いやすさに焦点を当てる。',
  ],
  fr: [
    'Le renard brun rapide saute par-dessus le chien paresseux.',
    "L'intelligence artificielle transforme le monde.",
    "Le machine learning permet aux ordinateurs d'apprendre à partir de données.",
    'Le traitement automatique des langues aide les machines à comprendre le langage humain.',
    "La mémoire de traduction améliore l'efficacité et la cohérence.",
    'La date limite du projet approche rapidement.',
    "L'assurance qualité garantit des normes élevées.",
    'Le cloud computing offre des ressources évolutives.',
    'La confidentialité des données est une préoccupation critique.',
    "La conception de l'expérience utilisateur se concentre sur l'ergonomie.",
  ],
  de: [
    'Der schnelle braune Fuchs springt über den faulen Hund.',
    'Künstliche Intelligenz verändert die Welt.',
    'Maschinelles Lernen ermöglicht Computern, aus Daten zu lernen.',
    'Verarbeitung natürlicher Sprache hilft Maschinen, menschliche Sprache zu verstehen.',
    'Translation Memory verbessert Effizienz und Konsistenz.',
    'Die Projektfrist rückt schnell näher.',
    'Qualitätssicherung gewährleistet hohe Standards.',
    'Cloud Computing bietet skalierbare Ressourcen.',
    'Datenschutz ist ein kritisches Anliegen.',
    'User Experience Design konzentriert sich auf Benutzerfreundlichkeit.',
  ],
};
