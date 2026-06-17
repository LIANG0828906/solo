import { PoemLine, MatchResult, Fragment } from '../types';

export class MatchChecker {
  static checkMatch(
    placedFragments: (string | null)[],
    availableFragments: Fragment[],
    currentLine: PoemLine
  ): MatchResult {
    const placedText = placedFragments
      .map((id) => {
        if (!id) return '';
        const fragment = availableFragments.find((f) => f.id === id);
        return fragment ? fragment.text : '';
      })
      .join('');

    const targetText = currentLine.text;

    if (placedText === targetText) {
      return {
        isMatch: true,
        matchedLineIndex: 0,
        matchedText: targetText,
      };
    }

    return {
      isMatch: false,
      matchedLineIndex: null,
      matchedText: null,
    };
  }

  static getNextCorrectFragment(
    placedFragments: (string | null)[],
    availableFragments: Fragment[],
    currentLine: PoemLine
  ): Fragment | null {
    const placedText = placedFragments
      .map((id) => {
        if (!id) return '';
        const fragment = availableFragments.find((f) => f.id === id);
        return fragment ? fragment.text : '';
      })
      .join('');

    const remainingText = currentLine.text.slice(placedText.length);

    for (const fragment of availableFragments) {
      if (fragment.isUsed) continue;
      if (remainingText.startsWith(fragment.text)) {
        return fragment;
      }
    }

    return null;
  }

  static isLineComplete(placedFragments: (string | null)[]): boolean {
    return placedFragments.every((f) => f !== null);
  }
}
