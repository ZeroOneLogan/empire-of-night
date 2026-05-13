import Phaser from 'phaser';
import { unitTokenAssets } from '../../game/assets/manifest';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    for (const asset of unitTokenAssets) {
      this.load.svg(asset.key, asset.path, { width: 96, height: 96 });
    }
  }

  create(): void {
    this.scene.start('menu');
  }
}
