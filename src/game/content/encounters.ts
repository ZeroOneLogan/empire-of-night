import type { BattleState, EncounterId, GridPosition, GridTile, HazardId, UnitArchetype, UnitState } from '../simulation/types';

const abilities = {
  imperialStrike: {
    id: 'imperial-strike',
    name: 'Imperial Strike',
    range: 1,
    damage: 4,
    description: 'A close command-blade attack that deals 4 damage.',
  },
  oathCleave: {
    id: 'oath-cleave',
    name: 'Oath Cleave',
    range: 1,
    damage: 5,
    description: 'A heavy knight strike that cuts through armor.',
  },
  bloodHex: {
    id: 'blood-hex',
    name: 'Blood Hex',
    range: 3,
    damage: 3,
    status: 'bleeding',
    description: 'A ranged occult attack that deals 3 damage and marks the target as bleeding.',
  },
  sunSpear: {
    id: 'sun-spear',
    name: 'Sun Spear',
    range: 1,
    damage: 3,
    description: 'A drilled spear thrust from dawn infantry.',
  },
  radiantHex: {
    id: 'radiant-hex',
    name: 'Radiant Hex',
    range: 3,
    damage: 2,
    status: 'dazed',
    description: 'A ranged sun-prayer that dazes court units.',
  },
  verdictBlade: {
    id: 'verdict-blade',
    name: 'Verdict Blade',
    range: 1,
    damage: 4,
    description: 'An inquisitor commander strike that punishes exposed targets.',
  },
  lanternShot: {
    id: 'lantern-shot',
    name: 'Lantern Shot',
    range: 4,
    damage: 3,
    description: 'A long-range shot that pressures ritual holders.',
  },
  bellCrush: {
    id: 'bell-crush',
    name: 'Bell Crush',
    range: 1,
    damage: 3,
    status: 'dazed',
    description: 'A crushing bell strike that dazes the target.',
  },
  solarDecree: {
    id: 'solar-decree',
    name: 'Solar Decree',
    range: 2,
    damage: 5,
    status: 'dazed',
    description: 'A boss command that deals heavy damage and dazes the target.',
  },
} as const;

interface EncounterConfig {
  objective: 'hold_ritual' | 'eliminate_commander';
  description: string;
  event: string;
  ritualTiles?: GridPosition[];
  requiredTurns?: number;
  commanderId?: string;
  obstacles: string[];
  hazards: Partial<Record<HazardId, string[]>>;
  enemies: UnitArchetype[];
  dawnMax: number;
}

const position = (key: string): GridPosition => {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
};

