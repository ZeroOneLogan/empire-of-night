import {
  createRewardsForNode,
  createRouteEventForRun,
  createRun,
  doctrineCatalog,
  leaderCatalog,
  relicCatalog,
  routeEventTitles,
  summarizeBalance,
} from './content/route';
import { playCue } from './audio/cues';
import type { PlayerIntent } from './input/actions';
import { loadMetaProgress, saveMetaProgress } from './persistence/metaProgress';
import { loadSettings, saveSettings } from './persistence/settings';
import {
  attackWithActiveUnit,
  createInitialBattle,
  cycleActiveUnit,
  endPlayerTurn,
  getAttackableTargets,
  getReachableTiles,
  guardWithActiveUnit,
  moveActiveUnit,
  resetBattle,
  selectAction,
  selectUnit,
} from './simulation/battle';
import type {
  AppScreen,
  BattleSnapshot,
  BattleState,
  DifficultyBand,
  EncounterId,
  GridPosition,
  LeaderId,
  MetaProgress,
  PlayerActionType,
  RewardOption,
  RouteEventState,
  RouteNode,
  RunState,
  SettingsState,
  UnitState,
} from './simulation/types';

type Listener = (snapshot: BattleSnapshot) => void;

export class EmpireOfNightStore {
  private screen: AppScreen = 'menu';
  private battle: BattleState | null = null;
  private run: RunState | null = null;
  private rewards: RewardOption[] = [];
  private routeEvent: RouteEventState | null = null;
  private meta: MetaProgress = loadMetaProgress();
  private settings: SettingsState = loadSettings();
  private readonly listeners = new Set<Listener>();

