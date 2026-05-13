import { test, expect } from '@playwright/test';
import { createEncounterBattle } from '../../src/game/content/encounters';
import { endPlayerTurn } from '../../src/game/simulation/battle';

test('home page renders title', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Empire of Night')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect
    .poll(() =>
      page.evaluate(
        () => performance.getEntriesByType('resource').filter((entry) => entry.name.includes('/assets/units/')).length,
      ),
    )
    .toBeGreaterThanOrEqual(9);
});

test('debug bridge exposes deterministic squad battle state', async ({ page }) => {
  await page.goto('/');

  const bridge = await page.evaluate(() => window.__empireOfNight?.version);
  expect(bridge).toBe('0.8.0-milestone-8');

  const initialScreen = await page.evaluate(() => window.__empireOfNight?.snapshot().currentScreen);
  expect(initialScreen).toBe('menu');

  await page.evaluate(() => window.__empireOfNight?.startBattle('ritual-hold'));
  await expect(page.getByText('Hold a ritual tile')).toBeVisible();

  const battle = await page.evaluate(() => window.__empireOfNight?.snapshot().battle);
  const courtArchetypes = battle?.units.filter((unit) => unit.faction === 'court').map((unit) => unit.archetype);
  const enemyArchetypes = battle?.units.filter((unit) => unit.faction === 'dawn').map((unit) => unit.archetype);

  expect(battle?.phase).toBe('player');
  expect(battle?.objective.type).toBe('hold_ritual');
  expect(courtArchetypes).toEqual(['regent', 'knight', 'occultist']);
  expect(enemyArchetypes).toEqual(['dawn_soldier', 'sun_acolyte', 'inquisitor']);
  expect(battle?.enemyIntents).toHaveLength(3);
});

test('main menu starts a seeded run through visible controls', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Start Run' }).click();
  await expect(page.getByText('Choose District 1/4')).toBeVisible();
  await expect(page.getByRole('button', { name: /Seal the Crypt Rite/ })).toBeVisible();

  const snapshot = await page.evaluate(() => window.__empireOfNight?.snapshot());
  expect(snapshot?.currentScreen).toBe('route');
  expect(snapshot?.run?.seed).toBe('night-0001');
  expect(snapshot?.run?.difficulty).toBe('standard');
  expect(snapshot?.run?.leader).toBe('nocturne_regent');
});

test('content pass exposes route variety, hazards, enemies, relics, and doctrines', async ({ page }) => {
  await page.goto('/');

  const content = await page.evaluate(() => {
    window.__empireOfNight?.startRun();
    const route = window.__empireOfNight?.snapshot().run?.route.flat() ?? [];
    const encounterIds = [...new Set(route.map((node) => node.encounterId))];
    const districts = [...new Set(route.map((node) => node.district))];
    const rewardDoctrines = new Set<string>();
    const enemyTypes = new Set<string>();
    const hazards = new Set<string>();
    let coverTiles = 0;
    const content = window.__empireOfNight?.snapshot().content;

    for (const node of route) {
      window.__empireOfNight?.startBattle(node.encounterId);
      const battle = window.__empireOfNight?.snapshot().battle;
      for (const unit of battle?.units ?? []) {
        if (unit.faction === 'dawn') {
          enemyTypes.add(unit.archetype);
        }
      }
      for (const tile of battle?.tiles ?? []) {
        if (tile.hazard) {
          hazards.add(tile.hazard);
        }
        if (tile.terrain === 'cover') {
          coverTiles += 1;
        }
      }

      rewardDoctrines.add(node.district);
    }

    return {
      routeCount: route.length,
      encounterCount: encounterIds.length,
      districts: districts.length,
      enemyTypes: enemyTypes.size,
      hazards: hazards.size,
      coverTiles,
      rewardDoctrines: content?.doctrines.length ?? 0,
      rewardRelics: content?.relics.length ?? 0,
      routeEvents: content?.routeEvents.length ?? 0,
    };
  });

  expect(content.routeCount).toBe(12);
  expect(content.encounterCount).toBe(12);
  expect(content.districts).toBe(6);
  expect(content.enemyTypes).toBeGreaterThanOrEqual(5);
  expect(content.hazards).toBe(4);
  expect(content.coverTiles).toBeGreaterThanOrEqual(20);
  expect(content.rewardDoctrines).toBeGreaterThanOrEqual(3);
  expect(content.rewardRelics).toBe(6);
  expect(content.routeEvents).toBeGreaterThanOrEqual(6);
});

test('seeded runs and difficulty bands are deterministic and varied', async ({ page }) => {
  await page.goto('/');

  const balance = await page.evaluate(() => {
    window.__empireOfNight?.startRun('night-0001', 'standard');
    const first = window.__empireOfNight?.snapshot();

    window.__empireOfNight?.startRun('night-0001', 'standard');
    const replay = window.__empireOfNight?.snapshot();

    window.__empireOfNight?.startRun('night-9999', 'standard');
    const alternate = window.__empireOfNight?.snapshot();
    const standardNode = alternate?.run?.route[0][0];
    if (standardNode) {
      window.__empireOfNight?.chooseRouteNode(standardNode.id);
    }
    const standardBattle = window.__empireOfNight?.snapshot().battle;

    window.__empireOfNight?.startRun('night-9999', 'nightmare');
    const nightmare = window.__empireOfNight?.snapshot();
    const nightmareNode = nightmare?.run?.route[0][0];
    if (nightmareNode) {
      window.__empireOfNight?.chooseRouteNode(nightmareNode.id);
    }
    const nightmareBattle = window.__empireOfNight?.snapshot().battle;

    const standardEnemy = standardBattle?.units.find((unit) => unit.faction === 'dawn');
    const nightmareEnemy = nightmareBattle?.units.find((unit) => unit.faction === 'dawn');

    return {
      firstSignature: first?.run?.routeSignature,
      replaySignature: replay?.run?.routeSignature,
      alternateSignature: alternate?.run?.routeSignature,
      nightmareDifficulty: nightmare?.run?.difficulty,
      nightmareEstimate: nightmare?.run?.estimatedMinutes,
      dominantRiskShare: nightmare?.balance?.dominantRiskShare,
      rewardTypes: nightmare?.balance?.rewardTypes.length,
      standardDawnMax: standardBattle?.dawn.max,
      nightmareDawnMax: nightmareBattle?.dawn.max,
      standardEnemyHp: standardEnemy?.maxHp,
      nightmareEnemyHp: nightmareEnemy?.maxHp,
    };
  });

  expect(balance.firstSignature).toBe(balance.replaySignature);
  expect(balance.alternateSignature).not.toBe(balance.firstSignature);
  expect(balance.nightmareDifficulty).toBe('nightmare');
  expect(balance.nightmareEstimate).toBeGreaterThanOrEqual(20);
  expect(balance.nightmareEstimate).toBeLessThanOrEqual(40);
  expect(balance.dominantRiskShare).toBeLessThanOrEqual(0.5);
  expect(balance.rewardTypes).toBe(4);
  expect(balance.nightmareDawnMax).toBeLessThan(balance.standardDawnMax ?? 0);
  expect(balance.nightmareEnemyHp).toBeGreaterThan(balance.standardEnemyHp ?? 0);
});