const encounterConfigs: Record<EncounterId, EncounterConfig> = {
  'ritual-hold': {
    objective: 'hold_ritual',
    description: 'Hold a ritual tile for 2 court turns while dawn soldiers converge.',
    event: 'The crypt rite is exposed. Hold the marked tiles for two turns before daylight overwhelms the court.',
    ritualTiles: [{ x: 3, y: 2 }, { x: 3, y: 3 }],
    requiredTurns: 2,
    obstacles: ['3,1', '1,4', '5,3'],
    hazards: { veil_fog: ['0,1'], blood_mire: ['2,4'] },
    enemies: ['dawn_soldier', 'sun_acolyte', 'inquisitor'],
    dawnMax: 6,
  },
  'commander-duel': {
    objective: 'eliminate_commander',
    description: 'Eliminate the Gate Inquisitor before dawn turns the court to ash.',
    event: 'The Gate Inquisitor anchors the dawn patrol. Break the commander to claim the crypt gate.',
    commanderId: 'inquisitor',
    obstacles: ['3,1', '1,4', '5,3'],
    hazards: { sunflare: ['4,2'], relic_cache: ['2,3'] },
    enemies: ['dawn_soldier', 'sun_acolyte', 'inquisitor'],
    dawnMax: 7,
  },
  'crypt-rite': {
    objective: 'hold_ritual',
    description: 'Hold the crypt sigil for 2 turns while vanguard troops close in.',
    event: 'Bone lamps gutter across the crypt. The court must hold the sigil long enough to bind it.',
    ritualTiles: [{ x: 3, y: 2 }, { x: 3, y: 3 }],
    requiredTurns: 2,
    obstacles: ['1,4', '3,1', '5,3'],
    hazards: { blood_mire: ['2,4', '4,4'], veil_fog: ['0,1'] },
    enemies: ['dawn_soldier', 'sun_acolyte', 'inquisitor'],
    dawnMax: 6,
  },
  'crypt-inquisitor': {
    objective: 'eliminate_commander',
    description: 'Kill the crypt inquisitor before he consecrates the gate.',
    event: 'The inquisitor carries the gate writ. Defeating him will scatter the patrol.',
    commanderId: 'inquisitor',
    obstacles: ['2,1', '3,1', '1,4'],
    hazards: { blood_mire: ['2,3'], relic_cache: ['0,4'] },
    enemies: ['dawn_soldier', 'inquisitor', 'bell_warden'],
    dawnMax: 7,
  },
  'market-ambush': {
    objective: 'eliminate_commander',
    description: 'Cut down the lantern captain hiding in the moon market.',
    event: 'Shutters slam closed. Lantern marksmen take the market roofs.',
    commanderId: 'lantern-marksman',
    obstacles: ['2,2', '4,3', '1,4'],
    hazards: { veil_fog: ['1,1', '2,1'], relic_cache: ['3,4'] },
    enemies: ['lantern_marksman', 'dawn_soldier', 'sun_acolyte'],
    dawnMax: 7,
  },
  'market-relic': {
    objective: 'hold_ritual',
    description: 'Hold the auction dais for 2 turns to seize the relic ledger.',
    event: 'A forbidden auction spills into violence around the relic cache.',
    ritualTiles: [{ x: 3, y: 2 }, { x: 4, y: 2 }],
    requiredTurns: 2,
    obstacles: ['1,3', '3,4', '5,1'],
    hazards: { relic_cache: ['3,2'], veil_fog: ['5,4'] },
    enemies: ['lantern_marksman', 'bell_warden', 'dawn_soldier'],
    dawnMax: 7,
  },
  'chapel-bell': {
    objective: 'eliminate_commander',
    description: 'Destroy the bell warden before the chapel alarm spreads.',
    event: 'The chapel bell begins to toll. Its warden is slow, armored, and dangerous.',
    commanderId: 'bell-warden',
    obstacles: ['3,2', '3,3', '1,1'],
    hazards: { sunflare: ['4,2', '4,3'], blood_mire: ['2,4'] },
    enemies: ['bell_warden', 'sun_acolyte', 'dawn_soldier'],
    dawnMax: 7,
  },
  'chapel-pyre': {
    objective: 'hold_ritual',
    description: 'Hold the ash circle for 2 turns under chapel sunfire.',
    event: 'Sunfire crawls across the ash circle. The court must endure and hold.',
    ritualTiles: [{ x: 2, y: 2 }, { x: 3, y: 2 }],
    requiredTurns: 2,
    obstacles: ['1,3', '5,3', '3,4'],
    hazards: { sunflare: ['2,3', '4,2', '4,4'] },
    enemies: ['sun_acolyte', 'bell_warden', 'lantern_marksman'],
    dawnMax: 6,
  },
  'canal-rite': {
    objective: 'hold_ritual',
    description: 'Hold the canal shrine for 2 turns through heavy veil fog.',
    event: 'Cold canal mist hides the shrine approach from both armies.',
    ritualTiles: [{ x: 3, y: 3 }, { x: 4, y: 3 }],
    requiredTurns: 2,
    obstacles: ['1,2', '5,2', '3,1'],
    hazards: { veil_fog: ['2,2', '2,3', '4,1'], relic_cache: ['0,4'] },
    enemies: ['dawn_soldier', 'lantern_marksman', 'sun_acolyte'],
    dawnMax: 7,
  },
  'canal-smugglers': {
    objective: 'eliminate_commander',
    description: 'Kill the lantern smuggler before the canal bridge opens.',
    event: 'Dawn smugglers use lantern code to guide the patrol through fog.',
    commanderId: 'lantern-marksman',
    obstacles: ['2,1', '2,4', '4,3'],
    hazards: { veil_fog: ['1,2', '3,2', '5,4'], blood_mire: ['4,1'] },
    enemies: ['lantern_marksman', 'dawn_soldier', 'bell_warden'],
    dawnMax: 7,
  },
  'wall-siege': {
    objective: 'hold_ritual',
    description: 'Hold the wall breach for 2 turns while wardens counterattack.',
    event: 'The palace wall cracks open. The court must hold the breach.',
    ritualTiles: [{ x: 3, y: 2 }, { x: 3, y: 3 }],
    requiredTurns: 2,
    obstacles: ['1,1', '5,1', '5,4'],
    hazards: { relic_cache: ['3,3'], sunflare: ['4,3'] },
    enemies: ['bell_warden', 'dawn_soldier', 'lantern_marksman'],
    dawnMax: 7,
  },
  'wall-inquisitor': {
    objective: 'eliminate_commander',
    description: 'Break the wall inquisitor before reinforcements seal the breach.',
    event: 'A wall inquisitor orders the breach sealed with living flame.',
    commanderId: 'inquisitor',
    obstacles: ['2,2', '3,2', '1,4'],
    hazards: { sunflare: ['4,2', '5,3'], veil_fog: ['0,1'] },
    enemies: ['inquisitor', 'bell_warden', 'sun_acolyte', 'lantern_marksman'],
    dawnMax: 8,
  },
  'palace-gate': {
    objective: 'eliminate_commander',
    description: 'Kill the Dawn Exarch commanding the final gate guard.',
    event: 'The Dawn Exarch descends through the palace gate, turning every order into sunlight.',
    commanderId: 'dawn-exarch',
    obstacles: ['3,1', '3,4', '5,2'],
    hazards: { sunflare: ['4,2'], blood_mire: ['2,4'], relic_cache: ['1,1'], veil_fog: ['0,3'] },
    enemies: ['dawn_exarch', 'bell_warden', 'lantern_marksman', 'sun_acolyte'],
    dawnMax: 8,
  },
  'palace-rite': {
    objective: 'hold_ritual',
    description: 'Hold the Nightglass Throne for 2 turns to end the route.',
    event: 'The throne chamber opens. Hold the Nightglass seal and crown the run.',
    ritualTiles: [{ x: 3, y: 2 }, { x: 3, y: 3 }],
    requiredTurns: 2,
    obstacles: ['1,4', '5,1', '5,4'],
    hazards: { relic_cache: ['3,2'], sunflare: ['4,2'], blood_mire: ['2,4'] },
    enemies: ['inquisitor', 'bell_warden', 'dawn_soldier', 'sun_acolyte'],
    dawnMax: 8,
  },
};

