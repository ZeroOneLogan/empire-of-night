import './style.css';
import { installDebugBridge } from './game/debugBridge';
import { empireStore } from './game/app';
import { EmpireOverlay } from './ui/overlay';

const app = document.querySelector<HTMLElement>('#app');
if (app) {
  new EmpireOverlay(app);
}

installDebugBridge(empireStore);

void import('./phaser/createPhaserGame').then(({ createPhaserGame }) => {
  createPhaserGame();
});
