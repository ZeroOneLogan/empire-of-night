import Phaser from 'phaser';
import { empireStore } from '../../game/app';
import { unitTokenKey } from '../../game/assets/manifest';

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
    mist.fillStyle(0x190d14, 0.82);
    mist.fillRoundedRect(102, 76, width - 204, height - 138, 24);
    mist.fillStyle(0x31151f, 0.42);
    mist.fillEllipse(width * 0.48, height * 0.44, 620, 250);
    mist.lineStyle(2, 0x9f7d45, 0.62);
    mist.strokeRoundedRect(94, 68, width - 188, height - 116, 24);
    mist.lineStyle(1, 0xe5be70, 0.22);
    mist.strokeRoundedRect(112, 88, width - 224, height - 156, 18);

    this.drawCommandMap(width, height);
    this.drawCourtTokens(width, height);
    this.drawDawnThreat(width, height);

    this.add
      .text(width / 2, 98, 'Empire of Night', {
        color: '#f2e1c2',
        fontFamily: 'Georgia, serif',
        fontSize: '50px',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 154, 'A tactical roguelite command table', {
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

  private drawCommandMap(width: number, height: number): void {
    const map = this.add.graphics();
    const centerX = width * 0.4;
    const centerY = height * 0.55;
    map.fillStyle(0x0b0d12, 0.72);
    map.fillRoundedRect(centerX - 285, centerY - 115, 570, 245, 18);
    map.lineStyle(1, 0x6f5a39, 0.48);
    map.strokeRoundedRect(centerX - 285, centerY - 115, 570, 245, 18);

    const nodes = [
      { x: centerX - 218, y: centerY + 48, district: 'Crypt', risk: 0x769d87 },
      { x: centerX - 90, y: centerY - 26, district: 'Canal', risk: 0x9fb8bd },
      { x: centerX + 44, y: centerY + 40, district: 'Wall', risk: 0xe5be70 },
      { x: centerX + 184, y: centerY - 34, district: 'Palace', risk: 0xc43f5f },
    ];

    map.lineStyle(4, 0x2a1c21, 0.92);
    for (let index = 0; index < nodes.length - 1; index += 1) {
      map.lineBetween(nodes[index].x, nodes[index].y, nodes[index + 1].x, nodes[index + 1].y);
    }
    map.lineStyle(1, 0xe5be70, 0.56);
    for (let index = 0; index < nodes.length - 1; index += 1) {
      map.lineBetween(nodes[index].x, nodes[index].y, nodes[index + 1].x, nodes[index + 1].y);
    }

    for (const node of nodes) {
      map.fillStyle(0x141017, 1);
      map.fillCircle(node.x, node.y, 26);
      map.lineStyle(3, node.risk, 0.88);
      map.strokeCircle(node.x, node.y, 27);
      map.lineStyle(1, 0xfff0b1, 0.42);
      map.strokeCircle(node.x, node.y, 34);
      this.add
        .text(node.x, node.y + 44, node.district, {
          color: '#e6d3ad',
          fontFamily: 'Georgia, serif',
          fontSize: '13px',
        })
        .setOrigin(0.5);
    }

    this.add
      .text(centerX, centerY - 132, 'Tonight\'s route crosses four districts before dawn.', {
        color: '#d7aa62',
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
      })
      .setOrigin(0.5);
  }

  private drawCourtTokens(width: number, height: number): void {
    const y = height * 0.75;
    const tokens = [
      { archetype: 'regent' as const, x: width * 0.32, label: 'Regent' },
      { archetype: 'knight' as const, x: width * 0.43, label: 'Knight' },
      { archetype: 'occultist' as const, x: width * 0.54, label: 'Occultist' },
    ];

    for (const token of tokens) {
      this.add.image(token.x, y, unitTokenKey(token.archetype)).setDisplaySize(68, 68);
      this.add
        .text(token.x, y + 50, token.label, {
          color: '#ead9b8',
          fontFamily: 'Georgia, serif',
          fontSize: '13px',
        })
        .setOrigin(0.5);
    }
  }

  private drawDawnThreat(width: number, height: number): void {
    const x = width * 0.6;
    const y = height * 0.38;
    const ring = this.add.graphics();
    ring.lineStyle(2, 0xe5be70, 0.45);
    ring.strokeCircle(x, y, 51);
    ring.lineStyle(1, 0xc43f5f, 0.6);
    ring.strokeCircle(x, y, 60);
    this.add.image(x, y, unitTokenKey('dawn_exarch')).setDisplaySize(86, 86).setAlpha(0.9);
    this.add
      .text(x, y + 72, 'Dawn Exarch', {
        color: '#e9c273',
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
      })
      .setOrigin(0.5);
  }
}
