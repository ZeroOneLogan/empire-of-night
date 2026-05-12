import type { EmpireOfNightStore } from './app';
import type { GridPosition, PlayerActionType } from './simulation/types';

declare global {
  interface Window {
    __empireOfNight?: {
      version: string;
      snapshot: () => ReturnType<EmpireOfNightStore['snapshot']>;
      startBattle: () => void;
      returnToMenu: () => void;
      restartBattle: () => void;
      selectAction: (action: PlayerActionType) => void;
      move: (position: GridPosition) => void;
      attack: (targetId: string) => void;
      guard: () => void;
      endTurn: () => void;
      reachableTiles: () => GridPosition[];
      attackableTargets: () => Array<{ id: string; name: string; hp: number }>;
    };
  }
}

export const installDebugBridge = (store: EmpireOfNightStore): void => {
  if (!import.meta.env.DEV) {
    return;
  }

  window.__empireOfNight = {
    version: '0.1.0-milestone-1',
    snapshot: () => store.snapshot(),
    startBattle: () => store.dispatch({ type: 'startBattle' }),
    returnToMenu: () => store.dispatch({ type: 'returnToMenu' }),
    restartBattle: () => store.dispatch({ type: 'restartBattle' }),
    selectAction: (action) => store.dispatch({ type: 'selectAction', action }),
    move: (position) => store.dispatch({ type: 'move', position }),
    attack: (targetId) => store.dispatch({ type: 'attack', targetId }),
    guard: () => store.dispatch({ type: 'guard' }),
    endTurn: () => store.dispatch({ type: 'endTurn' }),
    reachableTiles: () => store.reachableTiles(),
    attackableTargets: () =>
      store.attackableTargets().map((unit) => ({
        id: unit.id,
        name: unit.name,
        hp: unit.hp,
      })),
  };
};
