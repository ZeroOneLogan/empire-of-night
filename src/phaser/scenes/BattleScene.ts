import Phaser from 'phaser';
import { empireStore } from '../../game/app';
import type { BattleSnapshot, GridPosition } from '../../game/simulation/types';
import { BattleRenderer, screenToGrid } from '../view/battleRenderer';

export class BattleScene extends Phaser.Scene {
  private renderer?: BattleRenderer;
  private unsubscribe?: () => void;
  private latestSnapshot?: BattleSnapshot;
  private hoveredGrid: GridPosition | null = null;
  private readonly handlePointerMove = (pointer: Phaser.Input.Pointer): void => {
    const battle = this.latestSnapshot?.battle;
    if (!battle || battle.phase !== 'player') {
      this.setHoveredGrid(null);
      return;
    }

    this.setHoveredGrid(screenToGrid(pointer.x, pointer.y, battle));
  };
  private readonly handlePointerUp = (pointer: Phaser.Input.Pointer): void => {
    const battle = this.latestSnapshot?.battle;
    if (!battle || battle.phase !== 'player') {
      return;
    }

    const position = screenToGrid(pointer.x, pointer.y, battle);
    if (!position) {
      return;
    }

    const unit = battle.units.find(
      (candidate) => candidate.hp > 0 && candidate.position.x === position.x && candidate.position.y === position.y,
    );

    const active = battle.units.find((candidate) => candidate.id === battle.activeUnitId);
    if (
      battle.selectedAction === 'interact' &&
      active &&
      active.position.x === position.x &&
      active.position.y === position.y
    ) {
      empireStore.dispatch({ type: 'interact' });
      return;
    }

    if (unit?.faction === 'court') {
      empireStore.dispatch({ type: 'selectUnit', unitId: unit.id });
      return;
    }

    if ((battle.selectedAction === 'attack' || battle.selectedAction === 'special') && unit?.faction === 'dawn') {
      empireStore.dispatch({ type: 'attack', targetId: unit.id });
      return;
    }

    if (battle.selectedAction === 'move') {
      empireStore.dispatch({ type: 'move', position });
    }
  };
  private readonly selectMove = (): void => empireStore.dispatch({ type: 'selectAction', action: 'move' });
  private readonly selectAttack = (): void => empireStore.dispatch({ type: 'selectAction', action: 'attack' });
  private readonly selectSpecial = (): void => empireStore.dispatch({ type: 'selectAction', action: 'special' });
  private readonly selectInteract = (): void => empireStore.dispatch({ type: 'selectAction', action: 'interact' });
  private readonly selectOrUseRelic = (): void => {
    if (this.latestSnapshot?.battle?.selectedAction === 'relic') {
      empireStore.dispatch({ type: 'useRelic' });
      return;
    }
    empireStore.dispatch({ type: 'selectAction', action: 'relic' });
  };
  private readonly guard = (): void => empireStore.dispatch({ type: 'guard' });
  private readonly cycleUnit = (): void => empireStore.dispatch({ type: 'cycleUnit' });
  private readonly endTurn = (): void => empireStore.dispatch({ type: 'endTurn' });
  private readonly returnToMenu = (): void => empireStore.dispatch({ type: 'returnToMenu' });

  constructor() {
    super('battle');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#07070b');
    this.renderer = new BattleRenderer(this);
    this.unsubscribe = empireStore.subscribe((snapshot) => {
      this.latestSnapshot = snapshot;
      if (!['battle', 'result', 'reward'].includes(snapshot.currentScreen)) {
        this.hoveredGrid = null;
        this.scene.start('menu');
        return;
      }

      if (snapshot.battle) {
        this.renderer?.render(snapshot.battle, this.hoveredGrid);
      }
    });

    this.input.on('pointermove', this.handlePointerMove);
    this.input.on('pointerup', this.handlePointerUp);
    this.input.keyboard?.on('keydown-ONE', this.selectMove);
    this.input.keyboard?.on('keydown-TWO', this.selectAttack);
    this.input.keyboard?.on('keydown-FOUR', this.selectSpecial);
    this.input.keyboard?.on('keydown-FIVE', this.selectInteract);
    this.input.keyboard?.on('keydown-R', this.selectOrUseRelic);
    this.input.keyboard?.on('keydown-THREE', this.guard);
    this.input.keyboard?.on('keydown-TAB', this.cycleUnit);
    this.input.keyboard?.on('keydown-SPACE', this.endTurn);
    this.input.keyboard?.on('keydown-ESC', this.returnToMenu);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = undefined;
      this.input.off('pointermove', this.handlePointerMove);
      this.input.off('pointerup', this.handlePointerUp);
      this.input.keyboard?.off('keydown-ONE', this.selectMove);
      this.input.keyboard?.off('keydown-TWO', this.selectAttack);
      this.input.keyboard?.off('keydown-FOUR', this.selectSpecial);
      this.input.keyboard?.off('keydown-FIVE', this.selectInteract);
      this.input.keyboard?.off('keydown-R', this.selectOrUseRelic);
      this.input.keyboard?.off('keydown-THREE', this.guard);
      this.input.keyboard?.off('keydown-TAB', this.cycleUnit);
      this.input.keyboard?.off('keydown-SPACE', this.endTurn);
      this.input.keyboard?.off('keydown-ESC', this.returnToMenu);
      this.renderer?.destroy();
      this.renderer = undefined;
      this.latestSnapshot = undefined;
      this.hoveredGrid = null;
    });
  }

  private setHoveredGrid(position: GridPosition | null): void {
    if (
      (position === null && this.hoveredGrid === null) ||
      (position !== null &&
        this.hoveredGrid !== null &&
        position.x === this.hoveredGrid.x &&
        position.y === this.hoveredGrid.y)
    ) {
      return;
    }

    this.hoveredGrid = position;
    if (this.latestSnapshot?.battle) {
      this.renderer?.render(this.latestSnapshot.battle, this.hoveredGrid);
    }
  }
}
