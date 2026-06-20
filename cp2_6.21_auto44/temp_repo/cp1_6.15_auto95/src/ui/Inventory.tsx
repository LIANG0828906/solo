import React, { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { LootItem } from '@/game/types'
import { cn } from '@/lib/utils'

const rarityColors: Record<string, string> = {
  common: '#808080',
  rare: '#4a9eff',
  epic: '#a855f7',
  legendary: '#f97316',
}

const rarityGlow: Record<string, string> = {
  common: '0 0 8px rgba(128, 128, 128, 0.5)',
  rare: '0 0 12px rgba(74, 158, 255, 0.6)',
  epic: '0 0 16px rgba(168, 85, 247, 0.7)',
  legendary: '0 0 20px rgba(249, 115, 22, 0.8)',
}

const typeIcons: Record<string, string> = {
  weapon: '⚔️',
  armor: '🛡️',
  accessory: '💍',
}

const typeLabels: Record<string, string> = {
  weapon: '武器',
  armor: '护甲',
  accessory: '饰品',
}

const rarityLabels: Record<string, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
}

function getItemStatValue(item: LootItem): number {
  if (item.type === 'weapon') return item.stats.attackBonus ?? 0
  if (item.type === 'armor') return item.stats.hpBonus ?? 0
  return item.stats.energyRegenBonus ?? 0
}

function getStatLabel(type: string): string {
  if (type === 'weapon') return '攻击力'
  if (type === 'armor') return '生命值'
  return '能量恢复'
}

function EquipSlot({
  slot,
  item,
  onRemove,
}: {
  slot: 'weapon' | 'armor' | 'accessory'
  item: LootItem | null
  onRemove: () => void
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center',
        'w-[8vw] h-[8vw] min-w-[70px] min-h-[70px]',
        'border-2 rounded-lg transition-all duration-300',
        'bg-black/40 backdrop-blur-sm'
      )}
      style={{
        borderColor: item ? rarityColors[item.rarity] : 'rgba(184, 134, 11, 0.3)',
        boxShadow: item ? rarityGlow[item.rarity] : 'none',
      }}
    >
      {item ? (
        <>
          <span className="text-3xl mb-1">{typeIcons[item.type]}</span>
          <span
            className="text-xs font-bold truncate w-full text-center px-1"
            style={{ color: rarityColors[item.rarity], fontFamily: "'Cinzel', 'Noto Serif SC', serif" }}
          >
            {item.name}
          </span>
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-900/80 text-white text-xs flex items-center justify-center hover:bg-red-700 transition-colors"
          >
            ×
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center opacity-40">
          <span className="text-2xl">{typeIcons[slot]}</span>
          <span className="text-xs mt-1 text-amber-200/50" style={{ fontFamily: "'Cinzel', 'Noto Serif SC', serif" }}>
            {typeLabels[slot]}
          </span>
        </div>
      )}
    </div>
  )
}

function ItemCard({
  item,
  isSelected,
  onClick,
}: {
  item: LootItem
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center p-2 cursor-pointer',
        'border-2 rounded-lg transition-all duration-200',
        'bg-black/50 backdrop-blur-sm',
        'hover:scale-105 hover:z-10'
      )}
      style={{
        borderColor: isSelected ? '#b8860b' : rarityColors[item.rarity],
        boxShadow: isSelected
          ? '0 0 15px rgba(184, 134, 11, 0.8)'
          : 'none',
      }}
    >
      <span className="text-2xl mb-1">{typeIcons[item.type]}</span>
      <span
        className="text-xs font-bold text-center leading-tight"
        style={{ color: rarityColors[item.rarity], fontFamily: "'Cinzel', 'Noto Serif SC', serif" }}
      >
        {item.name}
      </span>
      <span className="text-[10px] text-gray-400 mt-0.5">{typeLabels[item.type]}</span>
    </div>
  )
}

