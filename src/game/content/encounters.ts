import type { BattleState, GridTile, UnitState } from '../simulation/types';

const abilityStrike = {
  id: 'imperial-strike',
  name: 'Imperial Strike',
  range: 1,
  damage: 4,
  description: 'A close command-blade attack. Deals 4 damage to an adjacent enemy.',
};

const abilitySpear = {
  id: 'sun-spear',
  name: 'Sun Spear',
  range: 1,
  damage: 3,
  description: 'A drilled spear thrust from a dawn infantry unit.',
};

const createTiles = (): GridTile[] => {
  const obstacles = new Set(['3,1', '3,2', '1,4', '5,3']);
  const ritual = new Set(['0,2', '6,2']);
  const tiles: GridTile[] = [];

  for (let y = 0; y < 6; y += 1) {
    for (let x = 0; x < 7; x += 1) {
      const key = `${x},${y}`;
      tiles.push({
        x,
        y,
        terrain: obstacles.has(key) ? 'obstacle' : ritual.has(key) ? 'ritual' : 'floor',
      });
    }
  }

  return tiles;
};

const createUnits = (): UnitState[] => [
  {
    id: 'regent',
    name: 'Nocturne Regent',
    faction: 'court',
    archetype: 'regent',
    position: { x: 1, y: 2 },
    hp: 14,
    maxHp: 14,
    armor: 1,
    moveRange: 3,
    actionPoints: 1,
    maxActionPoints: 1,
    guarded: false,
    abilities: [abilityStrike],
  },
  {
    id: 'dawn-vanguard',
    name: 'Dawn Vanguard',
    faction: 'dawn',
    archetype: 'dawn_soldier',
    position: { x: 5, y: 2 },
    hp: 10,
    maxHp: 10,
    armor: 0,
    moveRange: 2,
    actionPoints: 1,
    maxActionPoints: 1,
    guarded: false,
    abilities: [abilitySpear],
  },
];

export const createOpeningBattle = (): BattleState => ({
  id: 'opening-crypt',
  screen: 'battle',
  turn: 1,
  phase: 'player',
  activeUnitId: 'regent',
  gridWidth: 7,
  gridHeight: 6,
  tiles: createTiles(),
  units: createUnits(),
  selectedUnitId: 'regent',
  selectedAction: 'move',
  objective: {
    type: 'eliminate_all',
    description: 'Break the dawn vanguard before the eastern gate opens.',
  },
  dawn: {
    value: 1,
    max: 6,
  },
  enemyIntents: [],
  events: [
    {
      id: 1,
      tone: 'objective',
      message: 'A dawn patrol blocks the crypt gate. Defeat it before daylight reaches full strength.',
    },
  ],
  nextEventId: 2,
  result: 'none',
});
