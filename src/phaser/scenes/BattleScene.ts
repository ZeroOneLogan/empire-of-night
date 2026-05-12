import Phaser from 'phaser';
import { empireStore } from '../../game/app';
import type { BattleSnapshot } from '../../game/simulation/types';
import { BattleRenderer, screenToGrid } from '../view/battleRenderer';

export class BattleScene extends Phaser.Scene {
  private renderer?: BattleRenderer;
  private unsubscribe?: () => void;
  private latestSnapshot?: BattleSnapshot;

  constructor() {
    super('battle');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#07070b');
    this.renderer = new BattleRenderer(this);
    this.unsubscribe = empireStore.subscribe((snapshot) => {
      this.latestSnapshot = snapshot;
      if (snapshot.currentScreen === 'menu') {
        this.scene.start('menu');
        return;
      }

      if (snapshot.battle) {
        this.renderer?.render(snapshot.battle);
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const battle = this.latestSnapshot?.battle;
      if (!battle || battle.phase !== 'player') {
        return;
      }

      const position = screenToGrid(pointer.x, pointer.y);
      if (!position) {
        return;
      }

      const unit = battle.units.find(
        (candidate) => candidate.hp > 0 && candidate.position.x === position.x && candidate.position.y === position.y,
      );

      if (battle.selectedAction === 'attack' && unit?.faction === 'dawn') {
        empireStore.dispatch({ type: 'attack', targetId: unit.id });
        return;
      }

      if (battle.selectedAction === 'move') {
        empireStore.dispatch({ type: 'move', position });
      }
    });

    this.input.keyboard?.on('keydown-ONE', () => empireStore.dispatch({ type: 'selectAction', action: 'move' }));
    this.input.keyboard?.on('keydown-TWO', () => empireStore.dispatch({ type: 'selectAction', action: 'attack' }));
    this.input.keyboard?.on('keydown-THREE', () => empireStore.dispatch({ type: 'guard' }));
    this.input.keyboard?.on('keydown-SPACE', () => empireStore.dispatch({ type: 'endTurn' }));
    this.input.keyboard?.on('keydown-ESC', () => empireStore.dispatch({ type: 'returnToMenu' }));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = undefined;
      this.input.keyboard?.removeAllListeners();
    });
  }
}
