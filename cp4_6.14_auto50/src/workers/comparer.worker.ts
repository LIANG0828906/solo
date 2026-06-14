import { Molecule, ComparisonResult } from '../types';
import { compareMolecules } from '../utils/comparer';

interface CompareMessage {
  type: 'compare';
  moleculeA: Molecule;
  moleculeB: Molecule;
}

interface ResultMessage {
  type: 'result';
  result: ComparisonResult;
}

interface ErrorMessage {
  type: 'error';
  error: string;
}

self.onmessage = (e: MessageEvent<CompareMessage>) => {
  try {
    const { moleculeA, moleculeB } = e.data;
    const result = compareMolecules(moleculeA, moleculeB);
    
    const response: ResultMessage = {
      type: 'result',
      result,
    };
    
    self.postMessage(response);
  } catch (err) {
    const errorResponse: ErrorMessage = {
      type: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
    self.postMessage(errorResponse);
  }
};

export {};
