import Phaser from 'phaser';
import { unitTokenKey } from '../../game/assets/manifest';
import { getAttackableTargets, getAttackDamagePreview, getReachableTiles, hasLineOfSight } from '../../game/simulation/battle';
import type { BattleState, GridPosition, HazardId, StatusId, UnitArchetype, UnitState } from '../../game/simulation/types';

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
  private readonly overlay: Phaser.GameObjects.Graphics;
  private readonly labels: Phaser.GameObjects.Text[] = [];
  private readonly unitImages: Phaser.GameObjects.Image[] = [];
  private readonly effectObjects: Phaser.GameObjects.GameObject[] = [];
  private lastEffectKey = '';

  constructor(private readonly scene: Phaser.Scene) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(1);
    this.overlay = scene.add.graphics();
    this.overlay.setDepth(8);
  }

  destroy(): void {
    this.graphics.destroy();
    this.overlay.destroy();
    for (const label of this.labels) {
      label.destroy();
    }
    this.labels.length = 0;
    for (const image of this.unitImages) {
      image.destroy();
    }
    this.unitImages.length = 0;
    for (const object of this.effectObjects) {
      this.scene.tweens.killTweensOf(object);
      object.destroy();
    }
    this.effectObjects.length = 0;
  }

  render(state: BattleState, hoverPosition: GridPosition | null = null): void {
    this.graphics.clear();
    this.overlay.clear();
    for (const label of this.labels) {
      label.destroy();
    }
    this.labels.length = 0;
    for (const image of this.unitImages) {
      image.destroy();
    }
    this.unitImages.length = 0;

    const reachable = new Set(getReachableTiles(state).map(tileKey));
    const targets = new Set(getAttackableTargets(state).map((unit) => unit.id));

    this.drawBackdrop();
    this.drawTiles(state, reachable);
    this.drawActionPreview(state, targets);
    this.drawUnits(state, targets);
    this.drawIntentLines(state);
    this.drawHoverPreview(state, hoverPosition, reachable, targets);
    this.emitEventEffect(state);
  }

  private drawBackdrop(): void {
    const { originX, originY, tileSize } = boardMetrics;
    this.graphics.fillStyle(0x07070b, 0.88);
    this.graphics.fillRoundedRect(originX - 22, originY - 22, tileSize * 7 + 44, tileSize * 6 + 44, 18);
    this.graphics.fillStyle(0xd7aa62, 0.08);
    this.graphics.fillRoundedRect(originX - 10, originY - 10, tileSize * 7 + 20, tileSize * 6 + 20, 12);
    this.graphics.lineStyle(2, 0x7d6034, 0.7);
    this.graphics.strokeRoundedRect(originX - 22, originY - 22, tileSize * 7 + 44, tileSize * 6 + 44, 18);
    this.graphics.lineStyle(1, 0xe5be70, 0.28);
    this.graphics.strokeRoundedRect(originX - 13, originY - 13, tileSize * 7 + 26, tileSize * 6 + 26, 12);
  }

  private drawTiles(state: BattleState, reachable: Set<string>): void {
    const { originX, originY, tileSize } = boardMetrics;

    for (const tile of state.tiles) {
      const x = originX + tile.x * tileSize;
      const y = originY + tile.y * tileSize;
      const isReachable = reachable.has(tileKey(tile));
      const cacheClaimed = tile.hazard === 'relic_cache' && state.claimedRelicCaches.includes(tileKey(tile));
      const isHeld =
        state.objective.type === 'hold_ritual' && state.objective.ritualTiles.some((ritual) => tileKey(ritual) === tileKey(tile));
      const isRelicObjective =
        state.objective.type === 'capture_relic' && state.objective.relicTiles.some((relic) => tileKey(relic) === tileKey(tile));
      const isEscape =
        state.objective.type === 'escape_route' && state.objective.exitTiles.some((exit) => tileKey(exit) === tileKey(tile));
      const baseColor =
        tile.terrain === 'obstacle'
          ? 0x15131a
          : tile.terrain === 'ritual'
            ? 0x211927
            : tile.terrain === 'cover'
              ? 0x1d2422
              : 0x10131a;
      const hazardColor = this.hazardColor(tile.hazard);
      const fillColor = isReachable && state.selectedAction === 'move' ? 0x203942 : hazardColor ?? (isHeld || isRelicObjective || isEscape ? 0x2c1528 : baseColor);

      this.graphics.fillStyle(fillColor, 1);
      this.graphics.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
      this.graphics.fillStyle(0xffffff, tile.terrain === 'obstacle' ? 0.025 : 0.04);
      this.graphics.fillRect(x + 6, y + 6, tileSize - 12, 3);
      this.graphics.fillStyle(0x000000, 0.12);
      this.graphics.fillRect(x + 6, y + tileSize - 9, tileSize - 12, 3);

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

      if (tile.terrain === 'cover') {
        this.graphics.fillStyle(0x566352, 0.44);
        this.graphics.fillRoundedRect(x + 12, y + 39, tileSize - 24, 12, 4);
        this.graphics.fillRoundedRect(x + 18, y + 27, tileSize - 36, 12, 4);
        this.graphics.lineStyle(1, 0xb8c7a0, 0.5);
        this.graphics.lineBetween(x + 18, y + 27, x + tileSize - 18, y + 51);
      }

      if (isEscape) {
        this.graphics.lineStyle(3, 0x9fb8bd, 0.82);
        this.graphics.strokeRect(x + 8, y + 8, tileSize - 16, tileSize - 16);
        this.graphics.lineStyle(1, 0xfff0b1, 0.7);
        this.graphics.lineBetween(x + 19, y + tileSize / 2, x + tileSize - 18, y + tileSize / 2);
        this.graphics.lineBetween(x + tileSize - 29, y + tileSize / 2 - 10, x + tileSize - 18, y + tileSize / 2);
        this.graphics.lineBetween(x + tileSize - 29, y + tileSize / 2 + 10, x + tileSize - 18, y + tileSize / 2);
      }

      if (tile.hazard) {
        this.graphics.lineStyle(2, this.hazardStroke(tile.hazard), cacheClaimed ? 0.28 : 0.68);
        this.graphics.strokeRect(x + 10, y + 10, tileSize - 20, tileSize - 20);
        this.drawHazardGlyph(tile.hazard, x + tileSize / 2, y + tileSize / 2);
        if (isRelicObjective && !cacheClaimed) {
          this.graphics.lineStyle(2, 0xfff0b1, 0.82);
          this.graphics.strokeCircle(x + tileSize / 2, y + tileSize / 2, 30);
          this.graphics.lineStyle(1, 0xa2a8ff, 0.66);
          this.graphics.strokeCircle(x + tileSize / 2, y + tileSize / 2, 21);
        }
        if (cacheClaimed) {
          this.graphics.lineStyle(2, 0xe5be70, 0.45);
          this.graphics.lineBetween(x + 20, y + 20, x + tileSize - 20, y + tileSize - 20);
          this.graphics.lineBetween(x + tileSize - 20, y + 20, x + 20, y + tileSize - 20);
        }
      }

      this.graphics.lineStyle(1, 0x6b705f, isReachable ? 0.68 : 0.22);
      this.graphics.strokeRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
    }
  }

  private drawActionPreview(state: BattleState, targets: Set<string>): void {
    const active = state.units.find((unit) => unit.id === state.activeUnitId && !unit.downed);
    if (!active || state.phase !== 'player') {
      return;
    }

    if (state.selectedAction === 'interact') {
      const preview = this.interactionPreview(state, active);
      const center = this.tileCenter(active.position);
      this.graphics.lineStyle(3, preview.available ? 0x76a987 : 0xbd3557, 0.76);
      this.graphics.strokeRect(center.x - 25, center.y - 25, 50, 50);
      this.graphics.lineStyle(1, 0xfff0b1, preview.available ? 0.72 : 0.32);
      this.graphics.strokeCircle(center.x, center.y, 31);
      return;
    }

    const ability = this.selectedAbility(active, state.selectedAction);
    if (!ability || !this.isTargetedAction(state.selectedAction)) {
      return;
    }

    const { tileSize } = boardMetrics;
    for (const tile of state.tiles) {
      if (tile.terrain === 'obstacle' || this.gridDistance(active.position, tile) > ability.range) {
        continue;
      }

      const center = this.tileCenter(tile);
      this.graphics.lineStyle(1, 0xc43f5f, 0.22);
      this.graphics.strokeCircle(center.x, center.y, tileSize * 0.33);
      this.graphics.lineStyle(1, 0xe5be70, 0.14);
      this.graphics.strokeRect(center.x - 22, center.y - 22, 44, 44);
    }

    const activeCenter = this.tileCenter(active.position);
    for (const target of state.units.filter((unit) => targets.has(unit.id))) {
      const targetCenter = this.tileCenter(target.position);
      this.graphics.lineStyle(4, 0x2d111b, 0.68);
      this.graphics.lineBetween(activeCenter.x, activeCenter.y, targetCenter.x, targetCenter.y);
      this.graphics.lineStyle(2, 0xf0b4c4, 0.82);
      this.graphics.lineBetween(activeCenter.x, activeCenter.y, targetCenter.x, targetCenter.y);
    }
  }

  private drawUnits(state: BattleState, targets: Set<string>): void {
    for (const unit of state.units.filter((candidate) => !candidate.downed)) {
      this.drawUnit(
        unit,
        targets.has(unit.id),
        unit.id === state.activeUnitId,
        state.objective.type === 'protect_unit' && unit.id === state.objective.protectedUnitId,
      );
    }
  }

  private drawUnit(unit: UnitState, isTarget: boolean, isActive: boolean, isProtected = false): void {
    const { originX, originY, tileSize } = boardMetrics;
    const centerX = originX + unit.position.x * tileSize + tileSize / 2;
    const centerY = originY + unit.position.y * tileSize + tileSize / 2;
    const baseColor = this.unitColor(unit.archetype);
    const ringColor = unit.faction === 'court' ? 0xe7d7bd : 0xffef9d;

    this.graphics.fillStyle(0x000000, 0.35);
    this.graphics.fillEllipse(centerX + 1, centerY + 19, 44, 12);
    this.graphics.lineStyle(1, unit.faction === 'court' ? 0xc43f5f : 0xe6b44d, 0.38);
    this.graphics.strokeEllipse(centerX + 1, centerY + 19, 52, 16);

    if (unit.commander || unit.name.startsWith('Elite ')) {
      this.drawRankHalo(unit, centerX, centerY);
    }

    if (isProtected) {
      this.graphics.lineStyle(3, 0x9fb8bd, 0.72);
      this.graphics.strokeCircle(centerX, centerY, 38);
      this.graphics.lineStyle(1, 0xfff0b1, 0.64);
      this.graphics.strokeCircle(centerX, centerY, 43);
      this.graphics.fillStyle(0x9fb8bd, 0.92);
      this.drawDiamond(centerX, centerY - 45, 12, 0x9fb8bd, 0.92);
    }

    if (isActive) {
      this.graphics.lineStyle(2, 0xf0b4c4, 0.48);
      this.graphics.strokeCircle(centerX, centerY, 32);
      this.graphics.lineStyle(1, 0xe5be70, 0.42);
      this.graphics.strokeCircle(centerX, centerY, 36);
    }

    this.graphics.lineStyle(isActive ? 4 : 2, ringColor, isActive ? 1 : 0.7);
    this.graphics.fillStyle(baseColor, 1);
    this.graphics.fillCircle(centerX, centerY, 20);
    this.graphics.strokeCircle(centerX, centerY, 22);

    if (this.drawUnitToken(unit, centerX, centerY)) {
      this.graphics.lineStyle(1, 0x09070a, 0.45);
      this.graphics.strokeCircle(centerX, centerY, 20);
    } else if (unit.archetype === 'regent') {
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
      this.overlay.lineStyle(3, 0xfff0b1, 0.95);
      this.overlay.strokeCircle(centerX, centerY, 29);
      this.overlay.lineStyle(1, 0xc43f5f, 0.85);
      this.overlay.strokeCircle(centerX, centerY, 34);
    }

    this.overlay.fillStyle(0x181015, 0.92);
    this.overlay.fillRoundedRect(centerX - 28, centerY + 26, 56, 10, 4);
    this.overlay.fillStyle(unit.faction === 'court' ? 0xc43f5f : 0xe6b44d, 1);
    this.overlay.fillRoundedRect(centerX - 26, centerY + 28, Math.max(0, 52 * (unit.hp / unit.maxHp)), 6, 3);

    this.drawStatusPips(unit, centerX, centerY);
    this.drawActionPips(unit, centerX, centerY);

    const label = this.scene.add.text(centerX, centerY - 38, unit.name.split(' ')[0], {
      color: '#eadfc7',
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
    });
    label.setOrigin(0.5);
    label.setDepth(10);
    this.labels.push(label);
  }

  private drawUnitToken(unit: UnitState, centerX: number, centerY: number): boolean {
    const key = unitTokenKey(unit.archetype);
    if (!this.scene.textures.exists(key)) {
      return false;
    }

    const image = this.scene.add.image(centerX, centerY, key);
    image.setDisplaySize(unit.archetype === 'dawn_exarch' ? 57 : 50, unit.archetype === 'dawn_exarch' ? 57 : 50);
    image.setDepth(5);
    image.setAlpha(unit.faction === 'court' ? 0.98 : 0.94);
    this.unitImages.push(image);
    return true;
  }

  private drawRankHalo(unit: UnitState, centerX: number, centerY: number): void {
    const color = unit.commander ? 0xffe08a : 0xf0b4c4;
    this.graphics.lineStyle(2, color, unit.commander ? 0.76 : 0.58);
    this.graphics.strokeCircle(centerX, centerY, unit.commander ? 31 : 28);
    this.graphics.fillStyle(color, 0.9);
    if (unit.commander) {
      this.graphics.fillTriangle(centerX, centerY - 36, centerX - 6, centerY - 27, centerX + 6, centerY - 27);
      this.graphics.fillTriangle(centerX + 27, centerY - 2, centerX + 17, centerY - 7, centerX + 17, centerY + 4);
      this.graphics.fillTriangle(centerX - 27, centerY - 2, centerX - 17, centerY - 7, centerX - 17, centerY + 4);
    } else {
      this.drawDiamond(centerX, centerY - 32, 10, color, 0.9);
    }
  }

  private drawStatusPips(unit: UnitState, centerX: number, centerY: number): void {
    const statuses = unit.statuses.filter((status) => status.id !== 'downed').slice(0, 3);
    statuses.forEach((status, index) => {
      this.overlay.fillStyle(this.statusColor(status.id), 0.96);
      this.overlay.fillCircle(centerX + 23, centerY - 20 + index * 9, 4);
      this.overlay.lineStyle(1, 0x09070a, 0.8);
      this.overlay.strokeCircle(centerX + 23, centerY - 20 + index * 9, 4);
    });
  }

  private drawActionPips(unit: UnitState, centerX: number, centerY: number): void {
    if (unit.faction !== 'court' || unit.downed) {
      return;
    }

    for (let index = 0; index < unit.maxActionPoints; index += 1) {
      const filled = index < unit.actionPoints;
      this.drawDiamond(centerX - 10 + index * 10, centerY + 43, 7, filled ? 0xe5be70 : 0x211821, filled ? 0.95 : 0.72);
    }
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

  private drawHazardGlyph(hazard: HazardId, centerX: number, centerY: number): void {
    const color = this.hazardStroke(hazard);
    this.graphics.lineStyle(2, color, 0.72);
    if (hazard === 'blood_mire') {
      this.graphics.strokeCircle(centerX, centerY, 16);
      this.graphics.lineBetween(centerX - 9, centerY + 8, centerX + 9, centerY - 8);
      return;
    }

    if (hazard === 'veil_fog') {
      this.graphics.lineBetween(centerX - 17, centerY - 5, centerX + 17, centerY - 5);
      this.graphics.lineBetween(centerX - 12, centerY + 2, centerX + 14, centerY + 2);
      this.graphics.lineBetween(centerX - 17, centerY + 9, centerX + 8, centerY + 9);
      return;
    }

    if (hazard === 'sunflare') {
      this.graphics.strokeCircle(centerX, centerY, 10);
      this.graphics.lineBetween(centerX, centerY - 19, centerX, centerY - 12);
      this.graphics.lineBetween(centerX, centerY + 19, centerX, centerY + 12);
      this.graphics.lineBetween(centerX - 19, centerY, centerX - 12, centerY);
      this.graphics.lineBetween(centerX + 19, centerY, centerX + 12, centerY);
      return;
    }

    this.graphics.strokeRect(centerX - 12, centerY - 12, 24, 24);
    this.graphics.lineBetween(centerX - 12, centerY, centerX + 12, centerY);
    this.graphics.lineBetween(centerX, centerY - 12, centerX, centerY + 12);
  }

  private statusColor(status: StatusId): number {
    switch (status) {
      case 'bleeding':
        return 0xbd3557;
      case 'dazed':
        return 0xf0c66b;
      case 'warded':
        return 0x9fb8bd;
      case 'downed':
        return 0x6b705f;
    }
  }

  private drawDiamond(centerX: number, centerY: number, size: number, color: number, alpha: number): void {
    const half = size / 2;
    this.overlay.fillStyle(color, alpha);
    this.overlay.fillTriangle(centerX, centerY - half, centerX - half, centerY, centerX, centerY + half);
    this.overlay.fillTriangle(centerX, centerY - half, centerX + half, centerY, centerX, centerY + half);
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

  private drawHoverPreview(
    state: BattleState,
    hoverPosition: GridPosition | null,
    reachable: Set<string>,
    targets: Set<string>,
  ): void {
    if (!hoverPosition || state.phase !== 'player') {
      return;
    }

    const tile = state.tiles.find((candidate) => tileKey(candidate) === tileKey(hoverPosition));
    if (!tile) {
      return;
    }

    const hoveredUnit = state.units.find(
      (unit) =>
        !unit.downed &&
        unit.hp > 0 &&
        unit.position.x === hoverPosition.x &&
        unit.position.y === hoverPosition.y,
    );
    const active = state.units.find((unit) => unit.id === state.activeUnitId && !unit.downed && unit.hp > 0);
    const ability = this.selectedAbility(active, state.selectedAction);
    const center = this.tileCenter(hoverPosition);
    const legalMove = state.selectedAction === 'move' && reachable.has(tileKey(hoverPosition));
    const legalAttack = this.isTargetedAction(state.selectedAction) && hoveredUnit?.faction === 'dawn' && targets.has(hoveredUnit.id);
    const legalInteract =
      state.selectedAction === 'interact' &&
      active !== undefined &&
      hoverPosition.x === active.position.x &&
      hoverPosition.y === active.position.y;
    const selectableCourt = hoveredUnit?.faction === 'court';
    const accent = legalMove || legalAttack || legalInteract || selectableCourt ? 0xfff0b1 : 0xbd3557;

    this.overlay.lineStyle(4, 0x09070a, 0.82);
    this.overlay.strokeRect(
      center.x - boardMetrics.tileSize / 2 + 5,
      center.y - boardMetrics.tileSize / 2 + 5,
      boardMetrics.tileSize - 10,
      boardMetrics.tileSize - 10,
    );
    this.overlay.lineStyle(2, accent, 0.95);
    this.overlay.strokeRect(
      center.x - boardMetrics.tileSize / 2 + 7,
      center.y - boardMetrics.tileSize / 2 + 7,
      boardMetrics.tileSize - 14,
      boardMetrics.tileSize - 14,
    );

    if (legalMove && active) {
      this.overlay.fillStyle(0x9fb8bd, 0.18);
      this.overlay.fillCircle(center.x, center.y, 22);
      const path = this.findMovePath(state, active.position, hoverPosition, active.id);
      const threats = this.destinationThreats(state, hoverPosition, active.id);
      this.drawMovePath(path);
      this.drawDestinationThreats(hoverPosition, threats);
      this.drawHoverCard(state, hoverPosition, 'Move order', [
        `${path.length > 1 ? path.length - 1 : 0} step${path.length === 2 ? '' : 's'} · ${
          this.hazardLabel(tile.hazard) ?? 'Reachable command tile'
        }`,
        threats.length > 0 ? `Threatened by ${threats.map((unit) => unit.name).join(', ')}` : 'Outside current enemy strike lines',
        `Column ${hoverPosition.x + 1}, row ${hoverPosition.y + 1}`,
      ]);
      return;
    }

    if (legalAttack && hoveredUnit && active && ability) {
      const attackPreview = getAttackDamagePreview(state, active.id, hoveredUnit.id, ability.damage, ability.range);
      const damage = attackPreview?.damage ?? 1;
      const remaining = Math.max(0, hoveredUnit.hp - damage);
      const targetTile = state.tiles.find((candidate) => tileKey(candidate) === tileKey(hoveredUnit.position));
      this.overlay.lineStyle(3, 0xfff0b1, 0.9);
      this.overlay.strokeCircle(center.x, center.y, 31);
      this.overlay.lineStyle(1, 0xc43f5f, 0.9);
      this.overlay.strokeCircle(center.x, center.y, 38);
      this.drawHoverCard(state, hoverPosition, ability.name, [
        `${damage} damage · HP ${hoveredUnit.hp}->${remaining}`,
        attackPreview?.flankBonus
          ? 'Flank pressure adds +1 damage'
          : targetTile?.terrain === 'cover'
          ? 'Cover absorbs ranged damage'
          : remaining === 0
            ? 'Lethal strike'
            : `${hoveredUnit.name} survives`,
      ]);
      return;
    }

    if (legalInteract && active) {
      const preview = this.interactionPreview(state, active);
      this.overlay.lineStyle(3, preview.available ? 0x76a987 : 0xbd3557, 0.9);
      this.overlay.strokeCircle(center.x, center.y, 31);
      this.drawHoverCard(state, hoverPosition, preview.title, preview.lines);
      return;
    }

    if (selectableCourt && hoveredUnit) {
      this.drawHoverCard(state, hoverPosition, `Select ${hoveredUnit.name}`, [
        `HP ${hoveredUnit.hp}/${hoveredUnit.maxHp} · AP ${hoveredUnit.actionPoints}/${hoveredUnit.maxActionPoints}`,
        hoveredUnit.statuses.length > 0 ? hoveredUnit.statuses.map((status) => status.label).join(', ') : 'Ready for orders',
      ]);
      return;
    }

    if (hoveredUnit?.faction === 'dawn' && ability && active) {
      const inRange = this.gridDistance(active.position, hoveredUnit.position) <= ability.range;
      const hasSight = inRange && hasLineOfSight(state, active.position, hoveredUnit.position, ability.range);
      if (this.isTargetedAction(state.selectedAction) && inRange && !hasSight) {
        this.drawHoverCard(state, hoverPosition, hoveredUnit.name, [
          `Range ${this.gridDistance(active.position, hoveredUnit.position)}/${ability.range}`,
          'Line of sight blocked',
        ]);
        this.drawBlockedSightline(state, active.position, hoveredUnit.position);
        return;
      }
      this.drawHoverCard(state, hoverPosition, hoveredUnit.name, [
        `Range ${this.gridDistance(active.position, hoveredUnit.position)}/${ability.range}`,
        this.isTargetedAction(state.selectedAction)
          ? 'Out of attack range'
          : 'Select attack to preview strike',
      ]);
      return;
    }

    this.drawHoverCard(state, hoverPosition, this.actionLabel(state.selectedAction), [
      tile.terrain === 'obstacle'
        ? 'Blocked terrain'
        : tile.terrain === 'cover'
          ? 'Cover: -1 ranged damage taken'
          : this.hazardLabel(tile.hazard) ?? 'No unit on this tile',
      state.selectedAction === 'move' ? 'Outside current move reach' : 'Awaiting a valid target',
    ]);
  }

  private drawHoverCard(state: BattleState, position: GridPosition, title: string, lines: string[]): void {
    const { originX, originY, tileSize } = boardMetrics;
    const center = this.tileCenter(position);
    const width = 194;
    const visibleLines = lines.slice(0, 3);
    const height = 42 + visibleLines.length * 16;
    const boardLeft = originX - 18;
    const boardRight = originX + state.gridWidth * tileSize + 18;
    const boardTop = originY - 18;
    const boardBottom = originY + state.gridHeight * tileSize + 18;
    const preferRight = center.x + tileSize / 2 + width + 14 <= boardRight;
    const x = preferRight ? center.x + tileSize / 2 + 10 : center.x - tileSize / 2 - width - 10;
    const y = Math.max(boardTop, Math.min(center.y - height / 2, boardBottom - height));

    this.overlay.fillStyle(0x09070a, 0.9);
    this.overlay.fillRoundedRect(x, y, width, height, 8);
    this.overlay.lineStyle(1, 0xe5be70, 0.62);
    this.overlay.strokeRoundedRect(x, y, width, height, 8);
    this.overlay.lineStyle(1, 0xc43f5f, 0.26);
    this.overlay.lineBetween(x + 12, y + 31, x + width - 12, y + 31);

    const titleLabel = this.scene.add.text(x + 12, y + 10, title, {
      color: '#fff0d8',
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      fontStyle: 'bold',
    });
    titleLabel.setDepth(18);
    this.labels.push(titleLabel);

    visibleLines.forEach((line, index) => {
      const label = this.scene.add.text(x + 12, y + 38 + index * 16, line, {
        color: index === 0 ? '#d9cfbd' : '#aaa197',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
      });
      label.setDepth(18);
      this.labels.push(label);
    });
  }

  private drawDestinationThreats(destination: GridPosition, threats: UnitState[]): void {
    if (threats.length === 0) {
      return;
    }

    const destinationCenter = this.tileCenter(destination);
    this.overlay.lineStyle(3, 0xbd3557, 0.84);
    this.overlay.strokeCircle(destinationCenter.x, destinationCenter.y, 24);
    this.overlay.lineStyle(1, 0xfff0b1, 0.58);
    this.overlay.strokeCircle(destinationCenter.x, destinationCenter.y, 30);

    for (const threat of threats) {
      const threatCenter = this.tileCenter(threat.position);
      this.overlay.lineStyle(5, 0x09070a, 0.62);
      this.overlay.lineBetween(threatCenter.x, threatCenter.y, destinationCenter.x, destinationCenter.y);
      this.overlay.lineStyle(2, 0xbd3557, 0.84);
      this.overlay.lineBetween(threatCenter.x, threatCenter.y, destinationCenter.x, destinationCenter.y);
    }
  }

  private drawMovePath(path: GridPosition[]): void {
    if (path.length < 2) {
      return;
    }

    const centers = path.map((position) => this.tileCenter(position));
    this.overlay.lineStyle(7, 0x09070a, 0.74);
    for (let index = 1; index < centers.length; index += 1) {
      this.overlay.lineBetween(centers[index - 1].x, centers[index - 1].y, centers[index].x, centers[index].y);
    }

    this.overlay.lineStyle(3, 0xfff0b1, 0.92);
    for (let index = 1; index < centers.length; index += 1) {
      this.overlay.lineBetween(centers[index - 1].x, centers[index - 1].y, centers[index].x, centers[index].y);
    }

    centers.slice(1).forEach((center, index) => {
      this.drawDiamond(center.x, center.y, index === centers.length - 2 ? 16 : 11, 0xfff0b1, index === centers.length - 2 ? 0.95 : 0.7);
      this.overlay.lineStyle(1, 0x09070a, 0.82);
      this.overlay.strokeCircle(center.x, center.y, index === centers.length - 2 ? 10 : 7);
    });
  }

  private findMovePath(state: BattleState, start: GridPosition, end: GridPosition, movingUnitId: string): GridPosition[] {
    const startKey = tileKey(start);
    const endKey = tileKey(end);
    const frontier: GridPosition[] = [start];
    const cameFrom = new Map<string, string | null>([[startKey, null]]);

    while (frontier.length > 0) {
      const current = frontier.shift();
      if (!current) {
        break;
      }

      if (tileKey(current) === endKey) {
        break;
      }

      for (const next of this.neighbors(current)) {
        const key = tileKey(next);
        if (cameFrom.has(key) || !this.isPathWalkable(state, next, movingUnitId)) {
          continue;
        }

        cameFrom.set(key, tileKey(current));
        frontier.push(next);
      }
    }

    if (!cameFrom.has(endKey)) {
      return [start, end];
    }

    const path: GridPosition[] = [];
    let currentKey: string | null = endKey;
    while (currentKey) {
      const [x, y] = currentKey.split(',').map(Number);
      path.unshift({ x, y });
      currentKey = cameFrom.get(currentKey) ?? null;
    }

    return path;
  }

  private isPathWalkable(state: BattleState, position: GridPosition, movingUnitId: string): boolean {
    if (position.x < 0 || position.y < 0 || position.x >= state.gridWidth || position.y >= state.gridHeight) {
      return false;
    }

    const tile = state.tiles.find((candidate) => tileKey(candidate) === tileKey(position));
    if (!tile || tile.terrain === 'obstacle') {
      return false;
    }

    const occupant = state.units.find(
      (unit) =>
        !unit.downed &&
        unit.hp > 0 &&
        unit.id !== movingUnitId &&
        unit.position.x === position.x &&
        unit.position.y === position.y,
    );
    return !occupant;
  }

  private drawBlockedSightline(state: BattleState, from: GridPosition, to: GridPosition): void {
    const fromCenter = this.tileCenter(from);
    const toCenter = this.tileCenter(to);
    const blocker = this.firstBlockingObstacle(state, from, to);
    const blockCenter = blocker ? this.tileCenter(blocker) : toCenter;

    this.overlay.lineStyle(7, 0x09070a, 0.78);
    this.overlay.lineBetween(fromCenter.x, fromCenter.y, toCenter.x, toCenter.y);
    this.overlay.lineStyle(3, 0xbd3557, 0.92);
    this.overlay.lineBetween(fromCenter.x, fromCenter.y, blockCenter.x, blockCenter.y);
    this.overlay.lineStyle(2, 0x9fa89f, 0.48);
    this.overlay.lineBetween(blockCenter.x, blockCenter.y, toCenter.x, toCenter.y);

    this.overlay.lineStyle(3, 0xfff0b1, 0.9);
    this.overlay.strokeRect(blockCenter.x - 24, blockCenter.y - 24, 48, 48);
    this.overlay.lineStyle(3, 0xbd3557, 0.95);
    this.overlay.lineBetween(blockCenter.x - 17, blockCenter.y - 17, blockCenter.x + 17, blockCenter.y + 17);
    this.overlay.lineBetween(blockCenter.x + 17, blockCenter.y - 17, blockCenter.x - 17, blockCenter.y + 17);
  }

  private firstBlockingObstacle(state: BattleState, from: GridPosition, to: GridPosition): GridPosition | null {
    if (from.x !== to.x && from.y !== to.y) {
      return null;
    }

    const stepX = Math.sign(to.x - from.x);
    const stepY = Math.sign(to.y - from.y);
    let cursor = { x: from.x + stepX, y: from.y + stepY };

    while (cursor.x !== to.x || cursor.y !== to.y) {
      const tile = state.tiles.find((candidate) => tileKey(candidate) === tileKey(cursor));
      if (!tile || tile.terrain === 'obstacle') {
        return cursor;
      }
      cursor = { x: cursor.x + stepX, y: cursor.y + stepY };
    }

    return null;
  }

  private neighbors(position: GridPosition): GridPosition[] {
    return [
      { x: position.x + 1, y: position.y },
      { x: position.x - 1, y: position.y },
      { x: position.x, y: position.y + 1 },
      { x: position.x, y: position.y - 1 },
    ];
  }

  private destinationThreats(state: BattleState, destination: GridPosition, movingUnitId: string): UnitState[] {
    return state.units
      .filter((unit) => unit.faction === 'dawn' && !unit.downed && unit.hp > 0)
      .filter((unit) => {
        const ability = unit.abilities[0];
        if (!ability) {
          return false;
        }
        const occupiedByOther = state.units.some(
          (candidate) =>
            candidate.id !== movingUnitId &&
            candidate.id !== unit.id &&
            !candidate.downed &&
            candidate.hp > 0 &&
            candidate.position.x === destination.x &&
            candidate.position.y === destination.y,
        );
        return !occupiedByOther && this.gridDistance(unit.position, destination) <= ability.range;
      });
  }

  private hazardLabel(hazard: HazardId | undefined): string | null {
    switch (hazard) {
      case 'blood_mire':
        return 'Blood mire: applies bleeding';
      case 'veil_fog':
        return 'Veil fog: grants warded';
      case 'sunflare':
        return 'Sunflare: damage and daze';
      case 'relic_cache':
        return 'Relic cache: grants warded';
      default:
        return null;
    }
  }

  private actionLabel(action: BattleState['selectedAction']): string {
    switch (action) {
      case 'move':
        return 'Move preview';
      case 'attack':
        return 'Attack preview';
      case 'special':
        return 'Special preview';
      case 'interact':
        return 'Interact preview';
      case 'relic':
        return 'Relic preview';
      case 'guard':
        return 'Guard order';
      case 'endTurn':
        return 'End turn';
    }
  }

  private isTargetedAction(action: BattleState['selectedAction']): boolean {
    return action === 'attack' || action === 'special';
  }

  private selectedAbility(unit: UnitState | undefined, action: BattleState['selectedAction']) {
    return action === 'special' ? unit?.abilities[1] : unit?.abilities[0];
  }

  private interactionPreview(state: BattleState, unit: UnitState): { available: boolean; title: string; lines: string[] } {
    const tile = state.tiles.find((candidate) => tileKey(candidate) === tileKey(unit.position));
    const key = tileKey(unit.position);
    const onRitual =
      state.objective.type === 'hold_ritual' &&
      state.objective.ritualTiles.some((ritual) => tileKey(ritual) === key);
    const onRelicObjective =
      state.objective.type === 'capture_relic' &&
      state.objective.relicTiles.some((relic) => tileKey(relic) === key);
    const onEscape =
      state.objective.type === 'escape_route' &&
      state.objective.exitTiles.some((exit) => tileKey(exit) === key);

    if (onRelicObjective && state.objective.type === 'capture_relic' && !state.objective.captured) {
      return {
        available: unit.actionPoints > 0,
        title: 'Seize Relic Ledger',
        lines: ['Spend 1 AP · capture objective', 'Restore 2 health · gain warded 3', 'Completes the encounter'],
      };
    }

    if (onEscape && state.objective.type === 'escape_route' && !state.objective.escapedUnitIds.includes(unit.id)) {
      return {
        available: unit.actionPoints > 0,
        title: 'Escape Fog Bridge',
        lines: [
          `Escape ${Math.min(state.objective.requiredEscapes, state.objective.escapedUnitIds.length + 1)}/${state.objective.requiredEscapes}`,
          'Spend 1 AP · gain warded 2',
          'Completes the encounter',
        ],
      };
    }

    if (tile?.hazard === 'relic_cache' && !state.claimedRelicCaches.includes(key)) {
      return {
        available: unit.actionPoints > 0,
        title: 'Open Relic Cache',
        lines: ['Spend 1 AP · restore 2 health', 'Gain warded 3', `Column ${unit.position.x + 1}, row ${unit.position.y + 1}`],
      };
    }

    if (onRitual && state.objective.type === 'hold_ritual') {
      if (unit.hasMoved) {
        return {
          available: false,
          title: 'Ritual Channel Blocked',
          lines: ['Unit must begin here', 'Move spent this turn', 'Hold or guard until next turn'],
        };
      }

      return {
        available: unit.actionPoints > 0,
        title: 'Channel Ritual',
        lines: [
          `Advance to ${Math.min(state.objective.requiredTurns, state.objective.heldTurns + 1)}/${state.objective.requiredTurns}`,
          'Spend 1 AP · gain warded 1',
          'Can complete hold objectives early',
        ],
      };
    }

    return {
      available: false,
      title: 'No Interaction',
      lines: ['Stand on a ritual or relic cache', this.hazardLabel(tile?.hazard) ?? 'No usable terrain here'],
    };
  }

  private emitEventEffect(state: BattleState): void {
    const event = state.events[0];
    if (!event) {
      return;
    }

    const effectKey = `${state.id}:${event.id}:${event.message}`;
    if (effectKey === this.lastEffectKey) {
      return;
    }
    this.lastEffectKey = effectKey;

    const mentioned = this.mentionedUnits(event.message, state.units);
    const color = this.eventColor(event.tone);

    if (this.isRelicInvocation(event.message)) {
      const unit = mentioned[0] ?? state.units.find((candidate) => candidate.id === state.activeUnitId);
      if (unit) {
        this.drawRelicInvocationEffect(state, this.tileCenter(unit.position), event.message);
        return;
      }
    }

    if ((event.message.includes(' uses ') || event.message.includes(' hits ')) && mentioned.length >= 2) {
      this.drawStrikeEffect(this.tileCenter(mentioned[0].position), this.tileCenter(mentioned[1].position), color, event.message);
      return;
    }

    if (
      event.message.includes('moves to column') ||
      event.message.includes('guards behind') ||
      event.message.includes('enters') ||
      event.message.includes('scorched') ||
      event.message.includes('warded') ||
      event.message.includes('loses')
    ) {
      const unit = mentioned[0] ?? state.units.find((candidate) => candidate.id === state.activeUnitId);
      if (unit) {
        this.drawUnitPulse(this.tileCenter(unit.position), color);
        return;
      }
    }

    if (event.message.includes('dawn pressure') || event.message.includes('dawn meter')) {
      this.drawBoardPulse(0xe2b55b);
      return;
    }

    if (event.tone === 'objective') {
      this.drawBoardPulse(color);
    }
  }

  private isRelicInvocation(message: string): boolean {
    return (
      message.includes('Canal Mirror') ||
      message.includes('Bell Ash Reliquary') ||
      message.includes('Wall-Key of Thorns') ||
      message.includes('Market Mask') ||
      message.includes('Palace Nightglass') ||
      message.includes('Moon-Splinter Crown')
    );
  }

  private mentionedUnits(message: string, units: UnitState[]): UnitState[] {
    return units
      .map((unit) => ({ unit, index: message.indexOf(unit.name) }))
      .filter((entry) => entry.index >= 0)
      .sort((a, b) => a.index - b.index)
      .map((entry) => entry.unit);
  }

  private drawStrikeEffect(from: GridPosition, to: GridPosition, color: number, message: string): void {
    const line = this.scene.add.graphics();
    line.setDepth(16);
    line.lineStyle(8, 0x09070a, 0.72);
    line.lineBetween(from.x, from.y, to.x, to.y);
    line.lineStyle(3, color, 1);
    line.lineBetween(from.x, from.y, to.x, to.y);
    line.lineStyle(2, 0xfff0b1, 0.82);
    line.strokeCircle(to.x, to.y, 26);
    line.lineStyle(2, color, 0.78);
    line.strokeCircle(to.x, to.y, 36);
    this.fadeAndDestroy(line, 420);

    const damage = message.match(/(?:dealing|for) (\d+)/)?.[1];
    if (damage) {
      const text = this.scene.add.text(to.x, to.y - 6, `-${damage}`, {
        color: '#fff0b1',
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        fontStyle: 'bold',
        stroke: '#2d111b',
        strokeThickness: 4,
      });
      text.setOrigin(0.5);
      text.setDepth(20);
      this.floatAndDestroy(text, to.y - 34, 560);
    }
  }

  private drawUnitPulse(position: GridPosition, color: number): void {
    const pulse = this.scene.add.graphics();
    pulse.setDepth(15);
    pulse.lineStyle(3, color, 0.92);
    pulse.strokeCircle(position.x, position.y, 30);
    pulse.lineStyle(1, 0xfff0b1, 0.64);
    pulse.strokeCircle(position.x, position.y, 40);
    pulse.fillStyle(color, 0.18);
    pulse.fillCircle(position.x, position.y, 24);
    this.fadeAndDestroy(pulse, 480);
  }

  private drawRelicInvocationEffect(state: BattleState, position: GridPosition, message: string): void {
    const color = this.relicColor(message);
    const burst = this.scene.add.graphics();
    burst.setDepth(18);
    burst.lineStyle(7, 0x09070a, 0.72);
    burst.strokeCircle(position.x, position.y, 45);
    burst.lineStyle(3, color, 0.98);
    burst.strokeCircle(position.x, position.y, 42);
    burst.lineStyle(1, 0xfff0b1, 0.84);
    burst.strokeCircle(position.x, position.y, 56);
    burst.fillStyle(color, 0.16);
    burst.fillCircle(position.x, position.y, 34);
    burst.lineStyle(2, color, 0.8);
    burst.strokeTriangle(position.x, position.y - 52, position.x - 45, position.y + 28, position.x + 45, position.y + 28);
    burst.strokeTriangle(position.x, position.y + 52, position.x - 45, position.y - 28, position.x + 45, position.y - 28);
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      const inner = 24;
      const outer = index % 2 === 0 ? 64 : 51;
      burst.lineBetween(
        position.x + Math.cos(angle) * inner,
        position.y + Math.sin(angle) * inner,
        position.x + Math.cos(angle) * outer,
        position.y + Math.sin(angle) * outer,
      );
    }
    this.fadeAndDestroy(burst, 720);

    const label = this.scene.add.text(position.x, position.y - 66, this.relicEffectLabel(message), {
      color: '#fff0b1',
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      fontStyle: 'bold',
      stroke: '#13080d',
      strokeThickness: 4,
    });
    label.setOrigin(0.5);
    label.setDepth(21);
    this.floatAndDestroy(label, position.y - 88, 760);

    if (message.includes('Bell Ash Reliquary')) {
      for (const enemy of state.units.filter((unit) => unit.faction === 'dawn' && !unit.downed).slice(0, 2)) {
        this.drawUnitPulse(this.tileCenter(enemy.position), color);
      }
      return;
    }

    if (message.includes('Market Mask') || message.includes('Palace Nightglass')) {
      for (const court of state.units.filter((unit) => unit.faction === 'court' && !unit.downed)) {
        this.drawUnitPulse(this.tileCenter(court.position), color);
      }
      if (message.includes('Palace Nightglass')) {
        this.drawBoardPulse(color);
      }
      return;
    }

    if (message.includes('Wall-Key of Thorns') || message.includes('Canal Mirror') || message.includes('Moon-Splinter Crown')) {
      this.drawUnitPulse(position, color);
    }
  }

  private relicColor(message: string): number {
    if (message.includes('Canal Mirror')) {
      return 0xa2a8ff;
    }
    if (message.includes('Bell Ash Reliquary')) {
      return 0xf0c66b;
    }
    if (message.includes('Wall-Key of Thorns')) {
      return 0x76a987;
    }
    if (message.includes('Market Mask')) {
      return 0xd6a0ff;
    }
    if (message.includes('Palace Nightglass')) {
      return 0x9fb8bd;
    }
    return 0xfff0b1;
  }

  private relicEffectLabel(message: string): string {
    if (message.includes('Bell Ash Reliquary')) {
      return 'ASH BELL';
    }
    if (message.includes('Wall-Key of Thorns')) {
      return 'THORN KEY';
    }
    if (message.includes('Market Mask')) {
      return 'MARKET MASK';
    }
    if (message.includes('Palace Nightglass')) {
      return 'NIGHTGLASS';
    }
    if (message.includes('Canal Mirror')) {
      return 'MIRROR PATH';
    }
    return 'RELIC CROWN';
  }

  private drawBoardPulse(color: number): void {
    const { originX, originY, tileSize } = boardMetrics;
    const pulse = this.scene.add.graphics();
    pulse.setDepth(14);
    pulse.lineStyle(4, color, 0.7);
    pulse.strokeRoundedRect(originX - 17, originY - 17, tileSize * 7 + 34, tileSize * 6 + 34, 14);
    pulse.fillStyle(color, 0.06);
    pulse.fillRoundedRect(originX - 14, originY - 14, tileSize * 7 + 28, tileSize * 6 + 28, 12);
    this.fadeAndDestroy(pulse, 600);
  }

  private eventColor(tone: 'system' | 'player' | 'enemy' | 'objective'): number {
    switch (tone) {
      case 'player':
        return 0xf0b4c4;
      case 'enemy':
        return 0xe9c273;
      case 'objective':
        return 0xd7aa62;
      case 'system':
        return 0x9fb8bd;
    }
  }

  private fadeAndDestroy(object: Phaser.GameObjects.GameObject, duration: number): void {
    this.effectObjects.push(object);
    this.scene.tweens.add({
      targets: object,
      alpha: 0,
      duration,
      ease: 'Cubic.easeOut',
      onComplete: () => this.destroyEffect(object),
    });
  }

  private floatAndDestroy(text: Phaser.GameObjects.Text, y: number, duration: number): void {
    this.effectObjects.push(text);
    this.scene.tweens.add({
      targets: text,
      alpha: 0,
      y,
      duration,
      ease: 'Cubic.easeOut',
      onComplete: () => this.destroyEffect(text),
    });
  }

  private destroyEffect(object: Phaser.GameObjects.GameObject): void {
    const index = this.effectObjects.indexOf(object);
    if (index >= 0) {
      this.effectObjects.splice(index, 1);
    }
    object.destroy();
  }

  private tileCenter(position: GridPosition): GridPosition {
    const { originX, originY, tileSize } = boardMetrics;
    return {
      x: originX + position.x * tileSize + tileSize / 2,
      y: originY + position.y * tileSize + tileSize / 2,
    };
  }

  private gridDistance(a: GridPosition, b: GridPosition): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }
}