test('alternate leaders change run identity and battle setup', async ({ page }) => {
  await page.goto('/');

  const leaders = await page.evaluate(() => window.__empireOfNight?.snapshot().content.leaders.map((leader) => leader.id));
  expect(leaders).toEqual(['nocturne_regent', 'grave_marshal', 'veil_oracle']);

  const marshal = await page.evaluate(() => {
    window.__empireOfNight?.startRun('leader-marshal', 'standard', 'grave_marshal');
    window.__empireOfNight?.chooseRouteNode('crypt-rite');
    const snapshot = window.__empireOfNight?.snapshot();
    const knight = snapshot.battle?.units.find((unit) => unit.archetype === 'knight');
    return {
      leader: snapshot.run?.leader,
      doctrine: snapshot.run?.doctrine,
      knightHp: knight?.maxHp,
      knightArmor: knight?.armor,
    };
  });
  expect(marshal).toEqual({
    leader: 'grave_marshal',
    doctrine: 'terror',
    knightHp: 17,
    knightArmor: 3,
  });

  const oracle = await page.evaluate(() => {
    window.__empireOfNight?.startRun('leader-oracle', 'standard', 'veil_oracle');
    window.__empireOfNight?.chooseRouteNode('crypt-rite');
    const snapshot = window.__empireOfNight?.snapshot();
    const occultist = snapshot.battle?.units.find((unit) => unit.archetype === 'occultist');
    return {
      leader: snapshot.run?.leader,
      doctrine: snapshot.run?.doctrine,
      occultistRange: occultist?.abilities[0]?.range,
      occultistMove: occultist?.moveRange,
      warded: occultist?.statuses.some((status) => status.id === 'warded'),
    };
  });
  expect(oracle).toEqual({
    leader: 'veil_oracle',
    doctrine: 'shadow',
    occultistRange: 4,
    occultistMove: 4,
    warded: true,
  });
});

test('settings drawer persists audio and motion preferences', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('Mute game audio').check();
  await page.getByLabel('Reduce UI motion').check();

  let snapshot = await page.evaluate(() => window.__empireOfNight?.snapshot());
  expect(snapshot?.settings.muted).toBe(true);
  expect(snapshot?.settings.reducedMotion).toBe(true);
  expect(snapshot?.content.audioCues).toEqual(
    expect.arrayContaining([
      'select',
      'menuConfirm',
      'move',
      'attack',
      'hit',
      'guard',
      'turnStart',
      'dawnWarning',
      'reward',
      'victory',
      'defeat',
    ]),
  );

  await page.reload();
  snapshot = await page.evaluate(() => window.__empireOfNight?.snapshot());
  expect(snapshot?.settings.muted).toBe(true);
  expect(snapshot?.settings.reducedMotion).toBe(true);
});

test('commander objective is authored and readable', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => window.__empireOfNight?.startBattle('commander-duel'));
  await expect(page.getByText('Eliminate the Gate Inquisitor')).toBeVisible();

  const battle = await page.evaluate(() => window.__empireOfNight?.snapshot().battle);
  expect(battle?.objective.type).toBe('eliminate_commander');
  expect(battle?.units.find((unit) => unit.id === 'inquisitor')?.commander).toBe(true);
});

test('commander victory event names the actual commander and district', () => {
  const battle = createEncounterBattle('palace-gate');
  const exarch = battle.units.find((unit) => unit.id === 'dawn-exarch');
  if (!exarch) {
    throw new Error('Dawn Exarch missing from palace-gate encounter.');
  }

  exarch.hp = 0;
  exarch.downed = true;
  const result = endPlayerTurn(battle);

  expect(result.result).toBe('victory');
  expect(result.events[0]?.message).toBe('Dawn Exarch is broken. The palace gate loses its sunlit command.');
});

test('hold ritual victory event names the actual district rite', () => {
  const battle = createEncounterBattle('canal-rite');
  if (battle.objective.type !== 'hold_ritual') {
    throw new Error('Canal rite encounter no longer uses a hold ritual objective.');
  }

  const knight = battle.units.find((unit) => unit.id === 'knight');
  if (!knight) {
    throw new Error('Knight missing from canal-rite encounter.');
  }

  knight.position = battle.objective.ritualTiles[0];
  battle.objective.heldTurns = battle.objective.requiredTurns - 1;
  const result = endPlayerTurn(battle);

  expect(result.result).toBe('victory');
  expect(result.events[0]?.message).toBe('The canal shrine is bound. Fog-banners rise over the black water.');
});

test('battle HUD previews active attacks and projected damage', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__empireOfNight?.startBattle('ritual-hold');
    window.__empireOfNight?.selectUnit('occultist');
    window.__empireOfNight?.move({ x: 2, y: 2 });
    window.__empireOfNight?.selectAction('attack');
  });

  const preview = page.locator('.hud-panel').filter({ has: page.getByRole('heading', { name: 'Tactical Preview' }) });
  await expect(preview).toBeVisible();
  await expect(preview.getByText('Veil Occultist', { exact: true })).toBeVisible();
  await expect(preview.getByText('Blood Hex')).toBeVisible();
  await expect(preview.getByText('Dawn Vanguard')).toBeVisible();
  await expect(preview.getByText('Damage 3 · HP 10->7')).toBeVisible();
});

