import Phaser from 'phaser';
import { getAttackableTargets, getReachableTiles } from '../../game/simulation/battle';
import type { BattleState, GridPosition, UnitState } from '../../game/simulation/types';

export const boardMetrics = {
  originX: 72,
  originY: 88,
  tileSize: 68,
};

const tileKey = (position: GridPosition) => `${position.x},${position.y}`;

export const screenToGrid = (x: number, y: number): GridPosition | null => {
  const gridX = Math.floor((x - boardMetrics.originX) / boardMetrics.tileSize);
  const gridY = Math.floor((y - boardMetrics.originY) / boardMetrics.tileSize);

  if (gridX < 0 || gridY < 0 || gridX >= 7 || gridY >= 6) {
    return null;
  }

  return { x: gridX, y: gridY };
};

export class BattleRenderer {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly labels: Phaser.GameObjects.Text[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    this.graphics = scene.add.graphics();
  }

  render(state: BattleState): void {
    this.graphics.clear();
    for (const label of this.labels) {
      label.destroy();
    }
    this.labels.length = 0;

    const reachable = new Set(getReachableTiles(state).map(tileKey));
    const targets = new Set(getAttackableTargets(state).map((unit) => unit.id));

    this.drawBackdrop();
    this.drawTiles(state, reachable);
    this.drawUnits(state, targets);
    this.drawIntentLines(state);
  }

  private drawBackdrop(): void {
    const { originX, originY, tileSize } = boardMetrics;
    this.graphics.fillStyle(0x07070b, 0.88);
    this.graphics.fillRoundedRect(originX - 22, originY - 22, tileSize * 7 + 44, tileSize * 6 + 44, 18);
    this.graphics.lineStyle(2, 0x7d6034, 0.7);
    this.graphics.strokeRoundedRect(originX - 22, originY - 22, tileSize * 7 + 44, tileSize * 6 + 44, 18);
  }

  private drawTiles(state: BattleState, reachable: Set<string>): void {
    const { originX, originY, tileSize } = boardMetrics;

    for (const tile of state.tiles) {
      const x = originX + tile.x * tileSize;
      const y = originY + tile.y * tileSize;
      const isReachable = reachable.has(tileKey(tile));
      const baseColor = tile.terrain === 'obstacle' ? 0x15131a : tile.terrain === 'ritual' ? 0x211927 : 0x10131a;
      const fillColor = isReachable && state.selectedAction === 'move' ? 0x203942 : baseColor;

      this.graphics.fillStyle(fillColor, 1);
      this.graphics.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

      if (tile.terrain === 'ritual') {
        this.graphics.lineStyle(2, 0x8e2542, 0.7);
        this.graphics.strokeCircle(x + tileSize / 2, y + tileSize / 2, 18);
      }

      if (tile.terrain === 'obstacle') {
        this.graphics.fillStyle(0x403224, 0.72);
        this.graphics.fillRect(x + 16, y + 14, tileSize - 32, tileSize - 28);
      }

      this.graphics.lineStyle(1, 0x6b705f, isReachable ? 0.68 : 0.22);
      this.graphics.strokeRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
    }
  }

  private drawUnits(state: BattleState, targets: Set<string>): void {
    for (const unit of state.units.filter((candidate) => candidate.hp > 0)) {
      this.drawUnit(unit, targets.has(unit.id), unit.id === state.activeUnitId);
    }
  }

  private drawUnit(unit: UnitState, isTarget: boolean, isActive: boolean): void {
    const { originX, originY, tileSize } = boardMetrics;
    const centerX = originX + unit.position.x * tileSize + tileSize / 2;
    const centerY = originY + unit.position.y * tileSize + tileSize / 2;
    const baseColor = unit.faction === 'court' ? 0x9c2442 : 0xd4a957;
    const ringColor = unit.faction === 'court' ? 0xe7d7bd : 0xffef9d;

    this.graphics.fillStyle(0x000000, 0.35);
    this.graphics.fillEllipse(centerX + 1, centerY + 19, 44, 12);
    this.graphics.lineStyle(isActive ? 4 : 2, ringColor, isActive ? 1 : 0.7);
    this.graphics.fillStyle(baseColor, 1);
    this.graphics.fillCircle(centerX, centerY, 20);
    this.graphics.strokeCircle(centerX, centerY, 22);

    if (unit.faction === 'court') {
      this.graphics.fillStyle(0x1c0b14, 1);
      this.graphics.fillTriangle(centerX, centerY - 19, centerX - 12, centerY + 10, centerX + 12, centerY + 10);
    } else {
      this.graphics.fillStyle(0x3d2c15, 1);
      this.graphics.fillRect(centerX - 11, centerY - 15, 22, 30);
    }

    if (isTarget) {
      this.graphics.lineStyle(3, 0xfff0b1, 0.95);
      this.graphics.strokeCircle(centerX, centerY, 29);
    }

    this.graphics.fillStyle(0x181015, 0.92);
    this.graphics.fillRoundedRect(centerX - 28, centerY + 26, 56, 10, 4);
    this.graphics.fillStyle(unit.faction === 'court' ? 0xc43f5f : 0xe6b44d, 1);
    this.graphics.fillRoundedRect(centerX - 26, centerY + 28, Math.max(0, 52 * (unit.hp / unit.maxHp)), 6, 3);

    const label = this.scene.add.text(centerX, centerY - 38, unit.name.split(' ')[0], {
      color: '#eadfc7',
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
    });
    label.setOrigin(0.5);
    this.labels.push(label);
  }

  private drawIntentLines(state: BattleState): void {
    const { originX, originY, tileSize } = boardMetrics;
    for (const intent of state.enemyIntents) {
      const enemy = state.units.find((unit) => unit.id === intent.enemyId);
      const target = state.units.find((unit) => unit.id === intent.targetId);
      if (!enemy || !target || enemy.hp <= 0 || target.hp <= 0) {
        continue;
      }

      const fromX = originX + enemy.position.x * tileSize + tileSize / 2;
      const fromY = originY + enemy.position.y * tileSize + tileSize / 2;
      const toX = originX + target.position.x * tileSize + tileSize / 2;
      const toY = originY + target.position.y * tileSize + tileSize / 2;
      this.graphics.lineStyle(2, intent.action === 'attack' ? 0xf6d77a : 0x8293a3, 0.62);
      this.graphics.lineBetween(fromX, fromY, toX, toY);
    }
  }
}
