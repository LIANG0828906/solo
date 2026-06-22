import { saveAs } from 'file-saver';
import type { Token, ValidationError } from '../types';

const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const hslColorRegex = /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/;
const rgbColorRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;

function isValidColor(value: string): boolean {
  return hexColorRegex.test(value) || hslColorRegex.test(value) || rgbColorRegex.test(value);
}

function isValidSpacing(value: string): boolean {
  const num = parseInt(value, 10);
  return !isNaN(num) && num > 0 && Number.isInteger(num);
}

function isValidFont(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateTokens(tokens: Token[]): ValidationError | null {
  for (const token of tokens) {
    switch (token.type) {
      case 'color':
        if (!isValidColor(token.value)) {
          return {
            tokenName: token.name,
            message: `导出失败：${token.name}令牌值不合法`,
          };
        }
        break;
      case 'spacing':
        if (!isValidSpacing(token.value)) {
          return {
            tokenName: token.name,
            message: `导出失败：${token.name}令牌值不合法`,
          };
        }
        break;
      case 'font':
        if (!isValidFont(token.value)) {
          return {
            tokenName: token.name,
            message: `导出失败：${token.name}令牌值不合法`,
          };
        }
        break;
    }
  }
  return null;
}

export function tokensToJson(tokens: Token[]): string {
  const result: Record<string, Record<string, string>> = {};
  for (const token of tokens) {
    if (!result[token.group]) {
      result[token.group] = {};
    }
    result[token.group][token.name] = token.value;
  }
  return JSON.stringify(result, null, 2);
}

export function tokensToCss(tokens: Token[]): string {
  const lines = [':root {'];
  for (const token of tokens) {
    let value = token.value;
    if (token.type === 'spacing') {
      value = `${value}px`;
    }
    if (token.type === 'font' && token.name === 'fontSize') {
      value = `${value}px`;
    }
    lines.push(`  --${token.name}: ${value};`);
  }
  lines.push('}');
  return lines.join('\n');
}

export function exportJson(tokens: Token[]): ValidationError | null {
  const error = validateTokens(tokens);
  if (error) {
    return error;
  }
  const json = tokensToJson(tokens);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  saveAs(blob, 'tokens.json');
  return null;
}

export function exportCss(tokens: Token[]): ValidationError | null {
  const error = validateTokens(tokens);
  if (error) {
    return error;
  }
  const css = tokensToCss(tokens);
  const blob = new Blob([css], { type: 'text/css;charset=utf-8' });
  saveAs(blob, 'tokens.css');
  return null;
}
