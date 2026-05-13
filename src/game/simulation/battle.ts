import { createEncounterBattle } from '../content/encounters';
import type {
  BattleEvent,
  BattleState,
  DifficultyBand,
  EncounterId,
  EnemyIntent,
  GridPosition,
  GridTile,
  HazardId,
  PlayerActionType,
  RunState,
  StatusId,
  UnitState,
} from './types';

export const BATTLE_VERSION = '0.8.0-milestone-8';

const clone = <T>(value: T): T => structuredClone(value);

const samePosition = (a: GridPosition, b: GridPosition) => a.x === b.x && a.y === b.y;

const tileKey = (position: GridPosition) => `${position.x},${position.y}`;

export const distance = (a: GridPosition, b: GridPosition) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

const addEvent = (state: BattleState, tone: BattleEvent['tone'], message: string): void => {
  state.events = [
    {
      id: state.nextEventId,
      tone,
      message,
    },
    ...state.events,
  ].slice(0, 10);
  state.nextEventId += 1;
};

const tileAt = (state: BattleState, position: GridPosition): GridTile | undefined =>
  state.tiles.find((tile) => samePosition(tile, position));

const unitAt = (state: BattleState, position: GridPosition): UnitState | undefined =>
  state.units.find((unit) => !unit.downed && samePosition(unit.position, position));

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
  state.units.filter((unit) => !unit.downed && unit.hp > 0 && (!faction || unit.faction === faction));

const courtUnit = (state: BattleState, unitId: string | null | undefined) =>
  state.units.find((unit) => unit.id === unitId && unit.faction === 'court' && !unit.downed && unit.hp > 0);

const activeUnit = (state: BattleState) => courtUnit(state, state.activeUnitId);

const selectedAbility = (unit: UnitState | undefined, action: PlayerActionType = 'attack') =>
  action === 'special' ? unit?.abilities[1] : unit?.abilities[0];

const isTargetedAction = (action: PlayerActionType): boolean => action === 'attack' || action === 'special';

const statusLabel = (status: StatusId): string => {
  switch (status) {
    case 'bleeding':
      return 'Bleeding';
    case 'dazed':
      return 'Dazed';
    case 'warded':
      return 'Warded';
    case 'downed':
      return 'Downed';
  }
};

const hazardLabel = (hazard: HazardId): string => {
  switch (hazard) {
    case 'blood_mire':
      return 'blood mire';
    case 'veil_fog':
      return 'veil fog';
    case 'sunflare':
      return 'sunflare';
    case 'relic_cache':
      return 'relic cache';
  }
};

const addStatus = (unit: UnitState, status: Exclude<StatusId, 'downed'>, turns = 2): void => {
  const existing = unit.statuses.find((candidate) => candidate.id === status);
  if (existing) {
    existing.turns = Math.max(existing.turns, turns);
    return;
  }

  unit.statuses.push({
    id: status,
    label: statusLabel(status),
    turns,
  });
};

const markDowned = (unit: UnitState): void => {
  unit.hp = 0;
  unit.actionPoints = 0;
  unit.downed = true;
  unit.guarded = false;
  unit.statuses = [
    {
      id: 'downed',
      label: 'Downed',
      turns: 99,
    },
  ];
};

const applyHazardOnEnter = (state: BattleState, unit: UnitState): void => {
  const tile = tileAt(state, unit.position);
  if (!tile?.hazard || unit.downed) {
    return;
  }

  if (tile.hazard === 'blood_mire') {
    addStatus(unit, 'bleeding', 2);
    addEvent(state, unit.faction === 'court' ? 'system' : 'enemy', `${unit.name} enters blood mire and starts bleeding.`);
  }

  if (tile.hazard === 'veil_fog') {
    addStatus(unit, 'warded', 1);
    addEvent(state, 'system', `${unit.name} is warded by veil fog.`);
  }

  if (tile.hazard === 'sunflare') {
    unit.hp = Math.max(0, unit.hp - 1);
    addStatus(unit, 'dazed', 1);
    addEvent(state, unit.faction === 'court' ? 'enemy' : 'player', `${unit.name} is scorched by sunflare.`);
    if (unit.hp <= 0) {
      markDowned(unit);
    }
  }

  if (tile.hazard === 'relic_cache') {
    addStatus(unit, 'warded', 2);
    addEvent(state, 'objective', `${unit.name} touches a relic cache and gains a ward.`);
  }
};

const coverReduction = (state: BattleState, unit: UnitState, abilityRange: number): number => {
  const tile = tileAt(state, unit.position);
  return tile?.terrain === 'cover' && abilityRange > 1 ? 1 : 0;
};

