import Phaser from 'phaser';
import './style.css';
import { installDebugBridge } from './game/debugBridge';
import { empireStore } from './game/app';
import { BattleScene } from './phaser/scenes/BattleScene';
import { BootScene } from './phaser/scenes/BootScene';
import { MenuScene } from './phaser/scenes/MenuScene';
import { EmpireOverlay } from './ui/overlay';

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

new Phaser.Game(config);

const app = document.querySelector<HTMLElement>('#app');
if (app) {
  new EmpireOverlay(app);
}

installDebugBridge(empireStore);
