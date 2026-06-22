import { useFlashcardStore } from "@/store";
import type { CardData } from "@/spacedRepetition";
import { Plus, Edit3, Trash2, X, Tag, FolderOpen, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function CardManager() {
  const { cards, addCard, updateCard, deleteCard, getCategories } = useFlashcardStore();
  const categories = getCategories();

  const [activeCategory, setActiveCategory] = useState("All");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [category, setCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingId) {
      const card = cards.find((c) => c.id === editingId);
      if (card) {
        setFront(card.front);
        setBack(card.back);
        setCategory(card.category);
        setTagsInput(card.tags.join(", "));
        setFormOpen(true);
      }
    }
  }, [editingId, cards]);

  function resetForm() {
    setFront("");
    setBack("");
    setCategory("");
    setTagsInput("");
    setEditingId(null);
  }

  function toggleForm() {
    if (formOpen && !editingId) {
      setFormOpen(false);
      resetForm();
    } else if (formOpen && editingId) {
      setFormOpen(false);
      resetForm();
    } else {
      setFormOpen(true);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingId) {
      updateCard(editingId, { front: front.trim(), back: back.trim(), category: category.trim(), tags });
    } else {
      addCard(front.trim(), back.trim(), category.trim(), tags);
    }

    resetForm();
    setFormOpen(false);
  }

  function handleEdit(card: CardData) {
    setEditingId(card.id);
  }

  function handleDelete(id: string) {
    setRemovingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      deleteCard(id);
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (editingId === id) {
        resetForm();
        setFormOpen(false);
      }
    }, 250);
  }

  const filtered = activeCategory === "All" ? cards : cards.filter((c) => c.category === activeCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gradient">My Cards</h2>
        <button
          onClick={toggleForm}
          className="btn-spring glass flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-indigo-200 transition-colors hover:text-white"
        >
          {formOpen ? <X size={18} /> : <Plus size={18} />}
          {formOpen ? "Close" : editingId ? "Edit" : "New Card"}
        </button>
      </div>

      <div
        ref={formRef}
        className={`form-expand glass-card rounded-2xl ${formOpen ? "max-h-[500px] opacity-100 p-5" : "max-h-0 opacity-0 p-0"}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-indigo-300">Front</label>
            <textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              rows={2}
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder-indigo-400 outline-none ring-1 ring-white/10 focus:ring-indigo-500/50"
              placeholder="Question or prompt..."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-indigo-300">Back</label>
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={2}
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder-indigo-400 outline-none ring-1 ring-white/10 focus:ring-indigo-500/50"
              placeholder="Answer or explanation..."
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-indigo-300">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder-indigo-400 outline-none ring-1 ring-white/10 focus:ring-indigo-500/50"
                placeholder="e.g. Vocabulary"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-indigo-300">Tags</label>
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder-indigo-400 outline-none ring-1 ring-white/10 focus:ring-indigo-500/50"
                placeholder="tag1, tag2, ..."
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn-spring flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
          >
            <Check size={16} />
            {editingId ? "Update Card" : "Create Card"}
          </button>
        </form>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`btn-spring whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              activeCategory === cat
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25"
                : "glass text-indigo-300 hover:text-white"
            }`}
          >
            {cat === "All" ? "All" : <span className="flex items-center gap-1"><FolderOpen size={13} />{cat}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-indigo-400">
          <p className="text-lg font-medium">No cards yet</p>
          <p className="mt-1 text-sm">Click "New Card" to create your first flashcard</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((card) => (
            <div
              key={card.id}
              className={`glass-card glow-border animate-fade-in p-5 transition-all ${removingIds.has(card.id) ? "card-remove" : ""}`}
            >
              <div className="mb-3 flex items-start justify-between">
                {card.category && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-medium text-indigo-300">
                    <FolderOpen size={11} />
                    {card.category}
                  </span>
                )}
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(card)}
                    className="btn-spring rounded-lg p-1.5 text-indigo-400 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="btn-spring rounded-lg p-1.5 text-indigo-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p className="mb-1 text-sm font-semibold text-white line-clamp-2">{card.front}</p>
              <p className="mb-3 text-xs text-indigo-300 line-clamp-2">{card.back}</p>

              {card.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {card.tags.map((tag) => (
                    <span
                      key={tag}
                      className="tag-pill inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-2 py-0.5 text-[11px] font-medium text-purple-300"
                    >
                      <Tag size={9} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
