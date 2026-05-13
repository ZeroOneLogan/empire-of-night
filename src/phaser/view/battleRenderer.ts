import Phaser from 'phaser';
import { getAttackableTargets, getReachableTiles } from '../../game/simulation/battle';
import type { BattleState, GridPosition, UnitArchetype, UnitState } from '../../game/simulation/types';

export const boardMetrics = {
  originX: 72,
  originY: 88,
  tileSize: 68,
};

const tileKey = (position: GridPosition) => `${position.x},${position.y}`;

export const screenToGrid = (x: number, y: number, state: Pick<BattleState, 'gridWidth' | 'gridHeight'>): GridPosition | null => {
  const gridX = Math.floor((x - boardMetrics.originX) / boardMetrics.tileSize);
  const gridY = Math.floor((y - boardMetrics.originY) / boardMetrics.tileSize);

  if (gridX < 0 || gridY < 0 || gridX >= state.gridWidth || gridY >= state.gridHeight) {
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

  destroy(): void {
    this.graphics.destroy();
    for (const label of this.labels) {
      label.destroy();
    }
    this.labels.length = 0;
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
      const isHeld =
        state.objective.type === 'hold_ritual' && state.objective.ritualTiles.some((ritual) => tileKey(ritual) === tileKey(tile));
      const baseColor = tile.terrain === 'obstacle' ? 0x15131a : tile.terrain === 'ritual' ? 0x211927 : 0x10131a;
      const hazardColor = this.hazardColor(tile.hazard);
      const fillColor = isReachable && state.selectedAction === 'move' ? 0x203942 : hazardColor ?? (isHeld ? 0x2c1528 : baseColor);

      this.graphics.fillStyle(fillColor, 1);
      this.graphics.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

      if (tile.terrain === 'ritual') {
        this.graphics.lineStyle(2, 0xc13f6a, 0.86);
        this.graphics.strokeCircle(x + tileSize / 2, y + tileSize / 2, 18);
        this.graphics.lineStyle(1, 0xd9b56c, 0.5);
        this.graphics.strokeCircle(x + tileSize / 2, y + tileSize / 2, 26);
      }

      if (tile.terrain === 'obstacle') {
        this.graphics.fillStyle(0x403224, 0.72);
        this.graphics.fillRect(x + 16, y + 14, tileSize - 32, tileSize - 28);
      }

      if (tile.hazard) {
        this.graphics.lineStyle(2, this.hazardStroke(tile.hazard), 0.68);
        this.graphics.strokeRect(x + 10, y + 10, tileSize - 20, tileSize - 20);
      }

      this.graphics.lineStyle(1, 0x6b705f, isReachable ? 0.68 : 0.22);
      this.graphics.strokeRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
    }
  }

  private drawUnits(state: BattleState, targets: Set<string>): void {
    for (const unit of state.units.filter((candidate) => !candidate.downed)) {
      this.drawUnit(unit, targets.has(unit.id), unit.id === state.activeUnitId);
    }
  }

  private drawUnit(unit: UnitState, isTarget: boolean, isActive: boolean): void {
    const { originX, originY, tileSize } = boardMetrics;
    const centerX = originX + unit.position.x * tileSize + tileSize / 2;
    const centerY = originY + unit.position.y * tileSize + tileSize / 2;
    const baseColor = this.unitColor(unit.archetype);
    const ringColor = unit.faction === 'court' ? 0xe7d7bd : 0xffef9d;

    this.graphics.fillStyle(0x000000, 0.35);
    this.graphics.fillEllipse(centerX + 1, centerY + 19, 44, 12);
    this.graphics.lineStyle(isActive ? 4 : 2, ringColor, isActive ? 1 : 0.7);
    this.graphics.fillStyle(baseColor, 1);
    this.graphics.fillCircle(centerX, centerY, 20);
    this.graphics.strokeCircle(centerX, centerY, 22);

    if (unit.archetype === 'regent') {
      this.graphics.fillStyle(0x1c0b14, 1);
      this.graphics.fillTriangle(centerX, centerY - 19, centerX - 12, centerY + 10, centerX + 12, centerY + 10);
    } else if (unit.archetype === 'knight') {
      this.graphics.fillStyle(0x20151a, 1);
      this.graphics.fillRoundedRect(centerX - 12, centerY - 16, 24, 32, 4);
      this.graphics.lineStyle(2, 0xd9c7a1, 0.75);
      this.graphics.lineBetween(centerX - 13, centerY - 3, centerX + 13, centerY - 3);
    } else if (unit.archetype === 'occultist') {
      this.graphics.fillStyle(0x170d22, 1);
      this.graphics.fillCircle(centerX, centerY, 9);
      this.graphics.lineStyle(2, 0xd6a0ff, 0.8);
      this.graphics.strokeTriangle(centerX, centerY - 17, centerX - 14, centerY + 11, centerX + 14, centerY + 11);
    } else if (unit.archetype === 'sun_acolyte') {
      this.graphics.fillStyle(0x4a3517, 1);
      this.graphics.fillCircle(centerX, centerY, 12);
      this.graphics.lineStyle(2, 0xffef9d, 0.85);
      this.graphics.strokeCircle(centerX, centerY, 16);
    } else if (unit.archetype === 'lantern_marksman') {
      this.graphics.fillStyle(0x2a2f24, 1);
      this.graphics.fillTriangle(centerX, centerY - 16, centerX - 13, centerY + 13, centerX + 13, centerY + 13);
      this.graphics.fillStyle(0xe8d07b, 1);
      this.graphics.fillCircle(centerX + 9, centerY - 8, 4);
    } else if (unit.archetype === 'bell_warden') {
      this.graphics.fillStyle(0x3f3428, 1);
      this.graphics.fillRoundedRect(centerX - 14, centerY - 16, 28, 32, 8);
      this.graphics.lineStyle(2, 0xd8bd78, 0.8);
      this.graphics.strokeCircle(centerX, centerY, 14);
    } else if (unit.archetype === 'dawn_exarch') {
      this.graphics.fillStyle(0x5d3718, 1);
      this.graphics.fillRoundedRect(centerX - 16, centerY - 18, 32, 36, 6);
      this.graphics.lineStyle(3, 0xffe08a, 0.9);
      this.graphics.strokeTriangle(centerX, centerY - 25, centerX - 22, centerY + 17, centerX + 22, centerY + 17);
      this.graphics.fillStyle(0xffe08a, 1);
      this.graphics.fillCircle(centerX, centerY - 5, 6);
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

    if (unit.statuses.some((status) => status.id !== 'downed')) {
      this.graphics.fillStyle(0xeadfc7, 0.95);
      this.graphics.fillCircle(centerX + 23, centerY - 21, 5);
    }

    const label = this.scene.add.text(centerX, centerY - 38, unit.name.split(' ')[0], {
      color: '#eadfc7',
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
    });
    label.setOrigin(0.5);
    this.labels.push(label);
  }

  private unitColor(archetype: UnitArchetype): number {
    switch (archetype) {
      case 'regent':
        return 0x9c2442;
      case 'knight':
        return 0x7e6f5a;
      case 'occultist':
        return 0x6e3d88;
      case 'dawn_soldier':
        return 0xd4a957;
      case 'sun_acolyte':
        return 0xe0c46b;
      case 'inquisitor':
        return 0xb87532;
      case 'lantern_marksman':
        return 0xa8a05e;
      case 'bell_warden':
        return 0x8c6a3e;
      case 'dawn_exarch':
        return 0xc7842f;
    }
  }

  private hazardColor(hazard: string | undefined): number | undefined {
    switch (hazard) {
      case 'blood_mire':
        return 0x30121b;
      case 'veil_fog':
        return 0x1a2d32;
      case 'sunflare':
        return 0x3b2d14;
      case 'relic_cache':
        return 0x1d2535;
      default:
        return undefined;
    }
  }

  private hazardStroke(hazard: string): number {
    switch (hazard) {
      case 'blood_mire':
        return 0xbd3557;
      case 'veil_fog':
        return 0x9fb8bd;
      case 'sunflare':
        return 0xf0c66b;
      case 'relic_cache':
        return 0xa2a8ff;
      default:
        return 0x6b705f;
    }
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