test('court units expose special abilities with distinct effects', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__empireOfNight?.startBattle('ritual-hold');
    window.__empireOfNight?.selectAction('special');
  });

  await expect(page.getByRole('button', { name: /Special/ })).toBeVisible();
  await expect(page.getByText('Imperial Decree', { exact: true })).toBeVisible();

  const result = await page.evaluate(() => {
    window.__empireOfNight?.move({ x: 2, y: 2 });
    window.__empireOfNight?.selectUnit('regent');
    window.__empireOfNight?.selectAction('special');
    window.__empireOfNight?.attack('dawn-vanguard');
    const battle = window.__empireOfNight?.snapshot().battle;
    const target = battle?.units.find((unit) => unit.id === 'dawn-vanguard');
    return {
      targetHp: target?.hp,
      dazed: target?.statuses.some((status) => status.id === 'dazed'),
      activeUnitId: battle?.activeUnitId,
      latestEvent: battle?.events[0]?.message,
    };
  });

  expect(result).toEqual({
    targetHp: 8,
    dazed: true,
    activeUnitId: 'knight',
    latestEvent: 'Nocturne Regent uses Imperial Decree, dealing 2 to Dawn Vanguard.',
  });
});

test('cover terrain reduces ranged damage and appears in previews', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__empireOfNight?.startBattle('commander-duel');
    window.__empireOfNight?.selectUnit('occultist');
    window.__empireOfNight?.move({ x: 2, y: 2 });
    window.__empireOfNight?.selectAction('attack');
  });

  const preview = page.locator('.hud-panel').filter({ has: page.getByRole('heading', { name: 'Tactical Preview' }) });
  await expect(preview.getByText('Dawn Vanguard')).toBeVisible();
  await expect(preview.getByText(/Cover/)).toBeVisible();
  await expect(preview.getByText('Damage 2 · HP 10->8')).toBeVisible();

  const result = await page.evaluate(() => {
    window.__empireOfNight?.attack('dawn-vanguard');
    const battle = window.__empireOfNight?.snapshot().battle;
    const target = battle?.units.find((unit) => unit.id === 'dawn-vanguard');
    return {
      targetHp: target?.hp,
      bleeding: target?.statuses.some((status) => status.id === 'bleeding'),
      latestEvent: battle?.events[0]?.message,
    };
  });

  expect(result).toEqual({
    targetHp: 8,
    bleeding: true,
    latestEvent: 'Veil Occultist uses Blood Hex, dealing 2 to Dawn Vanguard.',
  });
});

test('flanking pressure rewards positioning in previews and combat', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__empireOfNight?.startBattle('commander-duel');
    window.__empireOfNight?.selectUnit('regent');
    window.__empireOfNight?.move({ x: 4, y: 2 });
    window.__empireOfNight?.selectUnit('occultist');
    window.__empireOfNight?.move({ x: 2, y: 2 });
    window.__empireOfNight?.selectAction('attack');
  });

  const preview = page.locator('.hud-panel').filter({ has: page.getByRole('heading', { name: 'Tactical Preview' }) });
  await expect(preview.getByText('Dawn Vanguard')).toBeVisible();
  await expect(preview.getByText(/Flanked/)).toBeVisible();
  await expect(preview.getByText('Damage 3 · HP 10->7 · +1 flank')).toBeVisible();

  const result = await page.evaluate(() => {
    window.__empireOfNight?.attack('dawn-vanguard');
    const battle = window.__empireOfNight?.snapshot().battle;
    const target = battle?.units.find((unit) => unit.id === 'dawn-vanguard');
    return {
      targetHp: target?.hp,
      bleeding: target?.statuses.some((status) => status.id === 'bleeding'),
      latestEvent: battle?.events[0]?.message,
    };
  });

  expect(result).toEqual({
    targetHp: 7,
    bleeding: true,
    latestEvent: 'Veil Occultist uses Blood Hex, dealing 3 to Dawn Vanguard with flank pressure.',
  });
});

test('line of sight blocks ranged attacks through obstacles', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__empireOfNight?.startRun('sightline', 'standard', 'veil_oracle');
    window.__empireOfNight?.chooseRouteNode('market-ambush');
    window.__empireOfNight?.selectUnit('regent');
    window.__empireOfNight?.move({ x: 1, y: 1 });
    window.__empireOfNight?.selectUnit('occultist');
    window.__empireOfNight?.move({ x: 1, y: 2 });
    window.__empireOfNight?.selectAction('attack');
  });

  const preview = page.locator('.hud-panel').filter({ has: page.getByRole('heading', { name: 'Tactical Preview' }) });
  await expect(preview.getByText('Lantern Marksman')).toBeVisible();
  await expect(preview.getByText('Line blocked · Range 4/4')).toBeVisible();
  await expect(preview.getByText('No sightline')).toBeVisible();

  const result = await page.evaluate(() => {
    window.__empireOfNight?.attack('lantern-marksman');
    const battle = window.__empireOfNight?.snapshot().battle;
    const target = battle?.units.find((unit) => unit.id === 'lantern-marksman');
    return {
      targetHp: target?.hp,
      activeUnitId: battle?.activeUnitId,
      latestEvent: battle?.events[0]?.message,
    };
  });

  expect(result).toEqual({
    targetHp: 9,
    activeUnitId: 'occultist',
    latestEvent: 'Lantern Marksman has no clear line of sight for Blood Hex.',
  });
});

