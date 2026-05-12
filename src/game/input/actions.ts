import type { GridPosition, PlayerActionType } from '../simulation/types';

export type PlayerIntent =
  | { type: 'selectAction'; action: PlayerActionType }
  | { type: 'move'; position: GridPosition }
  | { type: 'attack'; targetId: string }
  | { type: 'guard' }
  | { type: 'endTurn' }
  | { type: 'restartBattle' }
  | { type: 'startBattle' }
  | { type: 'returnToMenu' };