  snapshot(): BattleSnapshot {
    return {
      version: '0.8.0-milestone-8',
      currentScreen: this.screen,
      battle: this.battle ? structuredClone(this.battle) : null,
      run: this.run ? structuredClone(this.run) : null,
      rewards: structuredClone(this.rewards),
      routeEvent: this.routeEvent ? structuredClone(this.routeEvent) : null,
      meta: structuredClone(this.meta),
      content: {
        relics: [...relicCatalog],
        doctrines: [...doctrineCatalog],
        leaders: [...leaderCatalog],
        routeEvents: [...routeEventTitles],
      },
      settings: structuredClone(this.settings),
      balance: this.run ? summarizeBalance(this.run) : null,
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  dispatch(intent: PlayerIntent): void {
    switch (intent.type) {
      case 'startRun':
        this.startRun(intent.seed, intent.difficulty, intent.leader);
        break;
      case 'chooseRouteNode':
        this.chooseRouteNode(intent.nodeId);
        break;
      case 'continueAfterBattle':
        this.continueAfterBattle();
        break;
      case 'chooseReward':
        this.chooseReward(intent.rewardId);
        break;
      case 'chooseRouteEvent':
        this.chooseRouteEvent(intent.choiceId);
        break;
      case 'updateSettings':
        this.updateSettings(intent.settings);
        break;
      case 'startBattle':
        this.startBattle(intent.encounterId);
        break;
      case 'returnToMenu':
        this.returnToMenu();
        break;
      case 'restartBattle':
        this.battle = resetBattle(this.battle?.id, this.run?.difficulty ?? 'standard', this.run);
        this.screen = 'battle';
        this.emit();
        break;
      case 'selectAction':
        this.setAction(intent.action);
        break;
      case 'selectUnit':
        this.selectUnit(intent.unitId);
        break;
      case 'cycleUnit':
        this.cycleUnit();
        break;
      case 'move':
        this.move(intent.position);
        break;
      case 'attack':
        this.attack(intent.targetId);
        break;
      case 'guard':
        this.guard();
        break;
      case 'endTurn':
        this.endTurn();
        break;
    }
  }

  startRun(seed = 'night-0001', difficulty: DifficultyBand = 'standard', leader: LeaderId = 'nocturne_regent'): void {
    this.run = createRun(this.normalizeSeed(seed), difficulty, leader);
    this.battle = null;
    this.rewards = [];
    this.routeEvent = null;
    this.screen = 'route';
    this.play('select');
    this.emit();
  }

  startBattle(encounterId: EncounterId = 'ritual-hold'): void {
    this.run = null;
    this.rewards = [];
    this.routeEvent = null;
    this.battle = createInitialBattle(encounterId);
    this.screen = 'battle';
    this.play('select');
    this.emit();
  }

  chooseRouteNode(nodeId: string): void {
    if (!this.run || this.run.result !== 'active') {
      return;
    }

    const node = this.availableNodes().find((candidate) => candidate.id === nodeId);
    if (!node) {
      return;
    }

    this.run.selectedNodeId = node.id;
    this.battle = createInitialBattle(node.encounterId, this.run.difficulty, this.run);
    this.screen = 'battle';
    this.play('select');
    this.emit();
  }

  continueAfterBattle(): void {
    if (!this.battle) {
      return;
    }

    if (!this.run) {
      this.screen = 'result';
      this.emit();
      return;
    }

    if (this.battle.result === 'defeat') {
      this.finishRun('defeat');
      return;
    }

    const node = this.selectedNode();
    if (this.battle.result === 'victory' && node) {
      this.rewards = createRewardsForNode(node);
      this.screen = 'reward';
      this.play('victory');
      this.emit();
    }
  }

  chooseReward(rewardId: string): void {
    if (!this.run || this.rewards.length === 0) {
      return;
    }

    const reward = this.rewards.find((candidate) => candidate.id === rewardId);
    const node = this.selectedNode();
    if (!reward || !node) {
      return;
    }

    if (reward.type === 'resource') {
      this.run.resources.blood += node.risk === 'high' ? 3 : 2;
      this.run.resources.authority += node.risk === 'low' ? 2 : 1;
    }

    if (reward.type === 'relic') {
      this.run.relics.push(reward.title);
    }

    if (reward.type === 'doctrine') {
      const doctrine = reward.title.split(' ')[0]?.toLowerCase() as RunState['doctrine'];
      this.run.doctrine = doctrine;
    }

    if (reward.type === 'upgrade') {
      this.run.upgrades.push(reward.title);
    }

    this.run.completedNodeIds.push(node.id);
    if (!this.run.codexEntries.includes(node.codex)) {
      this.run.codexEntries.push(node.codex);
    }
    this.run.victories += 1;
    this.run.currentTier += 1;
    this.run.selectedNodeId = null;
    this.battle = null;
    this.rewards = [];
    this.routeEvent = null;

    if (this.run.currentTier >= this.run.route.length) {
      this.finishRun('victory');
      return;
    }

    this.routeEvent = createRouteEventForRun(this.run);
    this.screen = 'event';
    this.play('reward');
    this.emit();
  }

  chooseRouteEvent(choiceId: string): void {
    if (!this.run || !this.routeEvent) {
      return;
    }

    const choice = this.routeEvent.choices.find((candidate) => candidate.id === choiceId);
    if (!choice) {
      return;
    }

    const effects = choice.effects;
    this.run.resources.blood += effects.blood ?? 0;
    this.run.resources.authority += effects.authority ?? 0;
    if (effects.doctrine) {
      this.run.doctrine = effects.doctrine;
    }
    if (effects.relic && !this.run.relics.includes(effects.relic)) {
      this.run.relics.push(effects.relic);
    }
    if (effects.upgrade && !this.run.upgrades.includes(effects.upgrade)) {
      this.run.upgrades.push(effects.upgrade);
    }
    if (effects.challenge && !this.run.challengeModifiers.includes(effects.challenge)) {
      this.run.challengeModifiers.push(effects.challenge);
    }
    if (effects.codex && !this.run.codexEntries.includes(effects.codex)) {
      this.run.codexEntries.push(effects.codex);
    }
    this.run.eventHistory.push(choice.title);
    this.routeEvent = null;
    this.screen = 'route';
    this.play('reward');
    this.emit();
  }

  updateSettings(settings: Partial<SettingsState>): void {
    this.settings = {
      ...this.settings,
      ...settings,
    };
    saveSettings(this.settings);
    this.play('select');
    this.emit();
  }

  returnToMenu(): void {
    this.battle = null;
    this.run = null;
    this.rewards = [];
    this.routeEvent = null;
    this.screen = 'menu';
    this.play('select');
    this.emit();
  }

  setAction(action: PlayerActionType): void {
    if (!this.battle) {
      return;
    }

    this.battle = selectAction(this.battle, action);
    this.play('select');
    this.emit();
  }

  selectUnit(unitId: string): void {
    if (!this.battle) {
      return;
    }

    this.battle = selectUnit(this.battle, unitId);
    this.play('select');
    this.emit();
  }

  cycleUnit(): void {
    if (!this.battle) {
      return;
    }

    this.battle = cycleActiveUnit(this.battle);
    this.play('select');
    this.emit();
  }

  move(position: GridPosition): void {
    if (!this.battle) {
      return;
    }

    this.battle = moveActiveUnit(this.battle, position);
    this.normalizeScreen();
    this.play('move');
    this.emit();
  }

  attack(targetId: string): void {
    if (!this.battle) {
      return;
    }

    this.battle = attackWithActiveUnit(this.battle, targetId);
    this.normalizeScreen();
    this.play('attack');
    this.emit();
  }

  guard(): void {
    if (!this.battle) {
      return;
    }

    this.battle = guardWithActiveUnit(this.battle);
    this.normalizeScreen();
    this.play('guard');
    this.emit();
  }

  endTurn(): void {
    if (!this.battle) {
      return;
    }

    this.battle = endPlayerTurn(this.battle);
    this.normalizeScreen();
    this.play('turn');
    this.emit();
  }

  reachableTiles(): GridPosition[] {
    return this.battle ? getReachableTiles(this.battle) : [];
  }

  attackableTargets(): UnitState[] {
    return this.battle ? getAttackableTargets(this.battle) : [];
  }

  availableNodes(): RouteNode[] {
    if (!this.run) {
      return [];
    }

    return this.run.route[this.run.currentTier] ?? [];
  }

  private selectedNode(): RouteNode | null {
    if (!this.run?.selectedNodeId) {
      return null;
    }

    return this.run.route.flat().find((node) => node.id === this.run?.selectedNodeId) ?? null;
  }

  private finishRun(result: 'victory' | 'defeat'): void {
    if (!this.run) {
      return;
    }

    this.run.result = result;
    this.screen = 'runSummary';
    this.battle = null;
    this.rewards = [];
    this.routeEvent = null;
    this.meta.completedRuns += 1;
    this.meta.lastRunResult = result;
    if (result === 'victory') {
      this.meta.victories += 1;
      for (const relic of this.run.relics) {
        if (!this.meta.unlockedRelics.includes(relic)) {
          this.meta.unlockedRelics.push(relic);
        }
      }
    }
    this.meta.runHistory = [
      {
        id: this.run.id,
        result,
        victories: this.run.victories,
        doctrine: this.run.doctrine,
        relics: this.run.relics.length,
        challenges: this.run.challengeModifiers.length,
        leader: this.run.leader,
        difficulty: this.run.difficulty,
        seed: this.run.seed,
        completedAt: new Date().toISOString(),
      },
      ...this.meta.runHistory,
    ].slice(0, 8);
    saveMetaProgress(this.meta);
    this.play(result === 'victory' ? 'victory' : 'defeat');
    this.emit();
  }

  private normalizeScreen(): void {
    if (!this.battle) {
      return;
    }

    if (this.battle.phase === 'victory') {
      this.screen = 'result';
    }

    if (this.battle.phase === 'defeat') {
      this.screen = this.run ? 'runSummary' : 'result';
      if (this.run) {
        this.finishRun('defeat');
      }
    }
  }

  private normalizeSeed(seed: string): string {
    const normalized = seed.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 28);
    return normalized || 'night-0001';
  }

  private emit(): void {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  private play(cue: Parameters<typeof playCue>[0]): void {
    playCue(cue, this.settings.muted);
  }
}

export const empireStore = new EmpireOfNightStore();
