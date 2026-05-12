import { createOpeningBattle } from '../content/encounters';
import type {
  BattleEvent,
  BattleState,
  EnemyIntent,
  GridPosition,
  GridTile,
  PlayerActionType,
  UnitState,
} from './types';

export const BATTLE_VERSION = '0.1.0-milestone-1';

const clone = <T>(value: T): T => structuredClone(value);

const samePosition = (a: GridPosition, b: GridPosition) => a.x === b.x && a.y === b.y;

export const distance = (a: GridPosition, b: GridPosition) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

const addEvent = (state: BattleState, tone: BattleEvent['tone'], message: string): void => {
  state.events = [
    {
      id: state.nextEventId,
      tone,
      message,
    },
    ...state.events,
  ].slice(0, 8);
  state.nextEventId += 1;
};

const tileAt = (state: BattleState, position: GridPosition): GridTile | undefined =>
  state.tiles.find((tile) => samePosition(tile, position));

const unitAt = (state: BattleState, position: GridPosition): UnitState | undefined =>
  state.units.find((unit) => unit.hp > 0 && samePosition(unit.position, position));

const isInsideGrid = (state: BattleState, position: GridPosition): boolean =>
  position.x >= 0 && position.y >= 0 && position.x < state.gridWidth && position.y < state.gridHeight;

const isWalkable = (state: BattleState, position: GridPosition, ignoreUnitId?: string): boolean => {
  if (!isInsideGrid(state, position)) {
    return false;
  }

  const tile = tileAt(state, position);
  if (!tile || tile.terrain === 'obstacle') {
    return false;
  }

  const occupant = unitAt(state, position);
  return !occupant || occupant.id === ignoreUnitId;
};

const livingUnits = (state: BattleState, faction?: UnitState['faction']) =>
  state.units.filter((unit) => unit.hp > 0 && (!faction || unit.faction === faction));

const nearestUnit = (from: UnitState, units: UnitState[]): UnitState | null => {
  const sorted = [...units].sort((a, b) => distance(from.position, a.position) - distance(from.position, b.position));
  return sorted[0] ?? null;
};

const refreshBattleResult = (state: BattleState): void => {
  const playersAlive = livingUnits(state, 'court').length > 0;
  const enemiesAlive = livingUnits(state, 'dawn').length > 0;

  if (!playersAlive) {
    state.phase = 'defeat';
    state.result = 'defeat';
    state.selectedAction = 'endTurn';
    addEvent(state, 'objective', 'The court falls. The dawn kingdoms reclaim the crypt.');
  } else if (!enemiesAlive) {
    state.phase = 'victory';
    state.result = 'victory';
    state.selectedAction = 'endTurn';
    addEvent(state, 'objective', 'The crypt gate is secured. The empire survives its first order.');
  }
};

const neighbors = (position: GridPosition): GridPosition[] => [
  { x: position.x + 1, y: position.y },
  { x: position.x - 1, y: position.y },
  { x: position.x, y: position.y + 1 },
  { x: position.x, y: position.y - 1 },
];

export const getReachableTiles = (state: BattleState, unitId = state.activeUnitId): GridPosition[] => {
  const unit = state.units.find((candidate) => candidate.id === unitId && candidate.hp > 0);
  if (!unit || state.phase !== 'player') {
    return [];
  }

  const visited = new Map<string, number>();
  const queue: Array<{ position: GridPosition; cost: number }> = [{ position: unit.position, cost: 0 }];
  visited.set(`${unit.position.x},${unit.position.y}`, 0);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    for (const next of neighbors(current.position)) {
      const cost = current.cost + 1;
      const key = `${next.x},${next.y}`;

      if (cost > unit.moveRange || visited.has(key) || !isWalkable(state, next, unit.id)) {
        continue;
      }

      visited.set(key, cost);
      queue.push({ position: next, cost });
    }
  }

  return Array.from(visited.keys())
    .map((key) => {
      const [x, y] = key.split(',').map(Number);
      return { x, y };
    })
    .filter((position) => !samePosition(position, unit.position));
};

export const getAttackableTargets = (state: BattleState, unitId = state.activeUnitId): UnitState[] => {
  const unit = state.units.find((candidate) => candidate.id === unitId && candidate.hp > 0);
  const ability = unit?.abilities[0];
  if (!unit || !ability || state.phase !== 'player') {
    return [];
  }

  return livingUnits(state, 'dawn').filter((enemy) => distance(unit.position, enemy.position) <= ability.range);
};

export const getEnemyIntents = (state: BattleState): EnemyIntent[] =>
  livingUnits(state, 'dawn').map((enemy) => {
    const target = nearestUnit(enemy, livingUnits(state, 'court'));
    const ability = enemy.abilities[0];

    if (!target) {
      return {
        enemyId: enemy.id,
        targetId: null,
        action: 'hold',
        description: `${enemy.name} holds position.`,
      };
    }

    if (distance(enemy.position, target.position) <= ability.range) {
      return {
        enemyId: enemy.id,
        targetId: target.id,
        action: 'attack',
        damage: ability.damage,
        description: `${enemy.name} will strike ${target.name} for ${ability.damage} damage.`,
      };
    }

    const destination = chooseAdvanceTile(state, enemy, target);
    return {
      enemyId: enemy.id,
      targetId: target.id,
      action: destination ? 'advance' : 'hold',
      destination,
      description: destination
        ? `${enemy.name} will advance toward ${target.name}.`
        : `${enemy.name} cannot find a clear path.`,
    };
  });

