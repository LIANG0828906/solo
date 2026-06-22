import { useState } from 'react';
import { FolderHeart, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import useRecipeStore from '@/store/recipeStore';

interface FavoriteSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FavoriteSidebar({ isOpen, onClose }: FavoriteSidebarProps) {
  const { favoriteFolders, addFavoriteFolder, removeFavoriteFolder, renameFavoriteFolder } = useRecipeStore();
  const [newFolderName, setNewFolderName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    if (!newFolderName.trim()) return;
    addFavoriteFolder({ id: Date.now().toString(), name: newFolderName.trim(), recipeIds: [] });
    setNewFolderName('');
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const confirmEdit = () => {
    if (editingId && editName.trim()) {
      renameFavoriteFolder(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-warm-card border-r border-warm-border shadow-lg transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} overflow-y-auto`}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-lg text-warm-brown flex items-center gap-2">
              <FolderHeart size={20} className="text-warm-orange-deep" />
              收藏夹
            </h2>
            <button onClick={onClose} className="lg:hidden text-warm-gray hover:text-warm-brown">
              <X size={20} />
            </button>
          </div>
          <div className="flex gap-2 mb-4">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="新建收藏夹"
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-warm-border bg-cream focus:outline-none focus:border-warm-orange"
            />
            <button onClick={handleAdd} className="p-2 rounded-lg bg-warm-orange text-white hover:bg-warm-orange-deep transition-colors">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-1">
            {favoriteFolders.map((folder) => (
              <div key={folder.id} className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cream transition-colors">
                {editingId === folder.id ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && confirmEdit()}
                      className="flex-1 px-2 py-1 text-sm rounded border border-warm-border focus:outline-none focus:border-warm-orange"
                      autoFocus
                    />
                    <button onClick={confirmEdit} className="text-green-600 hover:text-green-700"><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)} className="text-warm-gray hover:text-warm-brown"><X size={14} /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-warm-brown truncate">{folder.name}</span>
                    <span className="text-xs text-warm-gray">{folder.recipeIds.length}</span>
                    <button onClick={() => startEdit(folder.id, folder.name)} className="opacity-0 group-hover:opacity-100 text-warm-gray hover:text-warm-brown transition-opacity">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => removeFavoriteFolder(folder.id)} className="opacity-0 group-hover:opacity-100 text-warm-gray hover:text-red-500 transition-opacity">
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            ))}
            {favoriteFolders.length === 0 && (
              <p className="text-sm text-warm-gray py-4 text-center">暂无收藏夹</p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
