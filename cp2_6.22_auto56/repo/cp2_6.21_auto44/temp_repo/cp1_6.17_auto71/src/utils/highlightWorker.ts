export interface HighlightToken {
  start: number;
  end: number;
  line: number;
  column: number;
  type: 'keyword' | 'string' | 'comment' | 'number' | 'function' | 'operator' | 'punctuation' | 'default';
  color: string;
}

export interface HighlightRequest {
  code: string;
  language: string;
}

export interface HighlightResponse {
  tokens: HighlightToken[];
  lineCount: number;
}

const COLORS = {
  keyword: '#F92672',
  string: '#E6DB74',
  comment: '#75715E',
  number: '#AE81FF',
  function: '#A6E22E',
  operator: '#F92672',
  punctuation: '#D4D4D4',
  default: '#D4D4D4',
  tag: '#F92672',
  attr: '#A6E22E',
};

interface TokenRule {
  regex: RegExp;
  type: HighlightToken['type'];
  color: string;
}

const getRules = (language: string): TokenRule[] => {
  switch (language) {
    case 'javascript':
    case 'typescript':
      return [
        { regex: /\/\/[^\n]*/g, type: 'comment', color: COLORS.comment },
        { regex: /\/\*[\s\S]*?\*\//g, type: 'comment', color: COLORS.comment },
        { regex: /`(?:\\`|[\s\S])*?`/g, type: 'string', color: COLORS.string },
        { regex: /"(?:\\"|[^"\n])*"/g, type: 'string', color: COLORS.string },
        { regex: /'(?:\\'|[^'\n])*'/g, type: 'string', color: COLORS.string },
        { regex: /\b\d+(?:\.\d+)?\b/g, type: 'number', color: COLORS.number },
        { regex: /\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|import|export|from|default|async|await|try|catch|finally|throw|typeof|instanceof|in|of|void|null|undefined|true|false|this|super|static|public|private|protected|interface|type|enum|implements)\b/g, type: 'keyword', color: COLORS.keyword },
        { regex: /\b(?:console|Math|Object|Array|String|Number|Boolean|Date|JSON|Promise|Map|Set|Symbol|RegExp)\b/g, type: 'function', color: COLORS.function },
        { regex: /[a-zA-Z_$][\w$]*(?=\s*\()/g, type: 'function', color: COLORS.function },
        { regex: /[+\-*/%=<>!&|^~?:]+/g, type: 'operator', color: COLORS.operator },
        { regex: /[{}()\[\];,.]/g, type: 'punctuation', color: COLORS.punctuation },
      ];
    case 'python':
      return [
        { regex: /#[^\n]*/g, type: 'comment', color: COLORS.comment },
        { regex: /"""[\s\S]*?"""/g, type: 'string', color: COLORS.string },
        { regex: /'''[\s\S]*?'''/g, type: 'string', color: COLORS.string },
        { regex: /"(?:\\"|[^"\n])*"/g, type: 'string', color: COLORS.string },
        { regex: /'(?:\\'|[^'\n])*'/g, type: 'string', color: COLORS.string },
        { regex: /\b\d+(?:\.\d+)?\b/g, type: 'number', color: COLORS.number },
        { regex: /\b(?:def|class|return|if|elif|else|for|while|break|continue|pass|import|from|as|try|except|finally|raise|with|lambda|yield|global|nonlocal|in|is|not|and|or|None|True|False|self|async|await)\b/g, type: 'keyword', color: COLORS.keyword },
        { regex: /\b(?:print|len|range|str|int|float|list|dict|set|tuple|bool|type|isinstance|open|input|map|filter|zip|enumerate|sorted|reversed|min|max|sum|abs|round)\b/g, type: 'function', color: COLORS.function },
        { regex: /[+\-*/%=<>!&|^~@:]+/g, type: 'operator', color: COLORS.operator },
        { regex: /[{}()\[\];,.]/g, type: 'punctuation', color: COLORS.punctuation },
      ];
    case 'html':
      return [
        { regex: /<!--[\s\S]*?-->/g, type: 'comment', color: COLORS.comment },
        { regex: /"(?:\\"|[^"\n])*"/g, type: 'string', color: COLORS.string },
        { regex: /'(?:\\'|[^'\n])*'/g, type: 'string', color: COLORS.string },
        { regex: /<\/?[a-zA-Z][\w-]*/g, type: 'keyword', color: COLORS.tag },
        { regex: /\b[a-zA-Z_:][\w:-]*(?=\s*=)/g, type: 'function', color: COLORS.attr },
        { regex: /\b\d+(?:\.\d+)?\b/g, type: 'number', color: COLORS.number },
      ];
    case 'css':
      return [
        { regex: /\/\*[\s\S]*?\*\//g, type: 'comment', color: COLORS.comment },
        { regex: /"(?:\\"|[^"\n])*"/g, type: 'string', color: COLORS.string },
        { regex: /'(?:\\'|[^'\n])*'/g, type: 'string', color: COLORS.string },
        { regex: /#[0-9a-fA-F]{3,8}\b/g, type: 'number', color: COLORS.number },
        { regex: /\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|deg|rad)?\b/g, type: 'number', color: COLORS.number },
        { regex: /@[a-zA-Z-]+/g, type: 'keyword', color: COLORS.keyword },
        { regex: /[.#]?[a-zA-Z_-][\w-]*(?=\s*\{)/g, type: 'keyword', color: COLORS.keyword },
        { regex: /[a-zA-Z-]+(?=\s*:)/g, type: 'function', color: COLORS.function },
        { regex: /[{}():;,]/g, type: 'punctuation', color: COLORS.punctuation },
      ];
    case 'json':
      return [
        { regex: /"(?:\\"|[^"\n])*"(?=\s*:)/g, type: 'keyword', color: COLORS.keyword },
        { regex: /"(?:\\"|[^"\n])*"/g, type: 'string', color: COLORS.string },
        { regex: /\b(?:true|false|null)\b/g, type: 'keyword', color: COLORS.keyword },
        { regex: /\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g, type: 'number', color: COLORS.number },
        { regex: /[{}()\[\]:,]/g, type: 'punctuation', color: COLORS.punctuation },
      ];
    case 'markdown':
      return [
        { regex: /^#{1,6}[^\n]*/gm, type: 'keyword', color: COLORS.keyword },
        { regex: /`[^`\n]*`/g, type: 'string', color: COLORS.string },
        { regex: /```[\s\S]*?```/g, type: 'string', color: COLORS.string },
        { regex: /\*\*[^*\n]+\*\*/g, type: 'operator', color: COLORS.operator },
        { regex: /\*[^*\n]+\*/g, type: 'function', color: COLORS.function },
        { regex: /^\s*[-*+]\s+/gm, type: 'keyword', color: COLORS.keyword },
        { regex: /^\s*\d+\.\s+/gm, type: 'number', color: COLORS.number },
        { regex: /\[([^\]]+)\]\(([^)]+)\)/g, type: 'function', color: COLORS.function },
      ];
    default:
      return [];
  }
};

