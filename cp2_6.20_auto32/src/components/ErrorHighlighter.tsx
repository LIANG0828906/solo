import { useEffect, useCallback, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import { AlertCircle, Check, X } from 'lucide-react';
import type { GrammarError, ErrorType } from '@/types';
import { ERROR_COLORS, ERROR_LABELS } from '@/types';
import { ErrorMark } from '@/extensions/error-mark';
import { debounce } from '@/utils/debounce';

interface ErrorHighlighterProps {
  content: string;
  errors: GrammarError[];
  onChange?: (html: string, text: string) => void;
  editable?: boolean;
  onPrecheck?: (text: string) => void;
  isPrechecking?: boolean;
}

interface ErrorPopupState {
  error: GrammarError;
  x: number;
  y: number;
}

interface PosMapping {
  positions: number[];
  textOffsets: number[];
}

function buildPosMapping(doc: ProseMirrorNode): PosMapping {
  const positions: number[] = [];
  const textOffsets: number[] = [];
  let textOffset = 0;

  doc.descendants((node, pos) => {
    if (node.isText) {
      positions.push(pos);
      textOffsets.push(textOffset);
      textOffset += node.textContent?.length || 0;
    }
  });

  return { positions, textOffsets };
}

function textOffsetToDocPos(mapping: PosMapping, textPos: number): number {
  const { positions, textOffsets } = mapping;

  for (let i = textOffsets.length - 1; i >= 0; i--) {
    if (textPos >= textOffsets[i]) {
      const offsetInNode = textPos - textOffsets[i];
      return positions[i] + offsetInNode;
    }
  }

  return -1;
}

function applyErrorMarks(
  editor: ReturnType<typeof useEditor>,
  errors: GrammarError[]
) {
  if (!editor) return;

  editor.chain().unsetAllErrorMarks().run();

  const doc = editor.state.doc;
  const textContent = editor.getText();
  const mapping = buildPosMapping(doc);

  const sortedErrors = [...errors].sort((a, b) => a.offset - b.offset);
  const appliedRanges: Array<{ from: number; to: number }> = [];

  for (const error of sortedErrors) {
    const textFrom = error.offset;
    const textTo = error.offset + error.length;

    if (textFrom < 0 || textTo > textContent.length || textFrom >= textTo) continue;

    const docFrom = textOffsetToDocPos(mapping, textFrom);
    const docTo = textOffsetToDocPos(mapping, textTo);

    if (docFrom === -1 || docTo === -1 || docFrom >= docTo) continue;

    const overlaps = appliedRanges.some(
      (r) => (docFrom >= r.from && docFrom < r.to) || (docTo > r.from && docTo <= r.to)
    );
    if (overlaps) continue;

    editor.commands.setErrorMarkAt(docFrom, docTo, error);
    appliedRanges.push({ from: docFrom, to: docTo });
  }
}

export function ErrorHighlighter({
  content,
  errors,
  onChange,
  editable = true,
  onPrecheck,
  isPrechecking = false,
}: ErrorHighlighterProps) {
  const [popup, setPopup] = useState<ErrorPopupState | null>(null);
  const clickHandlerRef = useRef<((e: Event) => void) | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      ErrorMark,
    ],
    content,
    editable,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const text = ed.getText();
      onChange?.(html, text);
      if (onPrecheck) {
        debouncedPrecheck(text);
      }
    },
  });

  const debouncedPrecheck = useCallback(
    debounce((text: string) => {
      onPrecheck?.(text);
    }, 300),
    [onPrecheck]
  );

  useEffect(() => {
    if (!editor || !editable) return;
    const currentText = editor.getText();
    if (currentText !== content && content.length > 0) {
      editor.commands.setContent(content);
    }
  }, [content, editor, editable]);

  useEffect(() => {
    if (!editor) return;

    if (errors.length > 0) {
      applyErrorMarks(editor, errors);
    } else {
      editor.chain().unsetAllErrorMarks().run();
    }

    if (editor.view) {
      const dom = editor.view.dom;

      if (clickHandlerRef.current) {
        dom.removeEventListener('click', clickHandlerRef.current);
      }

      const handleClick = (e: Event) => {
        const target = e.target as HTMLElement;
        const errorEl = target.closest('.error-mark') as HTMLElement | null;

        if (errorEl) {
          e.stopPropagation();
          const errorType = errorEl.getAttribute('data-error-type') as ErrorType;
          const suggestion = errorEl.getAttribute('data-suggestion') || '';
          const message = errorEl.getAttribute('data-message') || '';
          const errorId = errorEl.getAttribute('data-error-id') || '';
          const rect = errorEl.getBoundingClientRect();

          setPopup({
            error: {
              id: errorId,
              type: errorType || 'spelling',
              text: errorEl.textContent || '',
              offset: 0,
              length: 0,
              suggestion,
              message,
            },
            x: Math.min(rect.left, window.innerWidth - 260),
            y: rect.bottom,
          });
        } else {
          setPopup(null);
        }
      };

      clickHandlerRef.current = handleClick;
      dom.addEventListener('click', handleClick);
    }

    return () => {
      if (editor.view && clickHandlerRef.current) {
        editor.view.dom.removeEventListener('click', clickHandlerRef.current);
      }
    };
  }, [errors, editor]);

  const errorsByType = errors.reduce((acc, err) => {
    if (!acc[err.type]) acc[err.type] = [];
    acc[err.type].push(err);
    return acc;
  }, {} as Record<ErrorType, GrammarError[]>);

  const handleErrorClick = (error: GrammarError) => {
    if (!editor) return;
    const mapping = buildPosMapping(editor.state.doc);
    const docPos = textOffsetToDocPos(mapping, error.offset);

    if (docPos !== -1) {
      editor.chain().setTextSelection(docPos).scrollIntoView().run();
    }
  };

  return (
    <div className="flex h-full gap-4">
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            {isPrechecking ? (
              <span className="inline-flex items-center gap-1 text-blue-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                正在检查...
              </span>
            ) : errors.length > 0 ? (
              <span className="inline-flex items-center gap-1 text-amber-600">
                <AlertCircle size={14} />
                发现 {errors.length} 处问题
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-green-600">
                <Check size={14} />
                暂无错误
              </span>
            )}
          </span>
        </div>

        <div className="relative flex-1 min-h-0 rounded-xl border border-amber-100 bg-[#FFF8E7] overflow-hidden">
          <EditorContent
            editor={editor}
            className="h-full p-4 prose prose-sm max-w-none editor-content"
          />

          {popup && (
            <div
              className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-4 max-w-xs animate-pop-in"
              style={{ left: popup.x, top: popup.y + 8 }}
            >
              <button
                onClick={() => setPopup(null)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
              <div className="mb-2">
                <span
                  className="inline-block px-2 py-0.5 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: ERROR_COLORS[popup.error.type] }}
                >
                  {ERROR_LABELS[popup.error.type]}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{popup.error.message}</p>
              <p className="text-sm">
                <span className="text-gray-500">建议：</span>
                <span className="text-green-600 font-medium">
                  {popup.error.suggestion}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="w-56 flex-shrink-0 overflow-y-auto space-y-4 error-sidebar">
        {(Object.keys(errorsByType) as ErrorType[]).map((type) => (
          <div key={type} className="bg-white rounded-lg border border-gray-100 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: ERROR_COLORS[type] }}
              />
              <span className="text-sm font-medium text-gray-700">
                {ERROR_LABELS[type]}
              </span>
              <span className="text-xs text-gray-400 ml-auto">
                {errorsByType[type].length}
              </span>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {errorsByType[type].slice(0, 5).map((error) => (
                <button
                  key={error.id}
                  onClick={() => handleErrorClick(error)}
                  className="w-full text-left text-xs p-2 rounded-md hover:bg-gray-50 transition-colors group"
                >
                  <span
                    className="decoration-wavy underline decoration-2"
                    style={{ textDecorationColor: ERROR_COLORS[type] }}
                  >
                    {error.text}
                  </span>
                  <span className="text-gray-400 block mt-0.5 group-hover:text-gray-500 truncate">
                    → {error.suggestion}
                  </span>
                </button>
              ))}
              {errorsByType[type].length > 5 && (
                <p className="text-xs text-gray-400 text-center">
                  还有 {errorsByType[type].length - 5} 项...
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ErrorHighlighter;
