import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  value: string;
  onChange: (code: string) => void;
  language?: string;
  readOnly?: boolean;
  wsUrl?: string;
}

export default function CodeEditor({ value, onChange, language = "javascript", readOnly = false, wsUrl }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLocalChangeRef = useRef(false);

  const lines = value.split("\n");
  const lineCount = lines.length;

  useEffect(() => {
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "code_update" && !isLocalChangeRef.current) {
          onChange(data.code);
        }
      } catch (e) {
        console.error("WebSocket message parse error:", e);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, [wsUrl, onChange]);

  const syncCode = useCallback((code: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "code_update",
          code,
          timestamp: Date.now(),
        })
      );
    }
  }, []);

  const debouncedSync = useCallback(
    (code: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        syncCode(code);
      }, 50);
    },
    [syncCode]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    isLocalChangeRef.current = true;
    onChange(newCode);
    debouncedSync(newCode);
    setTimeout(() => {
      isLocalChangeRef.current = false;
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newCode = value.substring(0, start) + "  " + value.substring(end);

      isLocalChangeRef.current = true;
      onChange(newCode);
      debouncedSync(newCode);
      setTimeout(() => {
        isLocalChangeRef.current = false;
      }, 100);

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  };

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  return (
    <div className="flex h-full w-full bg-arena-card border border-arena-border rounded-xl overflow-hidden">
      <div
        ref={lineNumbersRef}
        className="flex-shrink-0 bg-arena-bg border-r border-arena-border py-3 px-2 overflow-y-hidden select-none"
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div
            key={i}
            className="text-right text-arena-textMuted text-sm font-mono leading-6 h-6 pr-2"
          >
            {i + 1}
          </div>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        readOnly={readOnly}
        spellCheck={false}
        className={cn(
          "flex-1 bg-arena-bg text-arena-text font-mono text-sm leading-6 p-3",
          "resize-none outline-none border-none",
          "focus:ring-0",
          "whitespace-pre",
          readOnly && "opacity-80 cursor-not-allowed"
        )}
        style={{ tabSize: 2 }}
      />
    </div>
  );
}
