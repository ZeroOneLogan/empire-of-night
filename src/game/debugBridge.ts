import type { EmpireOfNightStore } from './app';
import type { DifficultyBand, EncounterId, GridPosition, LeaderId, PlayerActionType, SettingsState } from './simulation/types';

declare global {
  interface Window {
    __empireOfNight?: {
      version: string;
      snapshot: () => ReturnType<EmpireOfNightStore['snapshot']>;
      startRun: (seed?: string, difficulty?: DifficultyBand, leader?: LeaderId) => void;
      chooseRouteNode: (nodeId: string) => void;
      continueAfterBattle: () => void;
      chooseReward: (rewardId: string) => void;
      chooseRouteEvent: (choiceId: string) => void;
      updateSettings: (settings: Partial<SettingsState>) => void;
      startBattle: (encounterId?: EncounterId) => void;
      returnToMenu: () => void;
      restartBattle: () => void;
      selectAction: (action: PlayerActionType) => void;
      selectUnit: (unitId: string) => void;
      cycleUnit: () => void;
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
    version: '0.8.0-milestone-8',
    snapshot: () => store.snapshot(),
    startRun: (seed, difficulty, leader) => store.dispatch({ type: 'startRun', seed, difficulty, leader }),
    chooseRouteNode: (nodeId) => store.dispatch({ type: 'chooseRouteNode', nodeId }),
    continueAfterBattle: () => store.dispatch({ type: 'continueAfterBattle' }),
    chooseReward: (rewardId) => store.dispatch({ type: 'chooseReward', rewardId }),
    chooseRouteEvent: (choiceId) => store.dispatch({ type: 'chooseRouteEvent', choiceId }),
    updateSettings: (settings) => store.dispatch({ type: 'updateSettings', settings }),
    startBattle: (encounterId) => store.dispatch({ type: 'startBattle', encounterId }),
    returnToMenu: () => store.dispatch({ type: 'returnToMenu' }),
    restartBattle: () => store.dispatch({ type: 'restartBattle' }),
    selectAction: (action) => store.dispatch({ type: 'selectAction', action }),
    selectUnit: (unitId) => store.dispatch({ type: 'selectUnit', unitId }),
    cycleUnit: () => store.dispatch({ type: 'cycleUnit' }),
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
