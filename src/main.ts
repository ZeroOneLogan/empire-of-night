import Phaser from 'phaser';
import './style.css';

class MainScene extends Phaser.Scene {
  constructor() {
    super('main');
  }

  create() {
    this.add.text(16, 16, 'Empire of Night', {
      color: '#ffffff',
      fontSize: '24px',
    });
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  scene: [MainScene],
};

new Phaser.Game(config);
