import Phaser from 'phaser';
import { BattleScene } from './scenes/BattleScene';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';

export const createPhaserGame = (): Phaser.Game => {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'app',
    width: 960,
    height: 640,
    backgroundColor: '#07070b',
    scene: [BootScene, MenuScene, BattleScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };

  return new Phaser.Game(config);
};
