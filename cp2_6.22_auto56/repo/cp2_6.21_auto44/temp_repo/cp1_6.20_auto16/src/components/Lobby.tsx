import { useState, useEffect } from "react";
import { Plus, Users, Clock, Play, Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Room {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  duration: number;
  status: "waiting" | "playing" | "finished";
  hostName: string;
}

interface LobbyProps {
  isLoggedIn?: boolean;
  onJoinRoom?: (roomId: string) => void;
  onCreateRoom?: (name: string, duration: number) => void;
}

const mockRooms: Room[] = [
  {
    id: "1",
    name: "算法入门挑战",
    playerCount: 1,
    maxPlayers: 2,
    duration: 10,
    status: "waiting",
    hostName: "Alice",
  },
  {
    id: "2",
    name: "数据结构大师赛",
    playerCount: 2,
    maxPlayers: 2,
    duration: 15,
    status: "playing",
    hostName: "Bob",
  },
  {
    id: "3",
    name: "快速编程对决",
    playerCount: 1,
    maxPlayers: 2,
    duration: 5,
    status: "waiting",
    hostName: "Charlie",
  },
  {
    id: "4",
    name: "周末友谊赛",
    playerCount: 0,
    maxPlayers: 2,
    duration: 10,
    status: "waiting",
    hostName: "David",
  },
  {
    id: "5",
    name: "动态规划专项",
    playerCount: 2,
    maxPlayers: 2,
    duration: 15,
    status: "finished",
    hostName: "Eve",
  },
  {
    id: "6",
    name: "新手练习场",
    playerCount: 1,
    maxPlayers: 2,
    duration: 5,
    status: "waiting",
    hostName: "Frank",
  },
];

function RoomCard({
  room,
  isLoggedIn,
  onJoin,
}: {
  room: Room;
  isLoggedIn: boolean;
  onJoin: () => void;
}) {
  const statusConfig = {
    waiting: { label: "等待中", color: "text-arena-warning", bg: "bg-arena-warning/20" },
    playing: { label: "进行中", color: "text-arena-success", bg: "bg-arena-success/20" },
    finished: { label: "已结束", color: "text-arena-textMuted", bg: "bg-arena-border" },
  };

  const status = statusConfig[room.status];
  const canJoin = room.status === "waiting" && room.playerCount < room.maxPlayers && isLoggedIn;

  return (
    <div
      className={cn(
        "bg-arena-card border border-arena-border rounded-xl p-5",
        "transition-all duration-200 ease-out",
        "hover:translate-y-[-4px] hover:shadow-xl hover:shadow-arena-accent/10 hover:border-arena-accent/50",
        "cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-bold text-arena-text truncate flex-1 mr-2">
          {room.name}
        </h3>
        <span
          className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            status.bg,
            status.color
          )}
        >
          {status.label}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-arena-textMuted text-sm">
          <Users className="w-4 h-4" />
          <span>
            {room.playerCount}/{room.maxPlayers} 玩家
          </span>
        </div>
        <div className="flex items-center gap-2 text-arena-textMuted text-sm">
          <Clock className="w-4 h-4" />
          <span>{room.duration} 分钟</span>
        </div>
        <div className="text-arena-textMuted text-sm">
          房主: <span className="text-arena-text">{room.hostName}</span>
        </div>
      </div>

      <div className="w-full bg-arena-bg rounded-full h-2 mb-4">
        <div
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            room.playerCount === room.maxPlayers
              ? "bg-arena-success"
              : "bg-arena-accent"
          )}
          style={{ width: `${(room.playerCount / room.maxPlayers) * 100}%` }}
        />
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onJoin();
        }}
        disabled={!canJoin}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all duration-200",
          canJoin
            ? "bg-arena-accent hover:bg-arena-accentHover text-white"
            : "bg-arena-border text-arena-textMuted cursor-not-allowed"
        )}
      >
        {!isLoggedIn ? (
          <>
            <Lock className="w-4 h-4" />
            请先登录
          </>
        ) : room.status === "playing" ? (
          "进行中"
        ) : room.status === "finished" ? (
          "已结束"
        ) : room.playerCount >= room.maxPlayers ? (
          "已满员"
        ) : (
          <>
            <Play className="w-4 h-4" />
            加入房间
          </>
        )}
      </button>
    </div>
  );
}

function CreateRoomModal({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, duration: number) => void;
}) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), duration);
      setName("");
      setDuration(10);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-arena-card border border-arena-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-arena-border">
          <h2 className="text-xl font-bold text-arena-text">创建房间</h2>
          <button
            onClick={onClose}
            className="text-arena-textMuted hover:text-arena-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-arena-text font-medium mb-2">
              房间名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入房间名称..."
              className="w-full bg-arena-bg border border-arena-border rounded-lg px-4 py-3 text-arena-text placeholder-arena-textMuted focus:outline-none focus:border-arena-accent transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-arena-text font-medium mb-2">
              游戏时长
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[5, 10, 15].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={cn(
                    "py-3 rounded-lg font-medium transition-all duration-200",
                    duration === d
                      ? "bg-arena-accent text-white"
                      : "bg-arena-bg text-arena-textMuted border border-arena-border hover:border-arena-accent/50"
                  )}
                >
                  {d} 分钟
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg bg-arena-bg border border-arena-border text-arena-text font-medium hover:bg-arena-border/30 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className={cn(
                "flex-1 py-3 rounded-lg font-medium transition-all duration-200",
                name.trim()
                  ? "bg-arena-accent hover:bg-arena-accentHover text-white"
                  : "bg-arena-border text-arena-textMuted cursor-not-allowed"
              )}
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Lobby({
  isLoggedIn = false,
  onJoinRoom,
  onCreateRoom,
}: LobbyProps) {
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Polling rooms...");
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = (name: string, duration: number) => {
    const newRoom: Room = {
      id: Date.now().toString(),
      name,
      playerCount: 1,
      maxPlayers: 2,
      duration,
      status: "waiting",
      hostName: "You",
    };
    setRooms([newRoom, ...rooms]);
    onCreateRoom?.(name, duration);
  };

  const handleJoinRoom = (roomId: string) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? { ...room, playerCount: Math.min(room.playerCount + 1, room.maxPlayers) }
          : room
      )
    );
    onJoinRoom?.(roomId);
  };

  return (
    <div className="min-h-screen bg-arena-bg p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-arena-text mb-1">游戏大厅</h1>
            <p className="text-arena-textMuted">选择一个房间加入，或创建新的对战</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!isLoggedIn}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200",
              isLoggedIn
                ? "bg-arena-accent hover:bg-arena-accentHover text-white hover:scale-105 active:scale-95"
                : "bg-arena-border text-arena-textMuted cursor-not-allowed"
            )}
          >
            <Plus className="w-5 h-5" />
            创建房间
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              isLoggedIn={isLoggedIn}
              onJoin={() => handleJoinRoom(room.id)}
            />
          ))}
        </div>

        <CreateRoomModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateRoom}
        />
      </div>
    </div>
  );
}