const hazardAt = (hazards: EncounterConfig['hazards'], key: string): HazardId | undefined => {
  for (const [hazard, positions] of Object.entries(hazards) as Array<[HazardId, string[] | undefined]>) {
    if (positions?.includes(key)) {
      return hazard;
    }
  }
  return undefined;
};

const createTiles = (config: EncounterConfig): GridTile[] => {
  const obstacles = new Set(config.obstacles);
  const ritual = new Set(config.ritualTiles?.map((tile) => `${tile.x},${tile.y}`) ?? []);
  const tiles: GridTile[] = [];

  for (let y = 0; y < 6; y += 1) {
    for (let x = 0; x < 7; x += 1) {
      const key = `${x},${y}`;
      const hazard = hazardAt(config.hazards, key);
      tiles.push({
        x,
        y,
        terrain: obstacles.has(key) ? 'obstacle' : ritual.has(key) ? 'ritual' : 'floor',
        ...(hazard ? { hazard } : {}),
      });
    }
  }

  return tiles;
};

const courtSquad = (): UnitState[] => [
  createUnit('regent', 'Nocturne Regent', 'court', 'regent', { x: 1, y: 2 }),
  createUnit('knight', 'Grave Knight', 'court', 'knight', { x: 1, y: 3 }),
  createUnit('occultist', 'Veil Occultist', 'court', 'occultist', { x: 0, y: 1 }),
];

const enemyStartPositions: GridPosition[] = [
  { x: 5, y: 2 },
  { x: 5, y: 4 },
  { x: 6, y: 2 },
  { x: 6, y: 4 },
];

