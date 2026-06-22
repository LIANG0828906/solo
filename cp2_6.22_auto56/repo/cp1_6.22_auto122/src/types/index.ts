export type TokenType = 'color' | 'spacing' | 'font';

export interface Token {
  id: string;
  name: string;
  group: string;
  type: TokenType;
  value: string;
}

export interface TokenStore {
  tokens: Token[];
  addToken: (token: Omit<Token, 'id'>) => void;
  updateToken: (id: string, updates: Partial<Token>) => void;
  deleteToken: (id: string) => void;
}

export interface ValidationError {
  tokenName: string;
  message: string;
}