const chooseAdvanceTile = (state: BattleState, enemy: UnitState, target: UnitState): GridPosition | undefined => {
  let best = enemy.position;

  for (const next of neighbors(enemy.position)) {
    if (!isWalkable(state, next, enemy.id)) {
      continue;
    }

    if (distance(next, target.position) < distance(best, target.position)) {
      best = next;
    }
  }

  return samePosition(best, enemy.position) ? undefined : best;
};

const beginPlayerTurn = (state: BattleState): void => {
  state.phase = 'player';
  state.turn += 1;
  state.dawn.value = Math.min(state.dawn.max, state.dawn.value + 1);
  for (const unit of livingUnits(state, 'court')) {
    unit.actionPoints = unit.maxActionPoints;
    unit.guarded = false;
  }
  state.activeUnitId = livingUnits(state, 'court')[0]?.id ?? null;
  state.selectedUnitId = state.activeUnitId;
  state.selectedAction = 'move';
  state.enemyIntents = getEnemyIntents(state);
  addEvent(state, 'system', `Turn ${state.turn}: dawn pressure rises to ${state.dawn.value}/${state.dawn.max}.`);

  if (state.dawn.value >= state.dawn.max) {
    state.phase = 'defeat';
    state.result = 'defeat';
    addEvent(state, 'objective', 'The dawn meter is full. The court is exposed and the run is lost.');
  }
};

const resolveEnemyTurn = (state: BattleState): void => {
  state.phase = 'enemy';
  state.enemyIntents = getEnemyIntents(state);

  for (const intent of state.enemyIntents) {
    const enemy = state.units.find((unit) => unit.id === intent.enemyId && unit.hp > 0);
    if (!enemy) {
      continue;
    }

    if (intent.action === 'advance' && intent.destination) {
      enemy.position = intent.destination;
      addEvent(state, 'enemy', `${enemy.name} advances through the fog.`);
    }

    if (intent.action === 'attack' && intent.targetId && intent.damage) {
      const target = state.units.find((unit) => unit.id === intent.targetId && unit.hp > 0);
      if (!target) {
        continue;
      }

      const guardReduction = target.guarded ? 2 : 0;
      const damageDone = Math.max(1, intent.damage - target.armor - guardReduction);
      target.hp = Math.max(0, target.hp - damageDone);
      addEvent(state, 'enemy', `${enemy.name} hits ${target.name} for ${damageDone}.`);
    }
  }

  refreshBattleResult(state);
  if (state.result === 'none') {
    beginPlayerTurn(state);
  }
};

export const createInitialBattle = (): BattleState => {
  const state = createOpeningBattle();
  state.enemyIntents = getEnemyIntents(state);
  return state;
};

export const selectAction = (battle: BattleState, action: PlayerActionType): BattleState => {
  const state = clone(battle);
  if (state.phase === 'player') {
    state.selectedAction = action;
  }
  return state;
};

export const moveActiveUnit = (battle: BattleState, position: GridPosition): BattleState => {
  const state = clone(battle);
  const unit = state.units.find((candidate) => candidate.id === state.activeUnitId && candidate.hp > 0);

  if (!unit || state.phase !== 'player' || unit.actionPoints <= 0) {
    return state;
  }

  const reachable = getReachableTiles(state, unit.id).some((tile) => samePosition(tile, position));
  if (!reachable) {
    addEvent(state, 'system', 'That tile is outside the Regent\'s command reach.');
    return state;
  }

  unit.position = position;
  unit.actionPoints = 0;
  state.selectedAction = 'attack';
  state.enemyIntents = getEnemyIntents(state);
  addEvent(state, 'player', `${unit.name} moves to column ${position.x + 1}, row ${position.y + 1}.`);
  return state;
};

export const attackWithActiveUnit = (battle: BattleState, targetId: string): BattleState => {
  const state = clone(battle);
  const unit = state.units.find((candidate) => candidate.id === state.activeUnitId && candidate.hp > 0);
  const target = state.units.find((candidate) => candidate.id === targetId && candidate.hp > 0);
  const ability = unit?.abilities[0];

  if (!unit || !target || !ability || state.phase !== 'player') {
    return state;
  }

  if (distance(unit.position, target.position) > ability.range) {
    addEvent(state, 'system', `${target.name} is outside ${ability.name} range.`);
    return state;
  }

  const damageDone = Math.max(1, ability.damage - target.armor);
  target.hp = Math.max(0, target.hp - damageDone);
  unit.actionPoints = 0;
  addEvent(state, 'player', `${unit.name} uses ${ability.name}, dealing ${damageDone} to ${target.name}.`);

  refreshBattleResult(state);
  if (state.result === 'none') {
    resolveEnemyTurn(state);
  }

  return state;
};

export const guardWithActiveUnit = (battle: BattleState): BattleState => {
  const state = clone(battle);
  const unit = state.units.find((candidate) => candidate.id === state.activeUnitId && candidate.hp > 0);
  if (!unit || state.phase !== 'player') {
    return state;
  }

  unit.guarded = true;
  unit.actionPoints = 0;
  addEvent(state, 'player', `${unit.name} guards behind the command standard.`);
  resolveEnemyTurn(state);
  return state;
};

export const endPlayerTurn = (battle: BattleState): BattleState => {
  const state = clone(battle);
  if (state.phase !== 'player') {
    return state;
  }

  addEvent(state, 'system', 'The court yields the initiative.');
  resolveEnemyTurn(state);
  return state;
};

export const resetBattle = (): BattleState => createInitialBattle();
