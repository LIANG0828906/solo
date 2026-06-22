import { Bold, Italic, Heading1, Heading2, List, Search } from "lucide-react";
import { useAppStore } from "@/store";

interface ToolbarProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onSearchHighlight: (keyword: string) => void;
}

export default function Toolbar({ editorRef, onSearchHighlight }: ToolbarProps) {
  const searchKeyword = useAppStore((s) => s.searchKeyword);
  const setSearchKeyword = useAppStore((s) => s.setSearchKeyword);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    onSearchHighlight(value);
  };

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-white/10" style={{ backgroundColor: "#3a3f47" }}>
      <button
        onClick={() => execCommand("bold")}
        className="toolbar-btn"
        title="加粗"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => execCommand("italic")}
        className="toolbar-btn"
        title="斜体"
      >
        <Italic size={16} />
      </button>
      <div className="w-px h-5 bg-white/15 mx-1" />
      <button
        onClick={() => execCommand("formatBlock", "h1")}
        className="toolbar-btn"
        title="标题1"
      >
        <Heading1 size={16} />
      </button>
      <button
        onClick={() => execCommand("formatBlock", "h2")}
        className="toolbar-btn"
        title="标题2"
      >
        <Heading2 size={16} />
      </button>
      <div className="w-px h-5 bg-white/15 mx-1" />
      <button
        onClick={() => execCommand("insertUnorderedList")}
        className="toolbar-btn"
        title="无序列表"
      >
        <List size={16} />
      </button>
      <div className="flex-1" />
      <div className="relative flex items-center">
        <Search size={14} className="absolute left-2.5 text-gray-400" />
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="搜索内容..."
          className="w-44 bg-white/8 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-blue-accent/50 focus:ring-1 focus:ring-blue-accent/30 transition-all duration-200"
        />
      </div>
    </div>
  );
}