export const getFlankingAllies = (state: BattleState, attackerId: string, targetId: string): UnitState[] => {
  const attacker = state.units.find((unit) => unit.id === attackerId && !unit.downed && unit.hp > 0);
  const target = state.units.find((unit) => unit.id === targetId && !unit.downed && unit.hp > 0);
  if (!attacker || !target || attacker.faction !== 'court' || target.faction !== 'dawn') {
    return [];
  }

  return livingUnits(state, 'court').filter(
    (ally) => ally.id !== attacker.id && distance(ally.position, target.position) === 1,
  );
};

export const getAttackDamagePreview = (
  state: BattleState,
  attackerId: string,
  targetId: string,
  amount: number,
  abilityRange: number,
): { damage: number; flankBonus: number } | null => {
  const target = state.units.find((unit) => unit.id === targetId && !unit.downed && unit.hp > 0);
  if (!target) {
    return null;
  }

  const flankBonus = getFlankingAllies(state, attackerId, targetId).length > 0 ? 1 : 0;
  const guardReduction = target.guarded ? 2 : 0;
  const wardReduction = target.statuses.some((status) => status.id === 'warded') ? 1 : 0;
  return {
    damage: Math.max(1, amount + flankBonus - target.armor - guardReduction - wardReduction - coverReduction(state, target, abilityRange)),
    flankBonus,
  };
};

export const hasLineOfSight = (
  state: BattleState,
  from: GridPosition,
  to: GridPosition,
  abilityRange: number,
): boolean => {
  if (abilityRange <= 1) {
    return true;
  }

  if (from.x !== to.x && from.y !== to.y) {
    return false;
  }

  const stepX = Math.sign(to.x - from.x);
  const stepY = Math.sign(to.y - from.y);
  let cursor = { x: from.x + stepX, y: from.y + stepY };

  while (!samePosition(cursor, to)) {
    const tile = tileAt(state, cursor);
    if (!tile || tile.terrain === 'obstacle') {
      return false;
    }
    cursor = { x: cursor.x + stepX, y: cursor.y + stepY };
  }

  return true;
};

const damageUnit = (unit: UnitState, damageDone: number): number => {
  unit.hp = Math.max(0, unit.hp - damageDone);
  if (unit.hp <= 0) {
    markDowned(unit);
  }
  return damageDone;
};

const nearestUnit = (from: UnitState, units: UnitState[]): UnitState | null => {
  const sorted = [...units].sort((a, b) => distance(from.position, a.position) - distance(from.position, b.position));
  return sorted[0] ?? null;
};

const neighbors = (position: GridPosition): GridPosition[] => [
  { x: position.x + 1, y: position.y },
  { x: position.x - 1, y: position.y },
  { x: position.x, y: position.y + 1 },
  { x: position.x, y: position.y - 1 },
];

const chooseNextCourtUnit = (state: BattleState): string | null => {
  const ready = livingUnits(state, 'court').find((unit) => unit.actionPoints > 0 || !unit.hasMoved);
  return ready?.id ?? livingUnits(state, 'court')[0]?.id ?? null;
};

const selectNextReadyCourtUnit = (state: BattleState): void => {
  const next = chooseNextCourtUnit(state);
  state.activeUnitId = next;
  state.selectedUnitId = next;
};

const objectiveIsHeld = (state: BattleState): boolean => {
  if (state.objective.type !== 'hold_ritual') {
    return false;
  }

  const ritualTiles = new Set(state.objective.ritualTiles.map(tileKey));
  return livingUnits(state, 'court').some((unit) => ritualTiles.has(tileKey(unit.position)));
};

const commanderVictoryMessage = (state: BattleState, commander: UnitState | undefined): string => {
  const name = commander?.name ?? 'The commander';
  if (state.id === 'palace-gate') {
    return `${name} is broken. The palace gate loses its sunlit command.`;
  }

  if (state.id.includes('wall')) {
    return `${name} is broken. The wall patrol loses the breach.`;
  }

  if (state.id.includes('canal')) {
    return `${name} is broken. Canal lantern code falls silent.`;
  }

  if (state.id.includes('market')) {
    return `${name} is broken. The moon market shutters go dark.`;
  }

  if (state.id.includes('chapel')) {
    return `${name} is broken. Chapel bells fall quiet.`;
  }

  return `${name} is broken. The crypt gate kneels.`;
};

