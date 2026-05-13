export type Faction = 'court' | 'dawn';

export type BattlePhase = 'player' | 'enemy' | 'victory' | 'defeat';

export type UnitArchetype =
  | 'regent'
  | 'knight'
  | 'occultist'
  | 'dawn_soldier'
  | 'sun_acolyte'
  | 'inquisitor'
  | 'lantern_marksman'
  | 'bell_warden'
  | 'dawn_exarch';

export type TerrainKind = 'floor' | 'cover' | 'obstacle' | 'ritual';

export type HazardId = 'blood_mire' | 'veil_fog' | 'sunflare' | 'relic_cache';

export type PlayerActionType = 'move' | 'attack' | 'special' | 'interact' | 'relic' | 'guard' | 'endTurn';

export type EncounterId =
  | 'ritual-hold'
  | 'commander-duel'
  | 'crypt-rite'
  | 'crypt-inquisitor'
  | 'market-ambush'
  | 'market-relic'
  | 'chapel-bell'
  | 'chapel-pyre'
  | 'canal-rite'
  | 'canal-smugglers'
  | 'wall-siege'
  | 'wall-inquisitor'
  | 'palace-gate'
  | 'palace-rite';

export type AppScreen = 'menu' | 'route' | 'battle' | 'result' | 'reward' | 'event' | 'runSummary';

export type DifficultyBand = 'standard' | 'hard' | 'nightmare';
export type ChallengeModifierId = 'sun_edict' | 'blood_moon' | 'oath_debt';
export type LeaderId = 'nocturne_regent' | 'grave_marshal' | 'veil_oracle';

export type StatusId = 'warded' | 'bleeding' | 'dazed' | 'downed';

export interface GridPosition {
  x: number;
  y: number;
}

export interface GridTile extends GridPosition {
  terrain: TerrainKind;
  hazard?: HazardId;
}

export interface StatusState {
  id: StatusId;
  label: string;
  turns: number;
}

export interface AbilityDefinition {
  id: string;
  name: string;
  range: number;
  damage: number;
  description: string;
  status?: Exclude<StatusId, 'downed'>;
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
  hasMoved: boolean;
  downed: boolean;
  commander: boolean;
  abilities: AbilityDefinition[];
  statuses: StatusState[];
}

export interface EnemyIntent {
  enemyId: string;
  targetId: string | null;
  action: 'advance' | 'attack' | 'hold';
  destination?: GridPosition;
  damage?: number;
  status?: Exclude<StatusId, 'downed'>;
  description: string;
}

export interface BattleEvent {
  id: number;
  tone: 'system' | 'player' | 'enemy' | 'objective';
  message: string;
}

export type ObjectiveState =
  | {
      type: 'eliminate_commander';
      commanderId: string;
      description: string;
    }
  | {
      type: 'hold_ritual';
      ritualTiles: GridPosition[];
      heldTurns: number;
      requiredTurns: number;
      description: string;
    }
  | {
      type: 'capture_relic';
      relicTiles: GridPosition[];
      captured: boolean;
      description: string;
    }
  | {
      type: 'survive_dawn';
      survivedTurns: number;
      requiredTurns: number;
      description: string;
    }
  | {
      type: 'escape_route';
      exitTiles: GridPosition[];
      escapedUnitIds: string[];
      requiredEscapes: number;
      description: string;
    }
  | {
      type: 'protect_unit';
      protectedUnitId: string;
      protectedTurns: number;
      requiredTurns: number;
      description: string;
    };

export interface BattleState {
  id: EncounterId;
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
  claimedRelicCaches: string[];
  relicPowerUsed: boolean;
  events: BattleEvent[];
  nextEventId: number;
  result: 'none' | 'victory' | 'defeat';
}

export interface BattleSnapshot {
  version: string;
  currentScreen: AppScreen;
  battle: BattleState | null;
  run: RunState | null;
  rewards: RewardOption[];
  routeEvent: RouteEventState | null;
  meta: MetaProgress;
  content: ContentSummary;
  settings: SettingsState;
  balance: BalanceSummary | null;
}

export interface ContentSummary {
  relics: string[];
  doctrines: RunState['doctrine'][];
  leaders: LeaderDefinition[];
  routeEvents: string[];
  audioCues: string[];
}

export interface LeaderDefinition {
  id: LeaderId;
  title: string;
  doctrine: RunState['doctrine'];
  description: string;
  effect: string;
}

export interface RouteNode {
  id: string;
  tier: number;
  title: string;
  district: 'crypt' | 'market' | 'chapel' | 'canal' | 'wall' | 'palace';
  encounterId: EncounterId;
  risk: 'low' | 'standard' | 'high';
  codex: string;
}

export interface RunState {
  id: string;
  seed: string;
  leader: LeaderId;
  routeSignature: string;
  difficulty: DifficultyBand;
  estimatedMinutes: number;
  currentTier: number;
  route: RouteNode[][];
  completedNodeIds: string[];
  selectedNodeId: string | null;
  resources: {
    blood: number;
    authority: number;
  };
  relics: string[];
  upgrades: string[];
  codexEntries: string[];
  eventHistory: string[];
  challengeModifiers: ChallengeModifierId[];
  doctrine: 'crown' | 'terror' | 'shadow' | 'blood' | 'pact';
  victories: number;
  result: 'active' | 'victory' | 'defeat';
}

export interface RewardOption {
  id: string;
  type: 'resource' | 'relic' | 'doctrine' | 'upgrade';
  title: string;
  description: string;
  comparison: string;
  activeDetail?: string;
}

export interface RouteEventChoice {
  id: string;
  title: string;
  description: string;
  comparison: string;
  activeDetail?: string;
  effects: {
    blood?: number;
    authority?: number;
    doctrine?: RunState['doctrine'];
    relic?: string;
    upgrade?: string;
    challenge?: ChallengeModifierId;
    codex?: string;
  };
}

export interface RouteEventState {
  id: string;
  title: string;
  district: RouteNode['district'];
  tier: number;
  description: string;
  choices: RouteEventChoice[];
}

export interface MetaProgress {
  version: 1;
  completedRuns: number;
  victories: number;
  unlockedRelics: string[];
  lastRunResult: 'none' | 'victory' | 'defeat';
  runHistory: RunHistoryEntry[];
}

export interface RunHistoryEntry {
  id: string;
  result: 'victory' | 'defeat';
  victories: number;
  doctrine: RunState['doctrine'];
  relics: number;
  challenges: number;
  leader: LeaderId;
  difficulty: DifficultyBand;
  seed: string;
  completedAt: string;
}

export interface SettingsState {
  muted: boolean;
  reducedMotion: boolean;
}

export interface BalanceSummary {
  difficulty: DifficultyBand;
  seed: string;
  routeSignature: string;
  estimatedMinutes: number;
  riskCounts: Record<RouteNode['risk'], number>;
  rewardTypes: RewardOption['type'][];
  doctrineOptions: RunState['doctrine'][];
  dominantRiskShare: number;
}
