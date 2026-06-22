import { useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useAppStore } from "@/store";

export interface EditorPanelHandle {
  getContent: () => string;
  applySnapshot: (htmlContent: string) => void;
  scrollToAndHighlight: (nodeId: string, htmlContent: string) => void;
  highlightSearchKeyword: (keyword: string) => void;
  clearHighlights: () => void;
}

const EditorPanel = forwardRef<EditorPanelHandle>((_props, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const addNode = useAppStore((s) => s.addNode);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const extractTextContent = useCallback((): string => {
    if (!editorRef.current) return "";
    return editorRef.current.innerText || "";
  }, []);

  const handleInput = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      if (!editorRef.current) return;
      const text = extractTextContent();
      const html = editorRef.current.innerHTML;
      if (text.trim().length > 0) {
        addNode(text.slice(-200), html);
      }
    }, 300);
  }, [addNode, extractTextContent]);

  useImperativeHandle(ref, () => ({
    getContent: () => {
      if (!editorRef.current) return "";
      return editorRef.current.innerHTML;
    },
    applySnapshot: (htmlContent: string) => {
      if (!editorRef.current) return;
      editorRef.current.innerHTML = htmlContent;
    },
    scrollToAndHighlight: (nodeId: string, htmlContent: string) => {
      if (!editorRef.current) return;
      const marker = editorRef.current.querySelector(`[data-node-id="${nodeId}"]`);
      if (marker) {
        marker.scrollIntoView({ behavior: "smooth", block: "center" });
        marker.classList.add("node-highlight-active");
        setTimeout(() => {
          marker.classList.remove("node-highlight-active");
        }, 2000);
      } else {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent;
        const text = tempDiv.textContent || "";
        if (!text.trim()) return;
        const range = document.createRange();
        const sel = window.getSelection();
        if (!sel || !editorRef.current.firstChild) return;
        const walker = document.createTreeWalker(
          editorRef.current,
          NodeFilter.SHOW_TEXT,
          null
        );
        let found = false;
        let currentNode: Node | null;
        while ((currentNode = walker.nextNode())) {
          const nodeText = currentNode.textContent || "";
          const idx = nodeText.indexOf(text.slice(0, 50));
          if (idx !== -1) {
            range.setStart(currentNode, idx);
            range.setEnd(currentNode, Math.min(idx + text.length, nodeText.length));
            sel.removeAllRanges();
            sel.addRange(range);
            const parentEl = (currentNode as Text).parentElement;
            if (parentEl) {
              parentEl.scrollIntoView({ behavior: "smooth", block: "center" });
              parentEl.classList.add("node-highlight-active");
              setTimeout(() => {
                parentEl.classList.remove("node-highlight-active");
              }, 2000);
            }
            found = true;
            break;
          }
        }
        if (!found) {
          editorRef.current.scrollTop = editorRef.current.scrollHeight;
        }
      }
    },
    highlightSearchKeyword: (keyword: string) => {
      if (!editorRef.current) return;
      editorRef.current.querySelectorAll("mark.search-highlight").forEach((el) => {
        const parent = el.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(el.textContent || ""), el);
          parent.normalize();
        }
      });
      if (!keyword.trim()) return;
      const walker = document.createTreeWalker(
        editorRef.current,
        NodeFilter.SHOW_TEXT,
        null
      );
      const textNodes: Text[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) {
        textNodes.push(node as Text);
      }
      const keywordLower = keyword.toLowerCase();
      for (const textNode of textNodes) {
        const text = textNode.textContent || "";
        const lower = text.toLowerCase();
        const idx = lower.indexOf(keywordLower);
        if (idx === -1) continue;
        const before = text.slice(0, idx);
        const match = text.slice(idx, idx + keyword.length);
        const after = text.slice(idx + keyword.length);
        const mark = document.createElement("mark");
        mark.className = "search-highlight";
        mark.textContent = match;
        const parent = textNode.parentNode;
        if (!parent) continue;
        const frag = document.createDocumentFragment();
        if (before) frag.appendChild(document.createTextNode(before));
        frag.appendChild(mark);
        if (after) frag.appendChild(document.createTextNode(after));
        parent.replaceChild(frag, textNode);
      }
    },
    clearHighlights: () => {
      if (!editorRef.current) return;
      editorRef.current.querySelectorAll("mark.search-highlight").forEach((el) => {
        const parent = el.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(el.textContent || ""), el);
          parent.normalize();
        }
      });
    },
  }));

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      className="editor-content w-full h-full outline-none p-6 text-base leading-relaxed overflow-y-auto"
      style={{ backgroundColor: "#fafafa", color: "#333" }}
    />
  );
});

EditorPanel.displayName = "EditorPanel";

export default EditorPanel;