const ritualVictoryMessage = (state: BattleState): string => {
  if (state.id.includes('canal')) {
    return 'The canal shrine is bound. Fog-banners rise over the black water.';
  }

  if (state.id.includes('crypt')) {
    return 'The crypt sigil is bound. Night banners rise over the crypt gate.';
  }

  return 'The ritual completes. Night banners rise over the crypt gate.';
};

const refreshBattleResult = (state: BattleState): void => {
  if (state.result !== 'none') {
    return;
  }

  const playersAlive = livingUnits(state, 'court').length > 0;
  if (!playersAlive) {
    state.phase = 'defeat';
    state.result = 'defeat';
    state.selectedAction = 'endTurn';
    addEvent(state, 'objective', 'The court falls. The dawn kingdoms reclaim the crypt.');
    return;
  }

  if (state.dawn.value >= state.dawn.max) {
    state.phase = 'defeat';
    state.result = 'defeat';
    state.selectedAction = 'endTurn';
    addEvent(state, 'objective', 'The dawn meter is full. The court is exposed and the run is lost.');
    return;
  }

  if (state.objective.type === 'eliminate_commander') {
    const commander = state.units.find((unit) => unit.id === state.objective.commanderId);
    if (!commander || commander.downed || commander.hp <= 0) {
      state.phase = 'victory';
      state.result = 'victory';
      state.selectedAction = 'endTurn';
      addEvent(state, 'objective', commanderVictoryMessage(state, commander));
    }
    return;
  }

  if (state.objective.type === 'capture_relic') {
    if (state.objective.captured) {
      state.phase = 'victory';
      state.result = 'victory';
      state.selectedAction = 'endTurn';
      addEvent(state, 'objective', 'The relic ledger is seized. Market oaths bend toward the night court.');
    }
    return;
  }

  if (state.objective.type === 'survive_dawn') {
    if (state.objective.survivedTurns >= state.objective.requiredTurns) {
      state.phase = 'victory';
      state.result = 'victory';
      state.selectedAction = 'endTurn';
      addEvent(state, 'objective', 'The court survives the dawn pyre. Chapel fires gutter into imperial ash.');
    }
    return;
  }

  if (state.objective.type === 'escape_route') {
    if (state.objective.escapedUnitIds.length >= state.objective.requiredEscapes) {
      state.phase = 'victory';
      state.result = 'victory';
      state.selectedAction = 'endTurn';
      addEvent(state, 'objective', 'The court slips through the fog bridge. Canal patrols lose the trail.');
    }
    return;
  }

  if (state.objective.type === 'protect_unit') {
    const protectedUnit = state.units.find((unit) => unit.id === state.objective.protectedUnitId);
    if (!protectedUnit || protectedUnit.downed || protectedUnit.hp <= 0) {
      state.phase = 'defeat';
      state.result = 'defeat';
      state.selectedAction = 'endTurn';
      addEvent(state, 'objective', 'The protected court anchor falls. The wall breach collapses under dawn command.');
      return;
    }

    if (state.objective.protectedTurns >= state.objective.requiredTurns) {
      state.phase = 'victory';
      state.result = 'victory';
      state.selectedAction = 'endTurn';
      addEvent(state, 'objective', `${protectedUnit.name} seals the breach. The wall opens to the night court.`);
    }
    return;
  }

  if (state.objective.heldTurns >= state.objective.requiredTurns) {
    state.phase = 'victory';
    state.result = 'victory';
    state.selectedAction = 'endTurn';
    addEvent(state, 'objective', ritualVictoryMessage(state));
  }
};

const tickStatuses = (state: BattleState, faction: UnitState['faction']): void => {
  for (const unit of livingUnits(state, faction)) {
    const bleeding = unit.statuses.find((status) => status.id === 'bleeding');
    if (bleeding) {
      unit.hp = Math.max(0, unit.hp - 1);
      addEvent(state, unit.faction === 'court' ? 'enemy' : 'player', `${unit.name} loses 1 health to bleeding.`);
      if (unit.hp <= 0) {
        markDowned(unit);
      }
    }

    unit.statuses = unit.statuses
      .map((status) => ({ ...status, turns: status.id === 'downed' ? status.turns : status.turns - 1 }))
      .filter((status) => status.id === 'downed' || status.turns > 0);
  }
};