test('interact command channels rituals and claims relic caches', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__empireOfNight?.startBattle('ritual-hold');
    window.__empireOfNight?.selectUnit('knight');
    window.__empireOfNight?.move({ x: 3, y: 3 });
    window.__empireOfNight?.endTurn();
    window.__empireOfNight?.selectUnit('knight');
    window.__empireOfNight?.selectAction('interact');
  });

  const preview = page.locator('.hud-panel').filter({ has: page.getByRole('heading', { name: 'Tactical Preview' }) });
  await expect(page.getByRole('button', { name: /Interact/ })).toBeVisible();
  await expect(preview.getByText('Channel Ritual')).toBeVisible();
  await expect(preview.getByText('Spend 1 AP to advance the ritual to 2/2.')).toBeVisible();

  const ritualResult = await page.evaluate(() => {
    window.__empireOfNight?.interact();
    const snapshot = window.__empireOfNight?.snapshot();
    return {
      screen: snapshot.currentScreen,
      result: snapshot.battle?.result,
      heldTurns: snapshot.battle?.objective.type === 'hold_ritual' ? snapshot.battle.objective.heldTurns : 0,
      latestEvent: snapshot.battle?.events[0]?.message,
    };
  });

  expect(ritualResult).toEqual({
    screen: 'result',
    result: 'victory',
    heldTurns: 2,
    latestEvent: 'The ritual completes. Night banners rise over the crypt gate.',
  });

  await page.evaluate(() => {
    window.__empireOfNight?.startBattle('commander-duel');
    window.__empireOfNight?.selectUnit('knight');
    window.__empireOfNight?.move({ x: 2, y: 3 });
    window.__empireOfNight?.selectAction('interact');
  });

  await expect(preview.getByText('Open Relic Cache')).toBeVisible();
  await expect(preview.getByText('Spend 1 AP to restore 2 health and gain a stronger ward from this cache.')).toBeVisible();

  const cacheResult = await page.evaluate(() => {
    window.__empireOfNight?.interact();
    const battle = window.__empireOfNight?.snapshot().battle;
    const knight = battle?.units.find((unit) => unit.id === 'knight');
    return {
      claimedCaches: battle?.claimedRelicCaches,
      knightHp: knight?.hp,
      knightAp: knight?.actionPoints,
      wardedTurns: knight?.statuses.find((status) => status.id === 'warded')?.turns,
      latestEvent: battle?.events[0]?.message,
    };
  });

  expect(cacheResult).toEqual({
    claimedCaches: ['2,3'],
    knightHp: 16,
    knightAp: 0,
    wardedTurns: 3,
    latestEvent: 'Grave Knight opens a relic cache, restoring 2 health and gaining a ward.',
  });
});

test('capture relic objective resolves through tactical interaction', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__empireOfNight?.startBattle('market-relic');
  });

  await expect(page.getByText('Seize the auction relic ledger')).toBeVisible();
  await expect(page.getByText('Relic ledger still exposed.')).toBeVisible();

  const preview = page.locator('.hud-panel').filter({ has: page.getByRole('heading', { name: 'Tactical Preview' }) });
  await page.evaluate(() => {
    window.__empireOfNight?.move({ x: 3, y: 2 });
    window.__empireOfNight?.selectAction('interact');
  });
  await expect(preview.getByText('Seize Relic Ledger')).toBeVisible();
  await expect(preview.getByText('capture the auction ledger')).toBeVisible();

  const result = await page.evaluate(() => {
    window.__empireOfNight?.interact();
    const battle = window.__empireOfNight?.snapshot().battle;
    const regent = battle?.units.find((unit) => unit.id === 'regent');
    return {
      result: battle?.result,
      phase: battle?.phase,
      objectiveType: battle?.objective.type,
      captured: battle?.objective.type === 'capture_relic' ? battle.objective.captured : false,
      claimedCaches: battle?.claimedRelicCaches,
      regentWarded: regent?.statuses.find((status) => status.id === 'warded')?.turns,
      latestEvent: battle?.events[0]?.message,
      captureEvent: battle?.events[1]?.message,
    };
  });

  expect(result).toEqual({
    result: 'victory',
    phase: 'victory',
    objectiveType: 'capture_relic',
    captured: true,
    claimedCaches: ['3,2'],
    regentWarded: 3,
    latestEvent: 'The relic ledger is seized. Market oaths bend toward the night court.',
    captureEvent: 'Nocturne Regent seizes the relic ledger, restoring 2 health and gaining a ward.',
  });
});

test('survive dawn objective wins after enduring pressure waves', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__empireOfNight?.startBattle('chapel-pyre');
  });

  await expect(page.getByText('Survive 2 dawn waves under chapel sunfire.')).toBeVisible();
  await expect(page.getByText('Dawn waves endured 0/2.')).toBeVisible();

  const firstWave = await page.evaluate(() => {
    window.__empireOfNight?.endTurn();
    const battle = window.__empireOfNight?.snapshot().battle;
    return {
      result: battle?.result,
      survivedTurns: battle?.objective.type === 'survive_dawn' ? battle.objective.survivedTurns : -1,
      latestEvent: battle?.events[0]?.message,
    };
  });

  expect(firstWave).toEqual({
    result: 'none',
    survivedTurns: 1,
    latestEvent: 'Turn 2: dawn pressure rises to 2/6.',
  });
  await expect(page.getByText('Dawn waves endured 1/2.')).toBeVisible();

  const secondWave = await page.evaluate(() => {
    window.__empireOfNight?.endTurn();
    const battle = window.__empireOfNight?.snapshot().battle;
    return {
      phase: battle?.phase,
      result: battle?.result,
      survivedTurns: battle?.objective.type === 'survive_dawn' ? battle.objective.survivedTurns : -1,
      latestEvent: battle?.events[0]?.message,
      waveEvent: battle?.events[1]?.message,
    };
  });

  expect(secondWave).toEqual({
    phase: 'victory',
    result: 'victory',
    survivedTurns: 2,
    latestEvent: 'The court survives the dawn pyre. Chapel fires gutter into imperial ash.',
    waveEvent: 'The court endures dawn wave 2/2.',
  });
});