function ItemDetailPanel({
  item,
  equippedItem,
  onEquip,
  onClose,
}: {
  item: LootItem
  equippedItem: LootItem | null
  onEquip: () => void
  onClose: () => void
}) {
  const itemValue = getItemStatValue(item)
  const equippedValue = equippedItem ? getItemStatValue(equippedItem) : 0
  const isBetter = itemValue > equippedValue
  const diff = itemValue - equippedValue

  return (
    <div
      className={cn(
        'flex flex-col p-4 rounded-lg border-2',
        'bg-black/60 backdrop-blur-md',
        'w-full lg:w-[20vw] min-w-[200px]'
      )}
      style={{ borderColor: '#b8860b' }}
    >
      <div className="flex justify-between items-start mb-3">
        <h3
          className="text-lg font-bold"
          style={{ color: rarityColors[item.rarity], fontFamily: "'Cinzel', 'Noto Serif SC', serif" }}
        >
          {item.name}
        </h3>
        <button
          onClick={onClose}
          className="text-amber-200/60 hover:text-amber-200 text-xl leading-none"
        >
          ×
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{typeIcons[item.type]}</span>
        <div>
          <p className="text-sm text-amber-200/80" style={{ fontFamily: "'Cinzel', 'Noto Serif SC', serif" }}>
            {typeLabels[item.type]}
          </p>
          <p
            className="text-xs font-bold"
            style={{ color: rarityColors[item.rarity] }}
          >
            {rarityLabels[item.rarity]}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-300 mb-4 italic">{item.description}</p>

      <div className="border-t border-amber-900/50 pt-3 mb-4">
        <p className="text-xs text-amber-200/60 mb-2" style={{ fontFamily: "'Cinzel', 'Noto Serif SC', serif" }}>
          属性加成
        </p>
        {item.stats.attackBonus !== undefined && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-green-400 text-sm">+{item.stats.attackBonus}</span>
            <span className="text-gray-400 text-sm">攻击力</span>
          </div>
        )}
        {item.stats.hpBonus !== undefined && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-green-400 text-sm">+{item.stats.hpBonus}</span>
            <span className="text-gray-400 text-sm">生命值</span>
          </div>
        )}
        {item.stats.energyRegenBonus !== undefined && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-green-400 text-sm">+{item.stats.energyRegenBonus}</span>
            <span className="text-gray-400 text-sm">能量恢复</span>
          </div>
        )}
      </div>

      {equippedItem && (
        <div className="border-t border-amber-900/50 pt-3 mb-4">
          <p className="text-xs text-amber-200/60 mb-2" style={{ fontFamily: "'Cinzel', 'Noto Serif SC', serif" }}>
            与已装备对比
          </p>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-sm font-bold',
                isBetter ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-400'
              )}
            >
              {isBetter ? '↑' : diff < 0 ? '↓' : '='} {Math.abs(diff)}
            </span>
            <span className="text-gray-400 text-sm">
              {getStatLabel(item.type)}
            </span>
            <span
              className={cn(
                'text-xs ml-2',
                isBetter ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-500'
              )}
            >
              ({isBetter ? '提升' : diff < 0 ? '下降' : '相同'})
            </span>
          </div>
        </div>
      )}

      <button
        onClick={onEquip}
        className={cn(
          'mt-auto py-2 px-4 rounded font-bold transition-all duration-200',
          'hover:scale-105 active:scale-95'
        )}
        style={{
          background: 'linear-gradient(180deg, #b8860b 0%, #8b6914 100%)',
          color: '#1a0a1f',
          fontFamily: "'Cinzel', 'Noto Serif SC', serif",
          boxShadow: '0 0 10px rgba(184, 134, 11, 0.5)',
        }}
      >
        装备
      </button>
    </div>
  )
}

