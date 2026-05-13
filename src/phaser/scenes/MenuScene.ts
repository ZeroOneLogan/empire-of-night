import Phaser from 'phaser';
import { empireStore } from '../../game/app';

export class MenuScene extends Phaser.Scene {
  private unsubscribe?: () => void;

  constructor() {
    super('menu');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#07070b');

    const mist = this.add.graphics();
    mist.fillGradientStyle(0x15121b, 0x15121b, 0x06070b, 0x06070b, 1);
    mist.fillRect(0, 0, width, height);
    mist.fillStyle(0x31151f, 0.5);
    mist.fillEllipse(width * 0.5, height * 0.42, 640, 240);
    mist.lineStyle(2, 0x9f7d45, 0.55);
    mist.strokeRoundedRect(94, 78, width - 188, height - 156, 24);

    this.add
      .text(width / 2, 144, 'Empire of Night', {
        color: '#f2e1c2',
        fontFamily: 'Georgia, serif',
        fontSize: '58px',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 208, 'A tactical roguelite command table', {
        color: '#b8a88d',
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
      })
      .setOrigin(0.5);

    this.unsubscribe = empireStore.subscribe((snapshot) => {
      if (snapshot.currentScreen === 'battle') {
        this.scene.start('battle');
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = undefined;
    });
  }
}