test('escape route objective wins through a fog bridge interaction', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__empireOfNight?.startBattle('canal-smugglers');
  });

  await expect(page.getByText('Escape one court unit through the fog bridge')).toBeVisible();
  await expect(page.getByText('Escaped 0/1 court units.')).toBeVisible();

  const preview = page.locator('.hud-panel').filter({ has: page.getByRole('heading', { name: 'Tactical Preview' }) });
  await page.evaluate(() => {
    window.__empireOfNight?.move({ x: 0, y: 4 });
    window.__empireOfNight?.selectAction('interact');
  });
  await expect(preview.getByText('Escape Fog Bridge')).toBeVisible();

  const result = await page.evaluate(() => {
    window.__empireOfNight?.interact();
    const battle = window.__empireOfNight?.snapshot().battle;
    const regent = battle?.units.find((unit) => unit.id === 'regent');
    return {
      phase: battle?.phase,
      result: battle?.result,
      objectiveType: battle?.objective.type,
      escapedUnitIds: battle?.objective.type === 'escape_route' ? battle.objective.escapedUnitIds : [],
      regentAp: regent?.actionPoints,
      regentWarded: regent?.statuses.find((status) => status.id === 'warded')?.turns,
      latestEvent: battle?.events[0]?.message,
      escapeEvent: battle?.events[1]?.message,
    };
  });

  expect(result).toEqual({
    phase: 'victory',
    result: 'victory',
    objectiveType: 'escape_route',
    escapedUnitIds: ['regent'],
    regentAp: 0,
    regentWarded: 2,
    latestEvent: 'The court slips through the fog bridge. Canal patrols lose the trail.',
    escapeEvent: 'Nocturne Regent escapes through the fog bridge (1/1).',
  });
});

test('protect unit objective wins if the court anchor survives', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__empireOfNight?.startBattle('wall-siege');
  });

  await expect(page.getByText('Protect the Veil Occultist for 2 turns')).toBeVisible();
  await expect(page.getByText('Veil Occultist guarded 0/2 turns.')).toBeVisible();

  const firstTurn = await page.evaluate(() => {
    window.__empireOfNight?.endTurn();
    const battle = window.__empireOfNight?.snapshot().battle;
    return {
      result: battle?.result,
      protectedTurns: battle?.objective.type === 'protect_unit' ? battle.objective.protectedTurns : -1,
      protectedHp: battle?.units.find((unit) => unit.id === 'occultist')?.hp,
    };
  });

  expect(firstTurn.result).toBe('none');
  expect(firstTurn.protectedTurns).toBe(1);
  expect(firstTurn.protectedHp).toBeGreaterThan(0);
  await expect(page.getByText('Veil Occultist guarded 1/2 turns.')).toBeVisible();

  const secondTurn = await page.evaluate(() => {
    window.__empireOfNight?.endTurn();
    const battle = window.__empireOfNight?.snapshot().battle;
    return {
      phase: battle?.phase,
      result: battle?.result,
      protectedTurns: battle?.objective.type === 'protect_unit' ? battle.objective.protectedTurns : -1,
      protectedHp: battle?.units.find((unit) => unit.id === 'occultist')?.hp,
      latestEvent: battle?.events[0]?.message,
      protectEvent: battle?.events[1]?.message,
    };
  });

  expect(secondTurn).toEqual({
    phase: 'victory',
    result: 'victory',
    protectedTurns: 2,
    protectedHp: firstTurn.protectedHp,
    latestEvent: 'Veil Occultist seals the breach. The wall opens to the night court.',
    protectEvent: 'Veil Occultist holds the breach ward (2/2).',
  });
});

test('result panel uses objective-specific victory copy', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__empireOfNight?.startBattle('canal-smugglers');
    window.__empireOfNight?.move({ x: 0, y: 4 });
    window.__empireOfNight?.selectAction('interact');
    window.__empireOfNight?.interact();
  });

  await expect(page.getByText('district escape complete')).toBeVisible();
  await expect(page.getByText('The fog bridge closes behind the court.')).toBeVisible();
  await expect(page.getByText('1/1 court units escaped')).toBeVisible();
  await expect(page.getByText('The crypt gate kneels.')).toHaveCount(0);
});

test('battle canvas renders move and attack hover previews', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.__empireOfNight?.startBattle('ritual-hold'));

  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Canvas bounds unavailable for hover preview test.');
  }
  const canvasSize = await canvas.evaluate((node: HTMLCanvasElement) => ({
    width: node.width,
    height: node.height,
  }));
  const pagePoint = (x: number, y: number) => ({
    x: box.x + (x / canvasSize.width) * box.width,
    y: box.y + (y / canvasSize.height) * box.height,
  });

  const beforeMoveHover = await canvas.screenshot();
  const movePoint = pagePoint(242, 394);
  await page.mouse.move(movePoint.x, movePoint.y);
  await page.waitForTimeout(80);
  const moveHover = await canvas.screenshot();
  expect(moveHover.equals(beforeMoveHover)).toBe(false);

  await page.evaluate(() => {
    window.__empireOfNight?.selectUnit('occultist');
    window.__empireOfNight?.move({ x: 2, y: 2 });
    window.__empireOfNight?.selectAction('attack');
  });

  const beforeAttackHover = await canvas.screenshot();
  const attackPoint = pagePoint(446, 258);
  await page.mouse.move(attackPoint.x, attackPoint.y);
  await page.waitForTimeout(80);
  const attackHover = await canvas.screenshot();
  expect(attackHover.equals(beforeAttackHover)).toBe(false);
});

test('battle canvas marks blocked line of sight on hover', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    window.__empireOfNight?.startRun('sightline-hover', 'standard', 'veil_oracle');
    window.__empireOfNight?.chooseRouteNode('market-ambush');
    window.__empireOfNight?.selectUnit('regent');
    window.__empireOfNight?.move({ x: 1, y: 1 });
    window.__empireOfNight?.selectUnit('occultist');
    window.__empireOfNight?.move({ x: 1, y: 2 });
    window.__empireOfNight?.selectAction('attack');
  });

  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Canvas bounds unavailable for blocked sightline hover test.');
  }
  const canvasSize = await canvas.evaluate((node: HTMLCanvasElement) => ({
    width: node.width,
    height: node.height,
  }));
  const pagePoint = (x: number, y: number) => ({
    x: box.x + (x / canvasSize.width) * box.width,
    y: box.y + (y / canvasSize.height) * box.height,
  });

  const beforeHover = await canvas.screenshot();
  const blockedTargetPoint = pagePoint(446, 258);
  await page.mouse.move(blockedTargetPoint.x, blockedTargetPoint.y);
  await page.waitForTimeout(80);
  const blockedHover = await canvas.screenshot();
  expect(blockedHover.equals(beforeHover)).toBe(false);
});

