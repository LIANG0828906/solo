import { useState } from 'react';
import { BookOpen, Route, Pencil, X, Check } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { useBookStore } from '@/stores/bookStore';
import { useDriftStore } from '@/stores/driftStore';
import { useNavigate } from 'react-router-dom';

interface UserProfileProps {
  onClose?: () => void;
}

export default function UserProfile({ onClose }: UserProfileProps) {
  const { user, updateUserName } = useUserStore();
  const { books } = useBookStore();
  const { getRecordCountByUser, getRecentBooksByUser } = useDriftStore();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');

  if (!user) return null;

  const userBookCount = books.filter((b) => b.creatorName === user.name).length;
  const userRecordCount = getRecordCountByUser(user.name);

  const recentBookIds = getRecentBooksByUser(
    user.name,
    books.map((b) => b.id),
    5
  );
  const recentBooks = recentBookIds
    .map((id) => books.find((b) => b.id === id))
    .filter(Boolean)
    .slice(0, 5);

  const handleStartEdit = () => {
    setEditName(user.name);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (editName.trim()) {
      await updateUserName(editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(user.name);
    setIsEditing(false);
  };

  const firstLetter = user.name.charAt(0).toUpperCase();

  return (
    <div className="rounded-2xl bg-white/80 p-6 shadow-card backdrop-blur-sm">
      {onClose && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-oak-800">个人资料</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-oak-400 transition-colors hover:bg-oak-100 hover:text-oak-600"
          >
            <X size={20} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg"
          style={{ backgroundColor: user.avatarColor }}
        >
          {firstLetter}
        </div>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
                maxLength={20}
                className="w-full rounded-lg border-2 border-oak-300 bg-white px-3 py-1.5 text-lg font-semibold text-oak-800 focus:border-oak-500 focus:outline-none"
              />
              <button
                onClick={handleSaveEdit}
                className="rounded-lg bg-oak-600 p-1.5 text-white transition-colors hover:bg-oak-700"
              >
                <Check size={16} />
              </button>
              <button
                onClick={handleCancelEdit}
                className="rounded-lg bg-oak-200 p-1.5 text-oak-600 transition-colors hover:bg-oak-300"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="truncate text-xl font-bold text-oak-800">
                {user.name}
              </h2>
              <button
                onClick={handleStartEdit}
                className="flex-shrink-0 rounded-full p-1 text-oak-400 transition-colors hover:bg-oak-100 hover:text-oak-600"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}

          <p className="mt-1 text-sm text-oak-500">漂流书友</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-oak-50 p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-oak-500">
            <BookOpen size={16} />
            <span className="text-xs">参与漂流书籍</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-oak-700">
            {userBookCount}
          </p>
        </div>
        <div className="rounded-xl bg-oak-50 p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-oak-500">
            <Route size={16} />
            <span className="text-xs">总漂流记录</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-oak-700">
            {userRecordCount}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-oak-700">
          最近参与漂流
        </h3>
        {recentBooks.length === 0 ? (
          <div className="rounded-xl bg-oak-50 py-8 text-center text-sm text-oak-400">
            暂无漂流记录
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentBooks.map((book) => (
              <div
                key={book!.id}
                onClick={() => navigate(`/book/${book!.id}`)}
                className="group flex w-20 flex-shrink-0 cursor-pointer flex-col items-center"
              >
                <div className="h-28 w-20 overflow-hidden rounded-lg bg-oak-100 shadow-sm transition-all duration-200 group-hover:shadow-md">
                  {book!.coverUrl ? (
                    <img
                      src={book!.coverUrl}
                      alt={book!.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-oak-200 to-oak-300">
                      <span className="text-2xl">📖</span>
                    </div>
                  )}
                </div>
                <p className="mt-1.5 w-full truncate text-center text-xs text-oak-600">
                  {book!.title}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
