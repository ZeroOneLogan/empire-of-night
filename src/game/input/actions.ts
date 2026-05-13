import type { DifficultyBand, EncounterId, GridPosition, LeaderId, PlayerActionType, SettingsState } from '../simulation/types';

export type PlayerIntent =
  | { type: 'startRun'; seed?: string; difficulty?: DifficultyBand; leader?: LeaderId }
  | { type: 'chooseRouteNode'; nodeId: string }
  | { type: 'continueAfterBattle' }
  | { type: 'chooseReward'; rewardId: string }
  | { type: 'chooseRouteEvent'; choiceId: string }
  | { type: 'updateSettings'; settings: Partial<SettingsState> }
  | { type: 'selectAction'; action: PlayerActionType }
  | { type: 'selectUnit'; unitId: string }
  | { type: 'cycleUnit' }
  | { type: 'move'; position: GridPosition }
  | { type: 'attack'; targetId: string }
  | { type: 'guard' }
  | { type: 'endTurn' }
  | { type: 'restartBattle' }
  | { type: 'startBattle'; encounterId?: EncounterId }
  | { type: 'returnToMenu' };