export const tokenizeSync = (code: string, language: string): HighlightToken[] => {
  const rules = getRules(language);
  if (rules.length === 0) return [];

  const tokens: HighlightToken[] = [];
  const occupied = new Map<number, boolean>();

  const lines = code.split('\n');
  let globalIndex = 0;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];

    for (const rule of rules) {
      rule.regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = rule.regex.exec(line)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        let overlap = false;

        for (let i = start; i < end; i++) {
          if (occupied.get(globalIndex + i)) {
            overlap = true;
            break;
          }
        }

        if (!overlap) {
          for (let i = start; i < end; i++) {
            occupied.set(globalIndex + i, true);
          }

          tokens.push({
            start: globalIndex + start,
            end: globalIndex + end,
            line: lineIdx,
            column: start,
            type: rule.type,
            color: rule.color,
          });
        }
      }
    }

    globalIndex += line.length + 1;
  }

  return tokens.sort((a, b) => a.start - b.start);
};

export const createHighlightWorker = () => {
  const workerCode = `
    ${COLORS.toString().replace('const COLORS', 'var COLORS')}
    ${getRules.toString()}
    ${tokenizeSync.toString()}

    self.onmessage = function(e) {
      const { code, language } = e.data;
      const tokens = tokenizeSync(code, language);
      const lineCount = code.split('\\n').length;
      self.postMessage({ tokens, lineCount });
    };
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};

export const highlightCode = (
  code: string,
  language: string,
): Promise<HighlightResponse> => {
  const lineCount = code.split('\n').length;

  if (lineCount <= 300) {
    return Promise.resolve({
      tokens: tokenizeSync(code, language),
      lineCount,
    });
  }

  return new Promise((resolve) => {
    const worker = createHighlightWorker();
    worker.onmessage = (e: MessageEvent<HighlightResponse>) => {
      resolve(e.data);
      worker.terminate();
    };
    worker.postMessage({ code, language });
  });
};
