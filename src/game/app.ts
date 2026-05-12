import type { PlayerIntent } from './input/actions';
import {
  attackWithActiveUnit,
  createInitialBattle,
  endPlayerTurn,
  getAttackableTargets,
  getReachableTiles,
  guardWithActiveUnit,
  moveActiveUnit,
  resetBattle,
  selectAction,
} from './simulation/battle';
import type { BattleSnapshot, BattleState, GridPosition, PlayerActionType, UnitState } from './simulation/types';

type ScreenState = 'menu' | 'battle' | 'result';

type Listener = (snapshot: BattleSnapshot) => void;

export class EmpireOfNightStore {
  private screen: ScreenState = 'menu';
  private battle: BattleState | null = null;
  private readonly listeners = new Set<Listener>();

  snapshot(): BattleSnapshot {
    return {
      version: '0.1.0-milestone-1',
      currentScreen: this.screen,
      battle: this.battle ? structuredClone(this.battle) : null,
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  dispatch(intent: PlayerIntent): void {
    switch (intent.type) {
      case 'startBattle':
        this.startBattle();
        break;
      case 'returnToMenu':
        this.returnToMenu();
        break;
      case 'restartBattle':
        this.battle = resetBattle();
        this.screen = 'battle';
        this.emit();
        break;
      case 'selectAction':
        this.setAction(intent.action);
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

  startBattle(): void {
    this.battle = createInitialBattle();
    this.screen = 'battle';
    this.emit();
  }

  returnToMenu(): void {
    this.battle = null;
    this.screen = 'menu';
    this.emit();
  }

  setAction(action: PlayerActionType): void {
    if (!this.battle) {
      return;
    }

    this.battle = selectAction(this.battle, action);
    this.emit();
  }

  move(position: GridPosition): void {
    if (!this.battle) {
      return;
    }

    this.battle = moveActiveUnit(this.battle, position);
    this.normalizeScreen();
    this.emit();
  }

  attack(targetId: string): void {
    if (!this.battle) {
      return;
    }

    this.battle = attackWithActiveUnit(this.battle, targetId);
    this.normalizeScreen();
    this.emit();
  }

  guard(): void {
    if (!this.battle) {
      return;
    }

    this.battle = guardWithActiveUnit(this.battle);
    this.normalizeScreen();
    this.emit();
  }

  endTurn(): void {
    if (!this.battle) {
      return;
    }

    this.battle = endPlayerTurn(this.battle);
    this.normalizeScreen();
    this.emit();
  }

  reachableTiles(): GridPosition[] {
    return this.battle ? getReachableTiles(this.battle) : [];
  }

  attackableTargets(): UnitState[] {
    return this.battle ? getAttackableTargets(this.battle) : [];
  }

  private normalizeScreen(): void {
    if (this.battle?.phase === 'victory' || this.battle?.phase === 'defeat') {
      this.screen = 'result';
    }
  }

  private emit(): void {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

export const empireStore = new EmpireOfNightStore();
