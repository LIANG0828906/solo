import type { ThemeColors } from './themes';

const KEYWORDS = new Set([
  'abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case', 'catch',
  'char', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
  'double', 'else', 'enum', 'eval', 'export', 'extends', 'false', 'final',
  'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import',
  'in', 'instanceof', 'int', 'interface', 'let', 'long', 'native', 'new',
  'null', 'package', 'private', 'protected', 'public', 'return', 'short',
  'static', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
  'transient', 'true', 'try', 'typeof', 'var', 'void', 'volatile', 'while',
  'with', 'yield', 'async', 'from', 'as', 'of', 'def', 'lambda', 'pass',
  'None', 'True', 'False', 'self', 'nonlocal', 'global', 'raise', 'except',
  'try', 'except', 'finally', 'print', 'range', 'type', 'struct', 'impl',
  'pub', 'mod', 'use', 'crate', 'move', 'ref', 'mut', 'unsafe', 'match',
  'where', 'loop', 'typealias', 'val', 'fun', 'init', 'object', 'trait',
  'open', 'override', 'sealed', 'data', 'inner', 'out', 'in', 'inline',
  'infix', 'operator', 'suspend', 'reified', 'expect', 'actual', 'external',
  'fn', 'let', 'mut', 'pub', 'use', 'mod', 'crate', 'self', 'Self', 'super',
  'where', 'for', 'loop', 'while', 'match', 'if', 'else', 'return', 'break',
  'continue', 'const', 'static', 'enum', 'struct', 'union', 'type', 'impl',
  'trait', 'unsafe', 'async', 'await', 'move', 'dyn', 'abstract', 'final',
  'native', 'synchronized', 'strictfp', 'transient', 'volatile',
  'interface', 'package', 'import', 'extends', 'implements',
]);

const BUILTINS = new Set([
  'console', 'window', 'document', 'Array', 'Object', 'String', 'Number',
  'Boolean', 'Math', 'Date', 'JSON', 'Map', 'Set', 'Promise', 'Error',
  'RegExp', 'Symbol', 'WeakMap', 'WeakSet', 'ArrayBuffer', 'DataView',
  'Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array', 'Uint16Array',
  'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array', 'BigInt64Array',
  'BigUint64Array', 'BigInt', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  'undefined', 'NaN', 'Infinity', 'decodeURI', 'decodeURIComponent',
  'encodeURI', 'encodeURIComponent', 'escape', 'unescape', 'eval', 'Function',
  'process', 'module', 'exports', 'require', '__dirname', '__filename',
  'dict', 'list', 'tuple', 'set', 'str', 'int', 'float', 'complex', 'bool',
  'bytes', 'object', 'slice', 'len', 'min', 'max', 'sum', 'abs', 'round',
  'pow', 'divmod', 'bin', 'oct', 'hex', 'chr', 'ord', 'repr', 'ascii',
  'format', 'sorted', 'reversed', 'enumerate', 'zip', 'map', 'filter',
  'any', 'all', 'open', 'input', 'isinstance', 'issubclass', 'hasattr',
  'getattr', 'setattr', 'delattr', 'property', 'classmethod', 'staticmethod',
  'super', 'Vec', 'String', 'Option', 'Some', 'None', 'Result', 'Ok', 'Err',
  'Box', 'Rc', 'Arc', 'Cell', 'RefCell', 'Mutex', 'RwLock', 'HashMap',
  'HashSet', 'BTreeMap', 'BTreeSet', 'VecDeque', 'BinaryHeap', 'println',
  'print', 'dbg', 'todo', 'unimplemented', 'panic', 'assert', 'assert_eq',
  'assert_ne', 'format', 'format_args', 'write', 'writeln',
]);

export type TokenType =
  | 'keyword'
  | 'string'
  | 'comment'
  | 'number'
  | 'function'
  | 'variable'
  | 'operator'
  | 'punctuation'
  | 'text';

export interface Token {
  type: TokenType;
  value: string;
}

export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = line.length;

  while (i < len) {
    let ch = line[i];

    if (ch === '/' && i + 1 < len && line[i + 1] === '/') {
      tokens.push({ type: 'comment', value: line.slice(i) });
      break;
    }

    if (ch === '#' && i === 0) {
      tokens.push({ type: 'comment', value: line.slice(i) });
      break;
    }

    if (ch === '/' && i + 1 < len && line[i + 1] === '*') {
      const end = line.indexOf('*/', i + 2);
      if (end === -1) {
        tokens.push({ type: 'comment', value: line.slice(i) });
        break;
      } else {
        tokens.push({ type: 'comment', value: line.slice(i, end + 2) });
        i = end + 2;
        continue;
      }
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      let j = i + 1;
      while (j < len) {
        if (line[j] === '\\' && j + 1 < len) {
          j += 2;
          continue;
        }
        if (line[j] === quote) {
          j++;
          break;
        }
        j++;
      }
      tokens.push({ type: 'string', value: line.slice(i, j) });
      i = j;
      continue;
    }

    if (/[0-9]/.test(ch) || (ch === '.' && i + 1 < len && /[0-9]/.test(line[i + 1]))) {
      let j = i;
      while (j < len && /[0-9.xXoObBeEa-fA-F_+-]/.test(line[j])) {
        j++;
      }
      tokens.push({ type: 'number', value: line.slice(i, j) });
      i = j;
      continue;
    }

    if (/[a-zA-Z_$]/.test(ch)) {
      let j = i;
      while (j < len && /[a-zA-Z0-9_$]/.test(line[j])) {
        j++;
      }
      const word = line.slice(i, j);

      if (KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', value: word });
      } else if (BUILTINS.has(word)) {
        tokens.push({ type: 'variable', value: word });
      } else if (j < len && line[j] === '(') {
        tokens.push({ type: 'function', value: word });
      } else {
        tokens.push({ type: 'text', value: word });
      }
      i = j;
      continue;
    }

    if (/[+\-*/%=<>!&|^~?:]/.test(ch)) {
      let j = i;
      while (j < len && /[+\-*/%=<>!&|^~?:]/.test(line[j])) {
        j++;
      }
      tokens.push({ type: 'operator', value: line.slice(i, j) });
      i = j;
      continue;
    }

    if (/[{}()\[\];,.]/.test(ch)) {
      tokens.push({ type: 'punctuation', value: ch });
      i++;
      continue;
    }

    if (ch === ' ' || ch === '\t') {
      let j = i;
      while (j < len && (line[j] === ' ' || line[j] === '\t')) {
        j++;
      }
      tokens.push({ type: 'text', value: line.slice(i, j) });
      i = j;
      continue;
    }

    tokens.push({ type: 'text', value: ch });
    i++;
  }

  return tokens;
}

export function getTokenColor(type: TokenType, colors: ThemeColors): string {
  switch (type) {
    case 'keyword':
      return colors.keyword;
    case 'string':
      return colors.string;
    case 'comment':
      return colors.comment;
    case 'number':
      return colors.number;
    case 'function':
      return colors.function;
    case 'variable':
      return colors.variable;
    case 'operator':
      return colors.operator;
    case 'punctuation':
      return colors.punctuation;
    case 'text':
    default:
      return colors.text;
  }
}
