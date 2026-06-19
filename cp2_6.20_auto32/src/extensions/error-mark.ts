import { Mark, mergeAttributes } from '@tiptap/core';
import type { GrammarError } from '@/types';
import { ERROR_COLORS, type ErrorType } from '@/types';

export interface ErrorMarkOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    errorMark: {
      setErrorMark: (error: GrammarError) => ReturnType;
      setErrorMarkAt: (from: number, to: number, error: GrammarError) => ReturnType;
      unsetErrorMark: () => ReturnType;
      unsetAllErrorMarks: () => ReturnType;
    };
  }
}

const WAVE_STYLE: Record<ErrorType, string> = {
  spelling: `text-decoration: underline wavy ${ERROR_COLORS.spelling}; text-decoration-thickness: 2px; text-underline-offset: 3px;`,
  punctuation: `text-decoration: underline wavy ${ERROR_COLORS.punctuation}; text-decoration-thickness: 2px; text-underline-offset: 3px;`,
  grammar: `text-decoration: underline wavy ${ERROR_COLORS.grammar}; text-decoration-thickness: 2px; text-underline-offset: 3px;`,
};

export const ErrorMark = Mark.create<ErrorMarkOptions>({
  name: 'errorMark',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      errorId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-error-id'),
        renderHTML: (attributes) => {
          if (!attributes.errorId) return {};
          return { 'data-error-id': attributes.errorId };
        },
      },
      errorType: {
        default: 'spelling',
        parseHTML: (element) => element.getAttribute('data-error-type'),
        renderHTML: (attributes) => {
          if (!attributes.errorType) return {};
          return { 'data-error-type': attributes.errorType };
        },
      },
      suggestion: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-suggestion'),
        renderHTML: (attributes) => {
          if (!attributes.suggestion) return {};
          return { 'data-suggestion': attributes.suggestion };
        },
      },
      message: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-message'),
        renderHTML: (attributes) => {
          if (!attributes.message) return {};
          return { 'data-message': attributes.message };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span.error-mark' }];
  },

  renderHTML({ HTMLAttributes, mark }) {
    const errorType = (mark.attrs.errorType as ErrorType) || 'spelling';
    const waveStyle = WAVE_STYLE[errorType] || WAVE_STYLE.spelling;

    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'error-mark',
        style: `${waveStyle} cursor: pointer; position: relative;`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setErrorMark:
        (error) =>
        ({ commands }) => {
          return commands.setMark(this.name, {
            errorId: error.id,
            errorType: error.type,
            suggestion: error.suggestion,
            message: error.message,
          });
        },

      setErrorMarkAt:
        (from, to, error) =>
        ({ chain }) => {
          return chain()
            .setTextSelection({ from, to })
            .setMark(this.name, {
              errorId: error.id,
              errorType: error.type,
              suggestion: error.suggestion,
              message: error.message,
            })
            .run();
        },

      unsetErrorMark:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },

      unsetAllErrorMarks:
        () =>
        ({ tr, dispatch }) => {
          if (!dispatch) return false;
          const { doc } = tr;
          let hasMarks = false;
          doc.descendants((node) => {
            if (node.marks?.some((m) => m.type.name === this.name)) {
              hasMarks = true;
            }
          });
          if (!hasMarks) return false;
          const newTr = tr.removeMark(0, doc.content.size, this.type);
          dispatch(newTr);
          return true;
        },
    };
  },
});

export default ErrorMark;