test('palace gate features a distinct Dawn Exarch boss', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => window.__empireOfNight?.startBattle('palace-gate'));
  await expect(page.getByText('Kill the Dawn Exarch')).toBeVisible();

  const battle = await page.evaluate(() => window.__empireOfNight?.snapshot().battle);
  const exarch = battle?.units.find((unit) => unit.id === 'dawn-exarch');
  expect(exarch?.commander).toBe(true);
  expect(exarch?.archetype).toBe('dawn_exarch');
  expect(exarch?.maxHp).toBe(20);
  expect(exarch?.abilities[0]?.id).toBe('solar-decree');
});

test('ritual battle can be won through deterministic squad actions', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__empireOfNight?.startBattle('ritual-hold');
    window.__empireOfNight?.selectUnit('knight');
    window.__empireOfNight?.move({ x: 3, y: 3 });
    window.__empireOfNight?.guard();
    window.__empireOfNight?.endTurn();
    window.__empireOfNight?.selectUnit('knight');
    window.__empireOfNight?.guard();
    window.__empireOfNight?.endTurn();
  });

  const result = await page.evaluate(() => window.__empireOfNight?.snapshot());
  expect(result?.currentScreen).toBe('result');
  expect(result?.battle?.result).toBe('victory');
  await expect(page.getByText('Night banners rise.')).toBeVisible();
  await expect(page.getByText('Objective ledger')).toBeVisible();
  await expect(page.getByText('2/2 ritual turns held')).toBeVisible();
  await expect(page.getByText('Spoils pending')).toBeVisible();
  await expect(page.getByText('Victory recorded')).toBeVisible();
});

test('ritual battle can be lost without console errors', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await page.goto('/');

  await page.evaluate(() => {
    window.__empireOfNight?.startBattle('ritual-hold');
    for (let index = 0; index < 6; index += 1) {
      window.__empireOfNight?.endTurn();
    }
  });

  const result = await page.evaluate(() => window.__empireOfNight?.snapshot());
  expect(result?.currentScreen).toBe('result');
  expect(result?.battle?.result).toBe('defeat');
  await expect(page.getByText('Dawn exposure')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The dawn meter is full.' })).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test('repeated restarts and scene transitions stay stable', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  for (let index = 0; index < 5; index += 1) {
    const state = await page.evaluate((cycle) => {
      window.__empireOfNight?.startRun(`loop-${cycle}`, cycle % 2 === 0 ? 'hard' : 'standard');
      const snapshot = window.__empireOfNight?.snapshot();
      const node = snapshot?.run?.route[0][0];
      if (node) {
        window.__empireOfNight?.chooseRouteNode(node.id);
      }
      window.__empireOfNight?.restartBattle();
      window.__empireOfNight?.restartBattle();
      window.__empireOfNight?.returnToMenu();
      const final = window.__empireOfNight?.snapshot();
      return {
        screen: final?.currentScreen,
        battle: final?.battle,
        run: final?.run,
      };
    }, index);

    expect(state.screen).toBe('menu');
    expect(state.battle).toBeNull();
    expect(state.run).toBeNull();
    await expect(page.locator('canvas')).toHaveCount(1);
  }

  await expect(page.getByText('Empire of Night')).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test('run rewards alter subsequent battle setup', async ({ page }) => {
  await page.goto('/');

  const playFirstReward = async (seed: string, rewardId: string) => {
    await page.evaluate((runSeed) => {
      window.__empireOfNight?.startRun(runSeed, 'standard');
      window.__empireOfNight?.chooseRouteNode('crypt-rite');
      window.__empireOfNight?.selectUnit('knight');
      window.__empireOfNight?.move({ x: 3, y: 3 });
      window.__empireOfNight?.guard();
      window.__empireOfNight?.endTurn();
      window.__empireOfNight?.selectUnit('knight');
      window.__empireOfNight?.guard();
      window.__empireOfNight?.endTurn();
      window.__empireOfNight?.continueAfterBattle();
    }, seed);
    await page.evaluate((id) => window.__empireOfNight?.chooseReward(id), rewardId);
    await page.evaluate(() => {
      const event = window.__empireOfNight?.snapshot().routeEvent;
      const hold = event?.choices.find((choice) => choice.id.includes('hold-formation'));
      if (hold) {
        window.__empireOfNight?.chooseRouteEvent(hold.id);
      }
    });
    await page.evaluate(() => window.__empireOfNight?.chooseRouteNode('canal-rite'));
    return page.evaluate(() => window.__empireOfNight?.snapshot().battle);
  };

  const upgradedBattle = await playFirstReward('reward-upgrade', 'crypt-rite-upgrade');
  const upgradedOccultist = upgradedBattle?.units.find((unit) => unit.archetype === 'occultist');
  expect(upgradedOccultist?.abilities[0]?.damage).toBe(4);
  expect(upgradedOccultist?.abilities[0]?.range).toBe(4);

  const doctrineBattle = await playFirstReward('reward-doctrine', 'crypt-rite-doctrine');
  const doctrineCourtDamage = doctrineBattle?.units
    .filter((unit) => unit.faction === 'court')
    .map((unit) => unit.abilities[0]?.damage);
  expect(doctrineCourtDamage).toEqual([5, 6, 4]);

  const relicBattle = await playFirstReward('reward-relic', 'crypt-rite-relic');
  const wardedCourtUnits = relicBattle?.units.filter(
    (unit) => unit.faction === 'court' && unit.statuses.some((status) => status.id === 'warded'),
  );
  const relicOccultist = relicBattle?.units.find((unit) => unit.archetype === 'occultist');
  expect(wardedCourtUnits).toHaveLength(1);
  expect(relicBattle?.dawn.max).toBe(8);
  expect(relicOccultist?.moveRange).toBe(4);
  expect(relicOccultist?.abilities[0]?.range).toBe(4);
});

test('relic reward cards preview their active battle command', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__empireOfNight?.startRun('reward-preview', 'standard');
    window.__empireOfNight?.chooseRouteNode('crypt-rite');
    window.__empireOfNight?.selectUnit('knight');
    window.__empireOfNight?.move({ x: 3, y: 3 });
    window.__empireOfNight?.guard();
    window.__empireOfNight?.endTurn();
    window.__empireOfNight?.selectUnit('knight');
    window.__empireOfNight?.guard();
    window.__empireOfNight?.endTurn();
    window.__empireOfNight?.continueAfterBattle();
  });

  await expect(page.getByRole('button', { name: /Canal Mirror/ })).toBeVisible();
  await expect(page.getByText('Active: spend AP to reopen this unit movement and gain Warded 2 once per battle.')).toBeVisible();
  const relicReward = await page.evaluate(() => window.__empireOfNight?.snapshot().rewards.find((reward) => reward.type === 'relic'));
  expect(relicReward?.activeDetail).toBe('Active: spend AP to reopen this unit movement and gain Warded 2 once per battle.');
});

