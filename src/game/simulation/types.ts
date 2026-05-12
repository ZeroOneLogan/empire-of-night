export type Faction = 'court' | 'dawn';

export type BattlePhase = 'player' | 'enemy' | 'victory' | 'defeat';

export type UnitArchetype = 'regent' | 'dawn_soldier';

export type TerrainKind = 'floor' | 'obstacle' | 'ritual';

export type PlayerActionType = 'move' | 'attack' | 'guard' | 'endTurn';

export interface GridPosition {
  x: number;
  y: number;
}

export interface GridTile extends GridPosition {
  terrain: TerrainKind;
}

export interface AbilityDefinition {
  id: string;
  name: string;
  range: number;
  damage: number;
  description: string;
}

export interface UnitState {
  id: string;
  name: string;
  faction: Faction;
  archetype: UnitArchetype;
  position: GridPosition;
  hp: number;
  maxHp: number;
  armor: number;
  moveRange: number;
  actionPoints: number;
  maxActionPoints: number;
  guarded: boolean;
  abilities: AbilityDefinition[];
}

export interface EnemyIntent {
  enemyId: string;
  targetId: string | null;
  action: 'advance' | 'attack' | 'hold';
  destination?: GridPosition;
  damage?: number;
  description: string;
}

export interface BattleEvent {
  id: number;
  tone: 'system' | 'player' | 'enemy' | 'objective';
  message: string;
}

export interface ObjectiveState {
  type: 'eliminate_all';
  description: string;
}

export interface BattleState {
  id: string;
  screen: 'battle';
  turn: number;
  phase: BattlePhase;
  activeUnitId: string | null;
  gridWidth: number;
  gridHeight: number;
  tiles: GridTile[];
  units: UnitState[];
  selectedUnitId: string | null;
  selectedAction: PlayerActionType;
  objective: ObjectiveState;
  dawn: {
    value: number;
    max: number;
  };
  enemyIntents: EnemyIntent[];
  events: BattleEvent[];
  nextEventId: number;
  result: 'none' | 'victory' | 'defeat';
}

export interface BattleSnapshot {
  version: string;
  currentScreen: 'menu' | 'battle' | 'result';
  battle: BattleState | null;
}