export const getReachableTiles = (state: BattleState, unitId = state.activeUnitId): GridPosition[] => {
  const unit = courtUnit(state, unitId);
  if (!unit || state.phase !== 'player' || unit.hasMoved) {
    return [];
  }

  const visited = new Map<string, number>();
  const queue: Array<{ position: GridPosition; cost: number }> = [{ position: unit.position, cost: 0 }];
  visited.set(tileKey(unit.position), 0);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    for (const next of neighbors(current.position)) {
      const cost = current.cost + 1;
      const key = tileKey(next);

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
  const unit = courtUnit(state, unitId);
  const ability = selectedAbility(unit, state.selectedAction);
  if (!unit || !ability || !isTargetedAction(state.selectedAction) || state.phase !== 'player' || unit.actionPoints <= 0) {
    return [];
  }

  return livingUnits(state, 'dawn').filter(
    (enemy) =>
      distance(unit.position, enemy.position) <= ability.range &&
      hasLineOfSight(state, unit.position, enemy.position, ability.range),
  );
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

    if (distance(enemy.position, target.position) <= ability.range && hasLineOfSight(state, enemy.position, target.position, ability.range)) {
      return {
        enemyId: enemy.id,
        targetId: target.id,
        action: 'attack',
        damage: ability.damage,
        status: ability.status,
        description: ability.status
          ? `${enemy.name} will use ${ability.name} on ${target.name} for ${ability.damage} and ${statusLabel(ability.status).toLowerCase()}.`
          : `${enemy.name} will strike ${target.name} for ${ability.damage} damage.`,
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
  tickStatuses(state, 'court');

  for (const unit of livingUnits(state, 'court')) {
    unit.actionPoints = unit.maxActionPoints;
    unit.guarded = false;
    unit.hasMoved = false;
  }

  selectNextReadyCourtUnit(state);
  state.selectedAction = 'move';
  state.enemyIntents = getEnemyIntents(state);
  addEvent(state, 'system', `Turn ${state.turn}: dawn pressure rises to ${state.dawn.value}/${state.dawn.max}.`);
  refreshBattleResult(state);
};

const scoreHoldObjective = (state: BattleState): void => {
  if (state.result !== 'none') {
    return;
  }

  if (state.objective.type === 'survive_dawn') {
    state.objective.survivedTurns += 1;
    addEvent(
      state,
      'objective',
      `The court endures dawn wave ${state.objective.survivedTurns}/${state.objective.requiredTurns}.`,
    );
    refreshBattleResult(state);
    return;
  }

  if (state.objective.type === 'protect_unit') {
    const protectedUnit = state.units.find((unit) => unit.id === state.objective.protectedUnitId);
    if (!protectedUnit || protectedUnit.downed || protectedUnit.hp <= 0) {
      refreshBattleResult(state);
      return;
    }

    state.objective.protectedTurns += 1;
    addEvent(
      state,
      'objective',
      `${protectedUnit.name} holds the breach ward (${state.objective.protectedTurns}/${state.objective.requiredTurns}).`,
    );
    refreshBattleResult(state);
    return;
  }

  if (state.objective.type !== 'hold_ritual') {
    return;
  }

  if (!objectiveIsHeld(state)) {
    addEvent(state, 'objective', 'No court unit holds the ritual. The rite stalls.');
    return;
  }

  state.objective.heldTurns += 1;
  addEvent(
    state,
    'objective',
    `The court holds the ritual (${state.objective.heldTurns}/${state.objective.requiredTurns}).`,
  );
  refreshBattleResult(state);
};

const isRitualTile = (state: BattleState, position: GridPosition): boolean =>
  state.objective.type === 'hold_ritual' &&
  state.objective.ritualTiles.some((ritual) => samePosition(ritual, position));

const isRelicObjectiveTile = (state: BattleState, position: GridPosition): boolean =>
  state.objective.type === 'capture_relic' &&
  state.objective.relicTiles.some((relic) => samePosition(relic, position));

const isEscapeTile = (state: BattleState, position: GridPosition): boolean =>
  state.objective.type === 'escape_route' &&
  state.objective.exitTiles.some((exit) => samePosition(exit, position));

const resolveEnemyTurn = (state: BattleState): void => {
  state.phase = 'enemy';
  tickStatuses(state, 'dawn');
  refreshBattleResult(state);
  if (state.result !== 'none') {
    return;
  }

  state.enemyIntents = getEnemyIntents(state);

  for (const intent of state.enemyIntents) {
    const enemy = state.units.find((unit) => unit.id === intent.enemyId && !unit.downed && unit.hp > 0);
    if (!enemy) {
      continue;
    }

    if (intent.action === 'advance' && intent.destination) {
      enemy.position = intent.destination;
      addEvent(state, 'enemy', `${enemy.name} advances through the fog.`);
      applyHazardOnEnter(state, enemy);
    }

    if (intent.action === 'attack' && intent.targetId && intent.damage) {
      const target = state.units.find((unit) => unit.id === intent.targetId && !unit.downed && unit.hp > 0);
      if (!target) {
        continue;
      }

      const ability = enemy.abilities[0];
      const preview = getAttackDamagePreview(state, enemy.id, target.id, intent.damage, ability?.range ?? 1);
      const damageDone = damageUnit(target, preview?.damage ?? 1);
      if (intent.status && !target.downed) {
        addStatus(target, intent.status);
      }
      addEvent(state, 'enemy', `${enemy.name} hits ${target.name} for ${damageDone}.`);
    }

    refreshBattleResult(state);
    if (state.result !== 'none') {
      return;
    }
  }

  beginPlayerTurn(state);
};

const applyDifficulty = (state: BattleState, difficulty: DifficultyBand): BattleState => {
  if (difficulty === 'standard') {
    return state;
  }

  const enemyBonus = difficulty === 'hard' ? 1 : 2;
  const dawnReduction = difficulty === 'hard' ? 1 : 2;
  state.dawn.max = Math.max(4, state.dawn.max - dawnReduction);
  for (const enemy of state.units.filter((unit) => unit.faction === 'dawn')) {
    enemy.maxHp += enemyBonus;
    enemy.hp += enemyBonus;
    enemy.abilities = enemy.abilities.map((ability) => ({
      ...ability,
      damage: ability.damage + (difficulty === 'nightmare' ? 1 : 0),
    }));
  }
  return state;
};

const applyRunModifiers = (state: BattleState, run: RunState | null | undefined): BattleState => {
  if (!run) {
    return state;
  }

  const selectedNode = run.route.flat().find((node) => node.id === run.selectedNodeId);
  if (selectedNode?.risk === 'high') {
    const elite = state.units.find((unit) => unit.faction === 'dawn' && !unit.commander);
    if (elite) {
      elite.name = elite.name.startsWith('Elite ') ? elite.name : `Elite ${elite.name}`;
      elite.maxHp += 2;
      elite.hp += 2;
      elite.armor += 1;
      addEvent(state, 'enemy', `${elite.name} anchors this high-risk district.`);
    }
  }

  if (run.doctrine === 'crown') {
    const regent = state.units.find((unit) => unit.archetype === 'regent');
    if (regent) {
      regent.maxHp += 1;
      regent.hp += 1;
      regent.armor += 1;
    }
  }

  if (run.doctrine === 'shadow') {
    for (const unit of state.units.filter((candidate) => candidate.faction === 'court')) {
      unit.moveRange += 1;
    }
  }

  if (run.doctrine === 'terror') {
    for (const enemy of state.units.filter((unit) => unit.faction === 'dawn')) {
      enemy.maxHp = Math.max(1, enemy.maxHp - 1);
      enemy.hp = Math.min(enemy.hp, enemy.maxHp);
    }
  }

  if (run.doctrine === 'blood') {
    for (const unit of state.units.filter((candidate) => candidate.faction === 'court')) {
      unit.abilities = unit.abilities.map((ability) => ({
        ...ability,
        damage: ability.damage + 1,
      }));
    }
  }

  if (run.doctrine === 'pact') {
    state.dawn.max += 1;
  }

  if (run.leader === 'grave_marshal') {
    const knight = state.units.find((unit) => unit.archetype === 'knight');
    if (knight) {
      knight.maxHp += 1;
      knight.hp += 1;
      knight.armor += 1;
    }
  }

  if (run.leader === 'veil_oracle') {
    const occultist = state.units.find((unit) => unit.archetype === 'occultist');
    if (occultist) {
      occultist.abilities = occultist.abilities.map((ability) => ({
        ...ability,
        range: ability.range + 1,
      }));
      addStatus(occultist, 'warded', 2);
    }
  }

  if (run.challengeModifiers.includes('sun_edict')) {
    for (const enemy of state.units.filter((unit) => unit.faction === 'dawn')) {
      enemy.abilities = enemy.abilities.map((ability) => ({
        ...ability,
        damage: ability.damage + 1,
      }));
    }
  }

  if (run.challengeModifiers.includes('blood_moon')) {
    state.dawn.value = Math.min(state.dawn.max - 1, state.dawn.value + 1);
  }

  if (run.challengeModifiers.includes('oath_debt')) {
    for (const enemy of state.units.filter((unit) => unit.faction === 'dawn')) {
      enemy.maxHp += 1;
      enemy.hp += 1;
    }
  }

  if (run.upgrades.includes('Knight Oathmark')) {
    const knight = state.units.find((unit) => unit.archetype === 'knight');
    if (knight) {
      knight.maxHp += 2;
      knight.hp += 2;
      knight.abilities = knight.abilities.map((ability) => ({
        ...ability,
        damage: ability.damage + 1,
      }));
    }
  }

  if (run.upgrades.includes('Occultist Focus')) {
    const occultist = state.units.find((unit) => unit.archetype === 'occultist');
    if (occultist) {
      occultist.abilities = occultist.abilities.map((ability) => ({
        ...ability,
        damage: ability.damage + 1,
        range: ability.range + 1,
      }));
    }
  }

  const relicWards = Math.min(2, run.relics.length);
  if (relicWards > 0) {
    state.dawn.max += relicWards;
    for (const unit of state.units.filter((candidate) => candidate.faction === 'court').slice(0, relicWards)) {
      addStatus(unit, 'warded', 2);
    }
  }

  if (run.relics.includes('Moon-Splinter Crown')) {
    const regent = state.units.find((unit) => unit.archetype === 'regent');
    if (regent) {
      regent.maxHp += 2;
      regent.hp += 2;
      regent.abilities = regent.abilities.map((ability) => ({
        ...ability,
        damage: ability.damage + 1,
      }));
    }
  }

  if (run.relics.includes('Canal Mirror')) {
    const occultist = state.units.find((unit) => unit.archetype === 'occultist');
    if (occultist) {
      occultist.moveRange += 1;
      occultist.abilities = occultist.abilities.map((ability) => ({
        ...ability,
        range: ability.range + 1,
      }));
    }
  }

  if (run.relics.includes('Bell Ash Reliquary')) {
    for (const enemy of state.units.filter((unit) => unit.faction === 'dawn').slice(0, 2)) {
      addStatus(enemy, 'dazed', 1);
    }
  }

  if (run.relics.includes('Wall-Key of Thorns')) {
    const knight = state.units.find((unit) => unit.archetype === 'knight');
    if (knight) {
      knight.armor += 1;
      knight.abilities = knight.abilities.map((ability) => ({
        ...ability,
        damage: ability.damage + 1,
      }));
    }
  }

  if (run.relics.includes('Market Mask')) {
    for (const unit of state.units.filter((candidate) => candidate.faction === 'court')) {
      unit.moveRange += 1;
    }
  }

  if (run.relics.includes('Palace Nightglass')) {
    state.dawn.max += 2;
  }

  if (run.resources.blood >= 4) {
    const regent = state.units.find((unit) => unit.archetype === 'regent');
    if (regent) {
      regent.abilities = regent.abilities.map((ability) => ({
        ...ability,
        damage: ability.damage + 1,
      }));
    }
  }

  addEvent(
    state,
    'system',
    `Run pressure applied: ${run.leader.replace('_', ' ')} leader, ${run.doctrine} doctrine, ${run.relics.length} relics, ${run.upgrades.length} upgrades, ${run.challengeModifiers.length} challenges.`,
  );
  return state;
};

export const createInitialBattle = (
  encounterId: EncounterId = 'ritual-hold',
  difficulty: DifficultyBand = 'standard',
  run?: RunState | null,
): BattleState => {
  const state = createEncounterBattle(encounterId);
  applyDifficulty(state, difficulty);
  applyRunModifiers(state, run);
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

export const selectUnit = (battle: BattleState, unitId: string): BattleState => {
  const state = clone(battle);
  const unit = courtUnit(state, unitId);
  if (unit && state.phase === 'player') {
    state.activeUnitId = unit.id;
    state.selectedUnitId = unit.id;
    state.selectedAction = unit.hasMoved ? 'attack' : 'move';
  }
  return state;
};

export const cycleActiveUnit = (battle: BattleState): BattleState => {
  const state = clone(battle);
  const units = livingUnits(state, 'court');
  if (state.phase !== 'player' || units.length === 0) {
    return state;
  }

  const activeIndex = units.findIndex((unit) => unit.id === state.activeUnitId);
  const next = units[(activeIndex + 1) % units.length];
  state.activeUnitId = next.id;
  state.selectedUnitId = next.id;
  state.selectedAction = next.hasMoved ? 'attack' : 'move';
  return state;
};

export const moveActiveUnit = (battle: BattleState, position: GridPosition): BattleState => {
  const state = clone(battle);
  const unit = activeUnit(state);

  if (!unit || state.phase !== 'player') {
    return state;
  }

  const reachable = getReachableTiles(state, unit.id).some((tile) => samePosition(tile, position));
  if (!reachable) {
    addEvent(state, 'system', `That tile is outside ${unit.name}'s command reach.`);
    return state;
  }

  unit.position = position;
  unit.hasMoved = true;
  applyHazardOnEnter(state, unit);
  state.selectedAction = 'attack';
  state.enemyIntents = getEnemyIntents(state);
  addEvent(state, 'player', `${unit.name} moves to column ${position.x + 1}, row ${position.y + 1}.`);
  return state;
};

export const attackWithActiveUnit = (battle: BattleState, targetId: string): BattleState => {
  const state = clone(battle);
  const unit = activeUnit(state);
  const target = state.units.find((candidate) => candidate.id === targetId && !candidate.downed && candidate.hp > 0);
  const ability = selectedAbility(unit, state.selectedAction);

  if (!unit || !target || !ability || state.phase !== 'player' || unit.actionPoints <= 0) {
    return state;
  }

  if (distance(unit.position, target.position) > ability.range) {
    addEvent(state, 'system', `${target.name} is outside ${ability.name} range.`);
    return state;
  }

  if (!hasLineOfSight(state, unit.position, target.position, ability.range)) {
    addEvent(state, 'system', `${target.name} has no clear line of sight for ${ability.name}.`);
    return state;
  }

  const preview = getAttackDamagePreview(state, unit.id, target.id, ability.damage, ability.range);
  if (!preview) {
    return state;
  }

  const damageDone = damageUnit(target, preview.damage);
  if (ability.status && !target.downed) {
    addStatus(target, ability.status);
  }
  unit.actionPoints = 0;
  addEvent(
    state,
    'player',
    `${unit.name} uses ${ability.name}, dealing ${damageDone} to ${target.name}${preview.flankBonus > 0 ? ' with flank pressure' : ''}.`,
  );

  refreshBattleResult(state);
  if (state.result === 'none') {
    selectNextReadyCourtUnit(state);
    state.enemyIntents = getEnemyIntents(state);
  }

  return state;
};

export const guardWithActiveUnit = (battle: BattleState): BattleState => {
  const state = clone(battle);
  const unit = activeUnit(state);
  if (!unit || state.phase !== 'player' || unit.actionPoints <= 0) {
    return state;
  }

  unit.guarded = true;
  unit.actionPoints = 0;
  addStatus(unit, 'warded', 1);
  addEvent(state, 'player', `${unit.name} guards behind the command standard.`);
  selectNextReadyCourtUnit(state);
  return state;
};

export const interactWithActiveUnit = (battle: BattleState): BattleState => {
  const state = clone(battle);
  const unit = activeUnit(state);
  if (!unit || state.phase !== 'player' || unit.actionPoints <= 0) {
    return state;
  }

  const tile = tileAt(state, unit.position);
  if (!tile) {
    return state;
  }

  const cacheKey = tileKey(tile);
  if (state.objective.type === 'capture_relic' && isRelicObjectiveTile(state, unit.position)) {
    if (state.objective.captured) {
      addEvent(state, 'objective', 'The relic ledger has already been seized.');
      return state;
    }

    if (tile.hazard !== 'relic_cache') {
      addEvent(state, 'system', `${unit.name} must reach the relic cache to seize the ledger.`);
      return state;
    }

    state.objective.captured = true;
    if (!state.claimedRelicCaches.includes(cacheKey)) {
      state.claimedRelicCaches.push(cacheKey);
    }
    unit.hp = Math.min(unit.maxHp, unit.hp + 2);
    unit.actionPoints = 0;
    addStatus(unit, 'warded', 3);
    addEvent(state, 'objective', `${unit.name} seizes the relic ledger, restoring 2 health and gaining a ward.`);
    refreshBattleResult(state);
    return state;
  }

  if (state.objective.type === 'escape_route' && isEscapeTile(state, unit.position)) {
    if (state.objective.escapedUnitIds.includes(unit.id)) {
      addEvent(state, 'objective', `${unit.name} has already crossed the fog bridge.`);
      return state;
    }

    state.objective.escapedUnitIds.push(unit.id);
    unit.actionPoints = 0;
    addStatus(unit, 'warded', 2);
    addEvent(
      state,
      'objective',
      `${unit.name} escapes through the fog bridge (${state.objective.escapedUnitIds.length}/${state.objective.requiredEscapes}).`,
    );
    refreshBattleResult(state);
    if (state.result === 'none') {
      selectNextReadyCourtUnit(state);
    }
    return state;
  }

  if (tile.hazard === 'relic_cache' && !state.claimedRelicCaches.includes(cacheKey)) {
    state.claimedRelicCaches.push(cacheKey);
    unit.hp = Math.min(unit.maxHp, unit.hp + 2);
    unit.actionPoints = 0;
    addStatus(unit, 'warded', 3);
    addEvent(state, 'objective', `${unit.name} opens a relic cache, restoring 2 health and gaining a ward.`);
    selectNextReadyCourtUnit(state);
    return state;
  }

  if (isRitualTile(state, unit.position)) {
    if (state.objective.type === 'hold_ritual' && state.objective.heldTurns >= state.objective.requiredTurns) {
      addEvent(state, 'objective', 'The ritual has already been claimed.');
      return state;
    }

    if (unit.hasMoved) {
      addEvent(state, 'system', `${unit.name} must begin on the ritual tile to channel it.`);
      return state;
    }

    if (state.objective.type === 'hold_ritual') {
      state.objective.heldTurns += 1;
      unit.actionPoints = 0;
      addStatus(unit, 'warded', 1);
      addEvent(state, 'objective', `${unit.name} channels the ritual (${state.objective.heldTurns}/${state.objective.requiredTurns}).`);
      refreshBattleResult(state);
      if (state.result === 'none') {
        selectNextReadyCourtUnit(state);
      }
      return state;
    }
  }

  addEvent(state, 'system', `${unit.name} has nothing to interact with here.`);
  return state;
};

export const useRelicPower = (battle: BattleState, relics: string[]): BattleState => {
  const state = clone(battle);
  const unit = activeUnit(state);
  const relic = relics[0];
  if (!unit || state.phase !== 'player' || unit.actionPoints <= 0 || state.relicPowerUsed || !relic) {
    return state;
  }

  state.relicPowerUsed = true;
  unit.actionPoints = 0;

  if (relic === 'Canal Mirror') {
    unit.hasMoved = false;
    addStatus(unit, 'warded', 2);
    state.selectedAction = 'move';
    addEvent(state, 'objective', `${unit.name} invokes Canal Mirror, reopening a mirrored path.`);
    return state;
  }

  if (relic === 'Bell Ash Reliquary') {
    for (const enemy of livingUnits(state, 'dawn').slice(0, 2)) {
      addStatus(enemy, 'dazed', 2);
    }
    addEvent(state, 'objective', `${unit.name} rings the Bell Ash Reliquary, dazing the dawn front.`);
    selectNextReadyCourtUnit(state);
    return state;
  }

  if (relic === 'Wall-Key of Thorns') {
    unit.armor += 1;
    unit.guarded = true;
    addStatus(unit, 'warded', 1);
    addEvent(state, 'objective', `${unit.name} turns the Wall-Key of Thorns and locks into cover.`);
    selectNextReadyCourtUnit(state);
    return state;
  }

  if (relic === 'Market Mask') {
    for (const court of livingUnits(state, 'court')) {
      court.hasMoved = false;
    }
    addStatus(unit, 'warded', 1);
    state.selectedAction = 'move';
    addEvent(state, 'objective', `${unit.name} raises the Market Mask, reopening court movement.`);
    return state;
  }

  if (relic === 'Palace Nightglass') {
    state.dawn.value = Math.max(0, state.dawn.value - 1);
    for (const court of livingUnits(state, 'court')) {
      addStatus(court, 'warded', 1);
    }
    addEvent(state, 'objective', `${unit.name} turns the Palace Nightglass and pushes dawn pressure back.`);
    selectNextReadyCourtUnit(state);
    return state;
  }

  unit.hp = Math.min(unit.maxHp, unit.hp + 3);
  addStatus(unit, 'warded', 2);
  addEvent(state, 'objective', `${unit.name} invokes ${relic}, restoring 3 health and gaining a ward.`);
  selectNextReadyCourtUnit(state);
  return state;
};

export const endPlayerTurn = (battle: BattleState): BattleState => {
  const state = clone(battle);
  if (state.phase !== 'player') {
    return state;
  }

  addEvent(state, 'system', 'The court yields the initiative.');
  scoreHoldObjective(state);
  if (state.result === 'none') {
    resolveEnemyTurn(state);
  }
  return state;
};

export const resetBattle = (
  encounterId: EncounterId = 'ritual-hold',
  difficulty: DifficultyBand = 'standard',
  run?: RunState | null,
): BattleState => createInitialBattle(encounterId, difficulty, run);
