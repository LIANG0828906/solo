import { useEffect, useRef, useState, useCallback } from 'react';
import { Application, Container } from 'pixi.js';
import { GameEngine } from './game/GameEngine';
import { HexCell, UnitData, ShipType, axialToPixel, pixelToAxial } from './game/UnitData';
import { eventBus } from './rendering/EventBus';
import { HexGridRenderer } from './rendering/HexGrid';
import { UnitSpriteRenderer } from './rendering/UnitSprite';
import { FleetBuilder } from './rendering/FleetBuilder';
import { BattleHUD } from './rendering/BattleHUD';

const HEX_SIZE = 40;
const GRID_COLS = 10;
const GRID_ROWS = 8;

type Scene = 'builder' | 'battle';

function BattleCanvas({ engine }: { engine: GameEngine }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const hexGridRef = useRef<HexGridRenderer | null>(null);
  const unitSpriteRef = useRef<UnitSpriteRenderer | null>(null);
  const tickRef = useRef<number>(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvasWidth = canvasRef.current.clientWidth;
    const canvasHeight = canvasRef.current.clientHeight;

    const app = new Application({
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: 0x0a0e17,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    canvasRef.current.appendChild(app.view as unknown as Node);
    appRef.current = app;

    const worldContainer = new Container();
    const gridOffsetX = canvasWidth / 2;
    const gridOffsetY = canvasHeight / 2;
    worldContainer.x = gridOffsetX;
    worldContainer.y = gridOffsetY;
    app.stage.addChild(worldContainer);

    const hexGrid = new HexGridRenderer(worldContainer);
    hexGridRef.current = hexGrid;

    const unitSprites = new UnitSpriteRenderer(worldContainer);
    unitSpriteRef.current = unitSprites;

    const state = engine.getState();
    hexGrid.drawGrid(state.grid);
    hexGrid.drawTerrain(state.grid);

    for (const unit of state.units) {
      unitSprites.addUnit(unit);
    }

    const onUnitMoved = (payload: { unitId: string; from: { q: number; r: number }; to: { q: number; r: number } }) => {
      unitSprites.moveUnit(payload.unitId, payload.from.q, payload.from.r, payload.to.q, payload.to.r);
      const updatedState = engine.getState();
      hexGrid.drawGrid(updatedState.grid);
      hexGrid.drawTerrain(updatedState.grid);
      hexGrid.clearHighlights();
    };

    const onUnitAttacked = (payload: { attackerId: string; targetId: string; damage: number; weaponType: string }) => {
      unitSprites.attackUnit(payload.attackerId, payload.targetId);
      const targetUnit = engine.units.get(payload.targetId);
      if (targetUnit) {
        unitSprites.updateUnit(targetUnit);
      }
    };

    const onUnitDestroyed = (payload: { unitId: string }) => {
      unitSprites.removeUnit(payload.unitId);
    };

    const onUnitSelected = (payload: { unitId: string | null }) => {
      unitSprites.setSelected(payload.unitId);
      const updatedState = engine.getState();
      hexGrid.drawHighlights(
        updatedState.moveRangeCells.map(k => engine.grid.get(k)!).filter(Boolean),
        updatedState.attackRangeCells.map(k => engine.grid.get(k)!).filter(Boolean),
      );
    };

    const onTurnChanged = () => {
      hexGrid.clearHighlights();
      unitSprites.setSelected(null);
    };

    const onMoveRangeCalculated = () => {
      const updatedState = engine.getState();
      hexGrid.drawHighlights(
        updatedState.moveRangeCells.map(k => engine.grid.get(k)!).filter(Boolean),
        updatedState.attackRangeCells.map(k => engine.grid.get(k)!).filter(Boolean),
      );
    };

    const onAttackRangeCalculated = () => {
      const updatedState = engine.getState();
      hexGrid.drawHighlights(
        updatedState.moveRangeCells.map(k => engine.grid.get(k)!).filter(Boolean),
        updatedState.attackRangeCells.map(k => engine.grid.get(k)!).filter(Boolean),
      );
    };

    (eventBus as any).on('unit-moved', onUnitMoved);
    (eventBus as any).on('unit-attacked', onUnitAttacked);
    (eventBus as any).on('unit-destroyed', onUnitDestroyed);
    (eventBus as any).on('unit-selected', onUnitSelected);
    (eventBus as any).on('turn-changed', onTurnChanged);
    (eventBus as any).on('move-range-calculated', onMoveRangeCalculated);
    (eventBus as any).on('attack-range-calculated', onAttackRangeCalculated);

    app.ticker.add(() => {
      tickRef.current++;
      unitSprites.update();
      if (tickRef.current % 2 === 0) {
        hexGrid.drawAnimatedTerrain(state.grid, tickRef.current);
      }
    });

    const onClick = (e: MouseEvent) => {
      if (engine.gameOver) return;
      if (engine.currentFaction !== 'player') return;

      const rect = (app.view as any).getBoundingClientRect();
      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;
      const pixX = (e.clientX - rect.left) * scaleX - gridOffsetX;
      const pixY = (e.clientY - rect.top) * scaleY - gridOffsetY;

      const hex = pixelToAxial(pixX, pixY, HEX_SIZE);

      if (hex.q < 0 || hex.q >= GRID_COLS || hex.r < 0 || hex.r >= GRID_ROWS) return;

      const clickedUnit = engine.getUnitAt(hex.q, hex.r);
      const state = engine.getState();

      if (clickedUnit && clickedUnit.faction === 'player' && !clickedUnit.hasActed) {
        engine.selectUnit(clickedUnit.id);
        return;
      }

      if (engine.selectedUnitId) {
        const key = engine.getGridKey(hex.q, hex.r);
        if (state.moveRangeCells.includes(key)) {
          engine.moveUnit(engine.selectedUnitId, hex.q, hex.r);
          engine.selectUnit(null);
          return;
        }
        if (state.attackRangeCells.includes(key) && clickedUnit && clickedUnit.faction === 'enemy') {
          engine.attackUnit(engine.selectedUnitId, clickedUnit.id);
          engine.selectUnit(null);
          return;
        }
      }

      engine.selectUnit(null);
    };

    (app.view as any).addEventListener('click', onClick);

    const onResize = () => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      app.renderer.resize(w, h);
      worldContainer.x = w / 2;
      worldContainer.y = h / 2;
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      (app.view as any).removeEventListener('click', onClick);
      (eventBus as any).off('unit-moved', onUnitMoved);
      (eventBus as any).off('unit-attacked', onUnitAttacked);
      (eventBus as any).off('unit-destroyed', onUnitDestroyed);
      (eventBus as any).off('unit-selected', onUnitSelected);
      (eventBus as any).off('turn-changed', onTurnChanged);
      (eventBus as any).off('move-range-calculated', onMoveRangeCalculated);
      (eventBus as any).off('attack-range-calculated', onAttackRangeCalculated);
      hexGrid.destroy();
      unitSprites.destroy();
      app.destroy(true, { children: true });
    };
  }, [engine]);

  return <div ref={canvasRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />;
}

function generateEnemyFleet(): { type: ShipType; slot: number }[] {
  const types: ShipType[] = ['frigate', 'cruiser', 'battleship'];
  const fleet: { type: ShipType; slot: number }[] = [];
  fleet.push({ type: 'battleship', slot: 4 });
  fleet.push({ type: 'cruiser', slot: 3 });
  fleet.push({ type: 'cruiser', slot: 5 });
  fleet.push({ type: 'frigate', slot: 1 });
  fleet.push({ type: 'frigate', slot: 7 });
  return fleet;
}

export default function App() {
  const [scene, setScene] = useState<Scene>('builder');
  const [engine, setEngine] = useState<GameEngine | null>(null);

  const handleWarp = useCallback((fleet: { type: ShipType; slot: number }[]) => {
    const newEngine = new GameEngine();
    const enemyFleet = generateEnemyFleet();
    newEngine.init(fleet, enemyFleet);
    setEngine(newEngine);
    setScene('battle');
  }, []);

  if (scene === 'builder') {
    return <FleetBuilder onWarp={handleWarp} />;
  }

  if (scene === 'battle' && engine) {
    return (
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        <BattleCanvas engine={engine} />
        <BattleHUD engine={engine} />
      </div>
    );
  }

  return null;
}
