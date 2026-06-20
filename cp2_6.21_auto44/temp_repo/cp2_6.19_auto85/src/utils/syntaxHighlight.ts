interface Token {
  type: 'tag' | 'attr' | 'string' | 'boolean' | 'number' | 'brace' | 'punctuation';
  value: string;
}

const tokenize = (code: string): Token[] => {
  const tokens: Token[] = [];
  let i = 0;

  while (i < code.length) {
    const char = code[i];

    if (char === '<' || char === '/' || char === '>') {
      tokens.push({ type: 'tag', value: char });
      i++;
      continue;
    }

    if (char === '{' || char === '}') {
      tokens.push({ type: 'brace', value: char });
      i++;
      continue;
    }

    if (char === '=') {
      tokens.push({ type: 'punctuation', value: char });
      i++;
      continue;
    }

    if (char === '"') {
      let str = '"';
      i++;
      while (i < code.length && code[i] !== '"') {
        if (code[i] === '\\') {
          str += code[i] + (code[i + 1] || '');
          i += 2;
        } else {
          str += code[i];
          i++;
        }
      }
      if (code[i] === '"') {
        str += '"';
        i++;
      }
      tokens.push({ type: 'string', value: str });
      continue;
    }

    if (/[a-zA-Z]/.test(char)) {
      let word = '';
      while (i < code.length && /[a-zA-Z0-9-]/.test(code[i])) {
        word += code[i];
        i++;
      }
      if (word === 'true' || word === 'false') {
        tokens.push({ type: 'boolean', value: word });
      } else if (/^\d+$/.test(word)) {
        tokens.push({ type: 'number', value: word });
      } else if (word.startsWith('--') || code[i] === '=') {
        tokens.push({ type: 'attr', value: word });
      } else {
        tokens.push({ type: 'tag', value: word });
      }
      continue;
    }

    if (/\d/.test(char)) {
      let num = '';
      while (i < code.length && /[\d.]/.test(code[i])) {
        num += code[i];
        i++;
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }

    tokens.push({ type: 'punctuation', value: char });
    i++;
  }

  return tokens;
};

const getColor = (type: Token['type']): string => {
  const colors: Record<Token['type'], string> = {
    tag: '#cba6f7',
    attr: '#89b4fa',
    string: '#a6e3a1',
    boolean: '#fab387',
    number: '#fab387',
    brace: '#f9e2af',
    punctuation: '#6c7086',
  };
  return colors[type];
};

export const highlight = (code: string): string => {
  const tokens = tokenize(code);
  return tokens
    .map((t) => `<span style="color:${getColor(t.type)}">${t.value.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`)
    .join('');
};