test('bound relics provide an active once-per-battle command', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__empireOfNight?.startRun('active-relic', 'standard');
    window.__empireOfNight?.chooseRouteNode('crypt-rite');
    window.__empireOfNight?.selectUnit('knight');
    window.__empireOfNight?.move({ x: 3, y: 3 });
    window.__empireOfNight?.guard();
    window.__empireOfNight?.endTurn();
    window.__empireOfNight?.selectUnit('knight');
    window.__empireOfNight?.guard();
    window.__empireOfNight?.endTurn();
    window.__empireOfNight?.continueAfterBattle();
    window.__empireOfNight?.chooseReward('crypt-rite-relic');
    const event = window.__empireOfNight?.snapshot().routeEvent;
    const hold = event?.choices.find((choice) => choice.id.includes('hold-formation'));
    if (hold) {
      window.__empireOfNight?.chooseRouteEvent(hold.id);
    }
    window.__empireOfNight?.chooseRouteNode('canal-rite');
    window.__empireOfNight?.selectUnit('occultist');
    window.__empireOfNight?.move({ x: 2, y: 1 });
    window.__empireOfNight?.selectAction('relic');
  });

  const preview = page.locator('.hud-panel').filter({ has: page.getByRole('heading', { name: 'Tactical Preview' }) });
  await expect(page.getByRole('button', { name: /Relic/ })).toBeVisible();
  await expect(preview.getByText('Invoke Canal Mirror')).toBeVisible();
  await expect(preview.getByText('Spend Veil Occultist')).toBeVisible();

  const result = await page.evaluate(() => {
    window.__empireOfNight?.useRelic();
    const battle = window.__empireOfNight?.snapshot().battle;
    const occultist = battle?.units.find((unit) => unit.id === 'occultist');
    return {
      relicPowerUsed: battle?.relicPowerUsed,
      selectedAction: battle?.selectedAction,
      occultistMoved: occultist?.hasMoved,
      occultistAp: occultist?.actionPoints,
      wardedTurns: occultist?.statuses.find((status) => status.id === 'warded')?.turns,
      latestEvent: battle?.events[0]?.message,
    };
  });

  expect(result).toEqual({
    relicPowerUsed: true,
    selectedAction: 'move',
    occultistMoved: false,
    occultistAp: 0,
    wardedTurns: 2,
    latestEvent: 'Veil Occultist invokes Canal Mirror, reopening a mirrored path.',
  });

  const moveResult = await page.evaluate(() => {
    window.__empireOfNight?.move({ x: 2, y: 2 });
    const battle = window.__empireOfNight?.snapshot().battle;
    const occultist = battle?.units.find((unit) => unit.id === 'occultist');
    return {
      position: occultist?.position,
      latestEvent: battle?.events[0]?.message,
    };
  });

  expect(moveResult).toEqual({
    position: { x: 2, y: 2 },
    latestEvent: 'Veil Occultist moves to column 3, row 3.',
  });
});

test('route events create narrative choices and challenge modifiers', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__empireOfNight?.startRun('event-challenge', 'standard');
    window.__empireOfNight?.chooseRouteNode('crypt-rite');
    window.__empireOfNight?.selectUnit('knight');
    window.__empireOfNight?.move({ x: 3, y: 3 });
    window.__empireOfNight?.guard();
    window.__empireOfNight?.endTurn();
    window.__empireOfNight?.selectUnit('knight');
    window.__empireOfNight?.guard();
    window.__empireOfNight?.endTurn();
    window.__empireOfNight?.continueAfterBattle();
    window.__empireOfNight?.chooseReward('crypt-rite-blood');
  });

  await expect(page.getByText(/event · district 2/i)).toBeVisible();
  const eventState = await page.evaluate(() => window.__empireOfNight?.snapshot().routeEvent);
  expect(eventState?.choices.length).toBeGreaterThanOrEqual(3);

  await page.evaluate(() => {
    const event = window.__empireOfNight?.snapshot().routeEvent;
    const challenge = event?.choices.find((choice) => Boolean(choice.effects.challenge));
    if (challenge) {
      window.__empireOfNight?.chooseRouteEvent(challenge.id);
    }
  });

  const route = await page.evaluate(() => window.__empireOfNight?.snapshot());
  expect(route?.currentScreen).toBe('route');
  expect(route?.run?.eventHistory).toHaveLength(1);
  expect(route?.run?.challengeModifiers).toHaveLength(1);

  await page.evaluate(() => window.__empireOfNight?.chooseRouteNode('canal-rite'));
  const battle = await page.evaluate(() => window.__empireOfNight?.snapshot().battle);
  expect(battle?.events[0]?.message).toContain('1 challenges');
});