function LootComparisonPopup({
  newItem,
  equippedItem,
  onEquip,
  onClose,
}: {
  newItem: LootItem
  equippedItem: LootItem | null
  onEquip: () => void
  onClose: () => void
}) {
  const newValue = getItemStatValue(newItem)
  const equippedValue = equippedItem ? getItemStatValue(equippedItem) : 0
  const isBetter = newValue > equippedValue
  const diff = newValue - equippedValue

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="relative flex flex-col p-6 rounded-lg border-2 max-w-[90vw] w-[500px]"
        style={{
          background: 'linear-gradient(180deg, #1a0a2e 0%, #0d0515 100%)',
          borderColor: '#b8860b',
          boxShadow: '0 0 30px rgba(184, 134, 11, 0.3)',
        }}
      >
        <h2
          className="text-xl font-bold text-center mb-4 text-amber-200"
          style={{ fontFamily: "'Cinzel', 'Noto Serif SC', serif" }}
        >
          ✨ 获得新物品 ✨
        </h2>

        <div className="flex items-stretch gap-4">
          {equippedItem && (
            <div className="flex-1 flex flex-col items-center">
              <p className="text-xs text-gray-400 mb-2" style={{ fontFamily: "'Cinzel', 'Noto Serif SC', serif" }}>
                当前装备
              </p>
              <div
                className="w-full p-3 rounded-lg border-2 bg-black/40 flex flex-col items-center"
                style={{ borderColor: rarityColors[equippedItem.rarity] }}
              >
                <span className="text-3xl mb-2">{typeIcons[equippedItem.type]}</span>
                <p
                  className="text-sm font-bold text-center"
                  style={{ color: rarityColors[equippedItem.rarity], fontFamily: "'Cinzel', 'Noto Serif SC', serif" }}
                >
                  {equippedItem.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">{typeLabels[equippedItem.type]}</p>
                <p className="text-sm text-gray-300 mt-2">
                  {getStatLabel(equippedItem.type)}: <span className="text-green-400">+{equippedValue}</span>
                </p>
              </div>
            </div>
          )}

          {equippedItem && (
            <div className="flex items-center">
              <span
                className={cn(
                  'text-3xl font-bold',
                  isBetter ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-400'
                )}
              >
                {isBetter ? '→' : diff < 0 ? '→' : '='}
              </span>
            </div>
          )}

          <div className="flex-1 flex flex-col items-center">
            <p className="text-xs text-amber-200/70 mb-2" style={{ fontFamily: "'Cinzel', 'Noto Serif SC', serif" }}>
              新物品
            </p>
            <div
              className="w-full p-3 rounded-lg border-2 bg-black/40 flex flex-col items-center"
              style={{
                borderColor: rarityColors[newItem.rarity],
                boxShadow: rarityGlow[newItem.rarity],
              }}
            >
              <span className="text-3xl mb-2">{typeIcons[newItem.type]}</span>
              <p
                className="text-sm font-bold text-center"
                style={{ color: rarityColors[newItem.rarity], fontFamily: "'Cinzel', 'Noto Serif SC', serif" }}
              >
                {newItem.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">{typeLabels[newItem.type]}</p>
              <p className="text-sm text-gray-300 mt-2">
                {getStatLabel(newItem.type)}: <span className="text-green-400">+{newValue}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p
            className={cn(
              'text-lg font-bold',
              isBetter ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-400'
            )}
            style={{ fontFamily: "'Cinzel', 'Noto Serif SC', serif" }}
          >
            {isBetter ? `↑ ${diff} 提升` : diff < 0 ? `↓ ${Math.abs(diff)} 下降` : '相同属性'}
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded border-2 border-gray-600 text-gray-300 font-bold transition-all hover:bg-gray-800"
            style={{ fontFamily: "'Cinzel', 'Noto Serif SC', serif" }}
          >
            放入背包
          </button>
          <button
            onClick={onEquip}
            className="flex-1 py-2 px-4 rounded font-bold transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(180deg, #b8860b 0%, #8b6914 100%)',
              color: '#1a0a1f',
              fontFamily: "'Cinzel', 'Noto Serif SC', serif",
              boxShadow: '0 0 10px rgba(184, 134, 11, 0.5)',
            }}
          >
            立即装备
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Inventory() {
  const {
    isInventoryOpen,
    player,
    newLoot,
    setInventoryOpen,
    equipItem,
    setNewLoot,
  } = useGameStore()

  const [selectedItem, setSelectedItem] = useState<LootItem | null>(null)
  const [showLootPopup, setShowLootPopup] = useState(false)
  const [lootItem, setLootItem] = useState<LootItem | null>(null)

  useEffect(() => {
    if (newLoot) {
      setLootItem(newLoot)
      setShowLootPopup(true)
    }
  }, [newLoot])

  const handleCloseLootPopup = () => {
    setShowLootPopup(false)
    setLootItem(null)
    setNewLoot(null)
  }

  const handleEquipFromPopup = () => {
    if (lootItem) {
      equipItem(lootItem)
      handleCloseLootPopup()
    }
  }

  const handleEquipFromDetail = () => {
    if (selectedItem) {
      equipItem(selectedItem)
      setSelectedItem(null)
    }
  }

  const getEquippedItem = (type: string): LootItem | null => {
    if (type === 'weapon') return player.equippedWeapon
    if (type === 'armor') return player.equippedArmor
    return player.equippedAccessory
  }

  const handleRemoveEquipped = (type: 'weapon' | 'armor' | 'accessory') => {
    const equipped = getEquippedItem(type)
    if (equipped) {
      const inventory = [...player.inventory, equipped]
      useGameStore.setState((state) => ({
        player: {
          ...state.player,
          inventory,
          [type === 'weapon' ? 'equippedWeapon' : type === 'armor' ? 'equippedArmor' : 'equippedAccessory']: null,
          attack: type === 'weapon' ? 15 : state.player.attack,
          maxHp: type === 'armor' ? 100 : state.player.maxHp,
          energyRegen: type === 'accessory' ? 2 : state.player.energyRegen,
          hp: type === 'armor' ? Math.min(state.player.hp, 100) : state.player.hp,
        },
      }))
    }
  }

  const gridItems = Array(15).fill(null)

  return (
    <>
      <div
        className={cn(
          'fixed top-0 left-0 z-40 h-full transition-all duration-300 ease-out',
          isInventoryOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ width: 'auto' }}
      >
        <div
          className="h-full flex flex-col p-4 border-r-2 overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(42, 8, 69, 0.95) 0%, rgba(13, 5, 21, 0.98) 100%)',
            borderColor: '#b8860b',
            boxShadow: '5px 0 20px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            width: '32vw',
            minWidth: '280px',
            maxWidth: '450px',
          }}
        >
          <div className="relative mb-4">
            <h1
              className="text-2xl font-bold text-center py-2 text-amber-200"
              style={{
                fontFamily: "'Cinzel', 'Noto Serif SC', serif",
                textShadow: '0 0 10px rgba(184, 134, 11, 0.5)',
              }}
            >
              背包
            </h1>
            <div
              className="absolute bottom-0 left-0 right-0 h-[2px]"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, #b8860b 50%, transparent 100%)',
              }}
            />
          </div>

          <div className="mb-4">
            <p
              className="text-sm text-amber-200/70 mb-2 text-center"
              style={{ fontFamily: "'Cinzel', 'Noto Serif SC', serif" }}
            >
              装备栏
            </p>
            <div className="flex justify-center gap-3">
              <EquipSlot
                slot="weapon"
                item={player.equippedWeapon}
                onRemove={() => handleRemoveEquipped('weapon')}
              />
              <EquipSlot
                slot="armor"
                item={player.equippedArmor}
                onRemove={() => handleRemoveEquipped('armor')}
              />
              <EquipSlot
                slot="accessory"
                item={player.equippedAccessory}
                onRemove={() => handleRemoveEquipped('accessory')}
              />
            </div>
          </div>

          <div
            className="h-[2px] my-2"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(184, 134, 11, 0.5) 50%, transparent 100%)',
            }}
          />

          <div className="flex-1 overflow-y-auto pr-1">
            <p
              className="text-sm text-amber-200/70 mb-2 text-center"
              style={{ fontFamily: "'Cinzel', 'Noto Serif SC', serif" }}
            >
              物品 ({player.inventory.length}/15)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {gridItems.map((_, index) => {
                const item = player.inventory[index]
                if (!item) {
                  return (
                    <div
                      key={index}
                      className="aspect-square border border-dashed border-amber-900/30 rounded-lg bg-black/20"
                    />
                  )
                }
                return (
                  <ItemCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItem?.id === item.id}
                    onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                  />
                )
              })}
            </div>
          </div>

          {selectedItem && (
            <div className="mt-4 lg:hidden">
              <ItemDetailPanel
                item={selectedItem}
                equippedItem={getEquippedItem(selectedItem.type)}
                onEquip={handleEquipFromDetail}
                onClose={() => setSelectedItem(null)}
              />
            </div>
          )}

          <button
            onClick={() => setInventoryOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full border border-amber-700/50 text-amber-200/70 hover:text-amber-200 hover:border-amber-500 transition-all flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {selectedItem && (
          <div className="hidden lg:block absolute top-0 left-full ml-4 h-full flex items-center">
            <ItemDetailPanel
              item={selectedItem}
              equippedItem={getEquippedItem(selectedItem.type)}
              onEquip={handleEquipFromDetail}
              onClose={() => setSelectedItem(null)}
            />
          </div>
        )}
      </div>

      {isInventoryOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setInventoryOpen(false)}
        />
      )}

      {showLootPopup && lootItem && (
        <LootComparisonPopup
          newItem={lootItem}
          equippedItem={getEquippedItem(lootItem.type)}
          onEquip={handleEquipFromPopup}
          onClose={handleCloseLootPopup}
        />
      )}
    </>
  )
}