const enemyNames: Record<UnitArchetype, string> = {
  regent: 'Nocturne Regent',
  knight: 'Grave Knight',
  occultist: 'Veil Occultist',
  dawn_soldier: 'Dawn Vanguard',
  sun_acolyte: 'Sun Acolyte',
  inquisitor: 'Gate Inquisitor',
  lantern_marksman: 'Lantern Marksman',
  bell_warden: 'Bell Warden',
  dawn_exarch: 'Dawn Exarch',
};

const enemyIds: Record<Exclude<UnitArchetype, 'regent' | 'knight' | 'occultist'>, string> = {
  dawn_soldier: 'dawn-vanguard',
  sun_acolyte: 'sun-acolyte',
  inquisitor: 'inquisitor',
  lantern_marksman: 'lantern-marksman',
  bell_warden: 'bell-warden',
  dawn_exarch: 'dawn-exarch',
};

const createEnemies = (config: EncounterConfig): UnitState[] =>
  config.enemies.map((archetype, index) => {
    const enemyType = archetype as Exclude<UnitArchetype, 'regent' | 'knight' | 'occultist'>;
    return createUnit(enemyIds[enemyType], enemyNames[enemyType], 'dawn', enemyType, enemyStartPositions[index]);
  });

const createUnit = (
  id: string,
  name: string,
  faction: UnitState['faction'],
  archetype: UnitArchetype,
  position: GridPosition,
): UnitState => {
  const stats = unitStats(archetype);
  return {
    id,
    name,
    faction,
    archetype,
    position,
    hp: stats.hp,
    maxHp: stats.hp,
    armor: stats.armor,
    moveRange: stats.moveRange,
    actionPoints: 1,
    maxActionPoints: 1,
    guarded: false,
    hasMoved: false,
    downed: false,
    commander:
      archetype === 'inquisitor' ||
      archetype === 'lantern_marksman' ||
      archetype === 'bell_warden' ||
      archetype === 'dawn_exarch',
    abilities: [stats.ability],
    statuses: [],
  };
};

const unitStats = (archetype: UnitArchetype) => {
  switch (archetype) {
    case 'regent':
      return { hp: 14, armor: 1, moveRange: 3, ability: abilities.imperialStrike };
    case 'knight':
      return { hp: 16, armor: 2, moveRange: 3, ability: abilities.oathCleave };
    case 'occultist':
      return { hp: 10, armor: 0, moveRange: 3, ability: abilities.bloodHex };
    case 'dawn_soldier':
      return { hp: 10, armor: 0, moveRange: 2, ability: abilities.sunSpear };
    case 'sun_acolyte':
      return { hp: 8, armor: 0, moveRange: 2, ability: abilities.radiantHex };
    case 'inquisitor':
      return { hp: 13, armor: 1, moveRange: 2, ability: abilities.verdictBlade };
    case 'lantern_marksman':
      return { hp: 9, armor: 0, moveRange: 2, ability: abilities.lanternShot };
    case 'bell_warden':
      return { hp: 15, armor: 2, moveRange: 1, ability: abilities.bellCrush };
    case 'dawn_exarch':
      return { hp: 20, armor: 2, moveRange: 1, ability: abilities.solarDecree };
  }
};

export const encounterIds = Object.keys(encounterConfigs) as EncounterId[];

export const createEncounterBattle = (id: EncounterId = 'ritual-hold'): BattleState => {
  const config = encounterConfigs[id];
  const units = [...courtSquad(), ...createEnemies(config)];

  return {
    id,
    screen: 'battle',
    turn: 1,
    phase: 'player',
    activeUnitId: 'regent',
    gridWidth: 7,
    gridHeight: 6,
    tiles: createTiles(config),
    units,
    selectedUnitId: 'regent',
    selectedAction: 'move',
    objective:
      config.objective === 'eliminate_commander'
        ? {
            type: 'eliminate_commander',
            commanderId: config.commanderId ?? 'inquisitor',
            description: config.description,
          }
        : {
            type: 'hold_ritual',
            ritualTiles: config.ritualTiles ?? [{ x: 3, y: 2 }],
            heldTurns: 0,
            requiredTurns: config.requiredTurns ?? 2,
            description: config.description,
          },
    dawn: {
      value: 1,
      max: config.dawnMax,
    },
    enemyIntents: [],
    events: [
      {
        id: 1,
        tone: 'objective',
        message: config.event,
      },
    ],
    nextEventId: 2,
    result: 'none',
  };
};
