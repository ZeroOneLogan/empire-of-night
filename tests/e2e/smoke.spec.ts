import { test, expect } from '@playwright/test';

test('home page renders title', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Empire of Night')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(1);
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
      }

      rewardDoctrines.add(node.district);
    }

    return {
      routeCount: route.length,
      encounterCount: encounterIds.length,
      districts: districts.length,
      enemyTypes: enemyTypes.size,
      hazards: hazards.size,
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
  await page.getByLabel('Mute placeholder audio').check();
  await page.getByLabel('Reduce UI motion').check();

  let snapshot = await page.evaluate(() => window.__empireOfNight?.snapshot());
  expect(snapshot?.settings.muted).toBe(true);
  expect(snapshot?.settings.reducedMotion).toBe(true);

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
  await expect(page.getByText('The crypt gate kneels.')).toBeVisible();
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

  for (const nodeId of ['crypt-rite', 'canal-rite', 'wall-siege', 'palace-rite']) {
    await page.evaluate((id) => window.__empireOfNight?.chooseRouteNode(id), nodeId);
    await winRitual();
    await page.evaluate(() => window.__empireOfNight?.continueAfterBattle());
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

  await page.reload();
  const reloaded = await page.evaluate(() => window.__empireOfNight?.snapshot().meta.runHistory[0]);
  expect(reloaded?.result).toBe('victory');
  expect(reloaded?.seed).toBe('night-0001');
  expect(reloaded?.difficulty).toBe('standard');

  await page.getByRole('button', { name: 'History' }).click();
  await expect(page.getByText('Imperial Record')).toBeVisible();
  await expect(page.getByText('4 wins')).toBeVisible();
});
