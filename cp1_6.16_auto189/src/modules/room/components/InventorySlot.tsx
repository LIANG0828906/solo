import { useState, useCallback, useRef } from 'react';
import { useRoomStore } from '../store/roomStore';
import { placeSlot, removeSlot } from '../../sync/socketSync';

function playCombineSound() {
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.3);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch {
    // ignore
  }
}

export default function InventorySlot() {
  const slots = useRoomStore((s) => s.slots);
  const items = useRoomStore((s) => s.items);
  const playerId = useRoomStore((s) => s.playerId);
  const combiningSlotIndices = useRoomStore((s) => s.combiningSlotIndices);
  const setCombiningSlotIndices = useRoomStore((s) => s.setCombiningSlotIndices);
  const applyCombinationResult = useRoomStore((s) => s.applyCombinationResult);
  const checkAdjacentCombination = useRoomStore((s) => s.tryCombination);
  const revealMessage = useRoomStore((s) => s.revealMessage);

  const [combining, setCombining] = useState(false);
  const combineTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const myItems = items.filter(
    (item) => item.picked && item.pickedBy === playerId && !slots.some((s) => s.itemId === item.id)
  );

  const handleDrop = useCallback(
    (slotIndex: number, e: React.DragEvent) => {
      e.preventDefault();
      const itemId = e.dataTransfer.getData('text/plain');
      if (!itemId) return;
      const item = items.find((i) => i.id === itemId);
      if (!item || !item.picked || item.pickedBy !== playerId) return;
      placeSlot(itemId, slotIndex);

      setTimeout(() => {
        const currentSlots = useRoomStore.getState().slots;
        const newSlots = [...currentSlots];
        newSlots[slotIndex] = { ...newSlots[slotIndex], itemId, placedBy: playerId };
        for (let i = 0; i < newSlots.length - 1; i++) {
          const a = newSlots[i];
          const b = newSlots[i + 1];
          if (a.itemId && b.itemId) {
            const result = checkAdjacentCombination(i, i + 1);
            if (result.success && result.rule) {
              setCombining(true);
              setCombiningSlotIndices([i, i + 1]);
              playCombineSound();

              clearTimeout(combineTimerRef.current);
              combineTimerRef.current = setTimeout(() => {
                const store = useRoomStore.getState();
                store.applyCombinationResult(
                  result.rule!.resultItemId,
                  [result.rule!.itemA, result.rule!.itemB] as [string, string],
                  result.rule!.revealMessage,
                  result.rule!.unlockAreaId,
                  result.rule!.resultItemId === 'open-door'
                );
                setCombining(false);
              }, 1500);
              break;
            }
          }
        }
      }, 100);
    },
    [items, playerId, checkAdjacentCombination, setCombiningSlotIndices, applyCombinationResult]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleSlotClick = useCallback(
    (slotIndex: number) => {
      const slot = slots[slotIndex];
      if (!slot.itemId) return;
      removeSlot(slotIndex);
    },
    [slots, removeSlot]
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto z-30">
      <div
        className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border-t-2 border-amber-200"
        style={{ minHeight: '80px' }}
      >
        <div className="flex items-center gap-1 mr-2 shrink-0">
          <span className="text-xs text-amber-700 font-medium">背包:</span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {myItems.length === 0 && (
            <span className="text-xs text-amber-400 italic">探索场景拾取道具...</span>
          )}
          {myItems.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', item.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              className="w-[50px] h-[50px] rounded-full bg-[#B3E5FC] border-2 border-blue-300 flex items-center justify-center text-xl cursor-grab active:cursor-grabbing hover:scale-[1.2] hover:border-amber-400 transition-all duration-300 shrink-0 hover:-translate-y-1"
              title={`${item.name}: ${item.hint}`}
            >
              {item.iconEmoji}
            </div>
          ))}
        </div>

        <div className="w-px h-10 bg-amber-300 mx-2 shrink-0" />

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-amber-700 font-medium mr-1">协作槽位:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {slots.map((slot, i) => {
            const isCombining =
              combiningSlotIndices?.includes(i) ?? false;
            const slotItem = slot.itemId
              ? items.find((it) => it.id === slot.itemId)
              : null;

            return (
              <div
                key={i}
                onDrop={(e) => handleDrop(i, e)}
                onDragOver={handleDragOver}
                onClick={() => slot.itemId && handleSlotClick(i)}
                className={`relative w-14 h-14 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  slot.itemId
                    ? 'cursor-pointer'
                    : 'cursor-default'
                } ${
                  isCombining
                    ? 'bg-amber-200 border-2 border-amber-400 animate-pulse shadow-lg shadow-amber-300/50'
                    : slot.itemId
                    ? 'bg-blue-50 border-2 border-blue-200 hover:border-amber-400'
                    : 'bg-white/50 border-2 border-dashed border-[#9E9E9E]'
                }`}
                style={{ borderWidth: '2px' }}
              >
                {slotItem ? (
                  <div className="flex flex-col items-center">
                    <span
                      className={`text-lg ${
                        isCombining ? 'animate-bounce' : ''
                      }`}
                    >
                      {slotItem.iconEmoji}
                    </span>
                    <span className="text-[8px] text-amber-700 truncate max-w-[48px] leading-tight">
                      {slotItem.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-300 text-xs">{i + 1}</span>
                )}

                {slot.placedBy && slot.placedBy !== playerId && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border border-white" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {combining && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="text-4xl animate-ping">✨</div>
        </div>
      )}

      <p className="text-center text-[10px] text-amber-600/50 py-1">
        拖拽道具到协作槽位 · 相邻道具可组合 · 点击槽位可取回
      </p>
    </div>
  );
}