test('route event relic bargains preview their active command', async ({ page }) => {
  await page.goto('/');

  const eventState = await page.evaluate(() => {
    for (let index = 0; index < 30; index += 1) {
      window.__empireOfNight?.startRun(`event-relic-${index}`, 'standard');
      window.__empireOfNight?.chooseRouteNode('crypt-rite');
      window.__empireOfNight?.selectUnit('knight');
      window.__empireOfNight?.move({ x: 3, y: 3 });
      window.__empireOfNight?.guard();
      window.__empireOfNight?.endTurn();
      window.__empireOfNight?.selectUnit('knight');
      window.__empireOfNight?.guard();
      window.__empireOfNight?.endTurn();
      window.__empireOfNight?.continueAfterBattle();
      window.__empireOfNight?.chooseReward('crypt-rite-blood');

      const event = window.__empireOfNight?.snapshot().routeEvent;
      if (event?.choices.some((choice) => Boolean(choice.effects.relic))) {
        return event;
      }
    }

    return window.__empireOfNight?.snapshot().routeEvent;
  });

  const relicChoice = eventState?.choices.find((choice) => Boolean(choice.effects.relic));
  expect(relicChoice?.activeDetail).toMatch(/^Active: spend AP/);
  await expect(page.getByRole('button', { name: new RegExp(relicChoice?.title ?? 'missing relic choice') })).toBeVisible();
  await expect(page.getByText(relicChoice?.activeDetail ?? 'missing active detail')).toBeVisible();
});

test('high-risk route nodes spawn elite encounter variants', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__empireOfNight?.startRun('elite-risk', 'standard', 'nocturne_regent');
    window.__empireOfNight?.chooseRouteNode('crypt-rite');
    window.__empireOfNight?.selectUnit('knight');
    window.__empireOfNight?.move({ x: 3, y: 3 });
    window.__empireOfNight?.guard();
    window.__empireOfNight?.endTurn();
    window.__empireOfNight?.selectUnit('knight');
    window.__empireOfNight?.guard();
    window.__empireOfNight?.endTurn();
    window.__empireOfNight?.continueAfterBattle();
    window.__empireOfNight?.chooseReward('crypt-rite-blood');
    const event = window.__empireOfNight?.snapshot().routeEvent;
    const hold = event?.choices.find((choice) => choice.id.includes('hold-formation'));
    if (hold) {
      window.__empireOfNight?.chooseRouteEvent(hold.id);
    }
    window.__empireOfNight?.chooseRouteNode('chapel-bell');
  });

  const battle = await page.evaluate(() => window.__empireOfNight?.snapshot().battle);
  const elite = battle?.units.find((unit) => unit.name.startsWith('Elite '));
  expect(elite?.name).toBe('Elite Sun Acolyte');
  expect(elite?.maxHp).toBe(10);
  expect(elite?.armor).toBe(1);
  expect(battle?.events.some((event) => event.message.includes('anchors this high-risk district'))).toBe(true);
});

test('campaign route completes four encounters and records run history', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  const winRitual = async () => {
    await page.evaluate(() => {
      window.__empireOfNight?.selectUnit('knight');
      window.__empireOfNight?.move({ x: 3, y: 3 });
      window.__empireOfNight?.guard();
      window.__empireOfNight?.endTurn();
      window.__empireOfNight?.selectUnit('knight');
      window.__empireOfNight?.guard();
      window.__empireOfNight?.endTurn();
    });
  };

  await page.evaluate(() => window.__empireOfNight?.startRun());
  await expect(page.locator('[aria-label="Route progress"]')).toBeAttached();
  await expect(page.getByText('Carried pressure')).toBeVisible();
  await expect(page.getByText('Archive note')).toBeVisible();

  for (const nodeId of ['crypt-rite', 'canal-rite', 'wall-siege', 'palace-rite']) {
    await page.evaluate((id) => window.__empireOfNight?.chooseRouteNode(id), nodeId);
    await winRitual();
    await page.evaluate(() => window.__empireOfNight?.continueAfterBattle());
    await expect(page.locator('[aria-label="Reward ledger"]')).toBeAttached();
    const rewardId = await page.evaluate(() => window.__empireOfNight?.snapshot().rewards[0]?.id);
    await page.evaluate((id) => window.__empireOfNight?.chooseReward(id), rewardId);
    await page.evaluate(() => {
      const event = window.__empireOfNight?.snapshot().routeEvent;
      const hold = event?.choices.find((choice) => choice.id.includes('hold-formation'));
      if (hold) {
        window.__empireOfNight?.chooseRouteEvent(hold.id);
      }
    });
  }

  const summary = await page.evaluate(() => window.__empireOfNight?.snapshot());
  expect(summary?.currentScreen).toBe('runSummary');
  expect(summary?.run?.result).toBe('victory');
  expect(summary?.run?.victories).toBe(4);
  expect(summary?.meta.completedRuns).toBe(1);
  expect(summary?.meta.victories).toBe(1);
  expect(summary?.meta.runHistory[0]?.result).toBe('victory');
  expect(summary?.meta.runHistory[0]?.seed).toBe('night-0001');
  expect(summary?.meta.runHistory[0]?.difficulty).toBe('standard');
  await expect(page.getByText('The night empire advances.')).toBeVisible();
  await expect(page.getByText('Route conquered')).toBeVisible();
  await expect(page.getByText('Spoils and pressure')).toBeVisible();
  await expect(page.getByText('Codex written')).toBeVisible();
  await expect(page.getByText('Seal the Crypt Rite')).toBeVisible();
  await expect(page.getByText('Crown the Nightglass Throne')).toBeVisible();

  await page.reload();
  const reloaded = await page.evaluate(() => window.__empireOfNight?.snapshot().meta.runHistory[0]);
  expect(reloaded?.result).toBe('victory');
  expect(reloaded?.seed).toBe('night-0001');
  expect(reloaded?.difficulty).toBe('standard');

  await page.getByRole('button', { name: 'History' }).click();
  await expect(page.getByText('Imperial Record')).toBeVisible();
  await expect(page.getByText('4 wins')).toBeVisible();
});
