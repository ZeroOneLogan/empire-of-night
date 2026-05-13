import { empireStore } from '../game/app';
import { getAttackDamagePreview, hasLineOfSight } from '../game/simulation/battle';
import type { BattleSnapshot, DifficultyBand, LeaderId, PlayerActionType, RouteNode } from '../game/simulation/types';

const snapshotRelicName = (snapshot: BattleSnapshot | undefined): string => snapshot?.run?.relics[0] ?? 'a bound relic';

export class EmpireOverlay {
  private readonly root: HTMLElement;
  private latest?: BattleSnapshot;
  private drawer: 'none' | 'pause' | 'settings' | 'history' = 'none';
  private menuSeed = 'night-0001';
  private menuDifficulty: DifficultyBand = 'standard';
  private menuLeader: LeaderId = 'nocturne_regent';

  constructor(root: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'empire-ui';
    root.appendChild(this.root);

    empireStore.subscribe((snapshot) => {
      this.latest = snapshot;
      this.render(snapshot);
    });
  }

  private render(snapshot: BattleSnapshot): void {
    this.root.innerHTML = '';
    this.root.dataset.reducedMotion = snapshot.settings.reducedMotion ? 'true' : 'false';

    if (snapshot.currentScreen === 'menu') {
      this.renderMenuShell();
      this.renderUtilityBar(snapshot);
      this.renderDrawer(snapshot);
      return;
    }

    if (snapshot.currentScreen === 'route') {
      this.renderRouteMap(snapshot);
      this.renderUtilityBar(snapshot);
      this.renderDrawer(snapshot);
      return;
    }

    if (snapshot.currentScreen === 'reward') {
      this.renderRewardScreen(snapshot);
      this.renderUtilityBar(snapshot);
      this.renderDrawer(snapshot);
      return;
    }

    if (snapshot.currentScreen === 'event') {
      this.renderRouteEvent(snapshot);
      this.renderUtilityBar(snapshot);
      this.renderDrawer(snapshot);
      return;
    }

    if (snapshot.currentScreen === 'runSummary') {
      this.renderRunSummary(snapshot);
      this.renderUtilityBar(snapshot);
      this.renderDrawer(snapshot);
      return;
    }

    if (!snapshot.battle) {
      return;
    }

    const battle = snapshot.battle;
    const frame = document.createElement('div');
    frame.className = 'hud-frame';

    const header = document.createElement('section');
    header.className = 'hud-header';
    header.innerHTML = `
      <div>
        <span class="eyebrow">Objective</span>
        <strong>${battle.objective.description}</strong>
      </div>
      <div class="dawn-meter">
        <span>Dawn ${battle.dawn.value}/${battle.dawn.max}</span>
        <div><i style="width:${(battle.dawn.value / battle.dawn.max) * 100}%"></i></div>
      </div>
    `;
    frame.appendChild(header);
    frame.appendChild(this.createFeedbackStrip(battle.events[0]?.message ?? 'Awaiting orders.'));

    const side = document.createElement('aside');
    side.className = 'battle-panel';
    side.appendChild(this.createUnitPanel());
    side.appendChild(this.createCommandPanel());
    side.appendChild(this.createTacticalPreviewPanel());
    side.appendChild(this.createIntentPanel());
    side.appendChild(this.createLogPanel());
    frame.appendChild(side);

    if (snapshot.currentScreen === 'result') {
      frame.appendChild(this.createResultPanel(snapshot));
    }

    this.root.appendChild(frame);
    this.renderUtilityBar(snapshot);
    this.renderDrawer(snapshot);
  }

  private renderMenuShell(): void {
    const shell = document.createElement('div');
    shell.className = 'menu-shell';
    shell.innerHTML = `
      <div class="menu-status">
        <span class="eyebrow">Milestone 8 build</span>
        <strong>Empire of Night</strong>
        <p>Seeded command run ready</p>
        <p>Set a deterministic seed, choose a difficulty band, then take a branching district route with visible risk and reward pressure.</p>
        <label class="seed-field">
          <span>Seed</span>
          <input type="text" maxlength="28" spellcheck="false" autocomplete="off" />
        </label>
        <div class="difficulty-row" aria-label="Difficulty">
          <button type="button" data-difficulty="standard">Standard</button>
          <button type="button" data-difficulty="hard">Hard</button>
          <button type="button" data-difficulty="nightmare">Nightmare</button>
        </div>
        <div class="leader-row" aria-label="Leader">
          ${empireStore
            .snapshot()
            .content.leaders.map(
              (leader) => `
                <button type="button" data-leader="${leader.id}">
                  <strong>${leader.title}</strong>
                  <small>${leader.effect}</small>
                </button>
              `,
            )
            .join('')}
        </div>
        <button type="button" class="primary-menu-action">Start Run</button>
      </div>
    `;
    const input = shell.querySelector<HTMLInputElement>('.seed-field input');
    if (input) {
      input.value = this.menuSeed;
      input.addEventListener('input', () => {
        this.menuSeed = input.value;
      });
    }
    shell.querySelectorAll<HTMLButtonElement>('[data-difficulty]').forEach((button) => {
      const difficulty = button.dataset.difficulty as DifficultyBand;
      button.classList.toggle('active', difficulty === this.menuDifficulty);
      button.addEventListener('click', () => {
        this.menuDifficulty = difficulty;
        this.latest && this.render(this.latest);
      });
    });
    shell.querySelectorAll<HTMLButtonElement>('[data-leader]').forEach((button) => {
      const leader = button.dataset.leader as LeaderId;
      button.classList.toggle('active', leader === this.menuLeader);
      button.addEventListener('click', () => {
        this.menuLeader = leader;
        this.latest && this.render(this.latest);
      });
    });
    shell.querySelector<HTMLButtonElement>('.primary-menu-action')?.addEventListener('click', () =>
      empireStore.dispatch({
        type: 'startRun',
        seed: this.menuSeed,
        difficulty: this.menuDifficulty,
        leader: this.menuLeader,
      }),
    );
    this.root.appendChild(shell);
  }

  private renderRouteMap(snapshot: BattleSnapshot): void {
    const run = snapshot.run;
    if (!run) {
      return;
    }

    const shell = document.createElement('div');
    shell.className = 'route-shell';
    const available = run.route[run.currentTier] ?? [];
    const balance = snapshot.balance;
    const completedNodes = this.completedRouteNodes(run.route, run.completedNodeIds);
    shell.innerHTML = `
      <section class="route-header">
        <span class="eyebrow">Campaign Route</span>
        <h1>Choose District ${run.currentTier + 1}/${run.route.length}</h1>
        <p>${this.leaderLabel(run.leader)} · Blood ${run.resources.blood} · Authority ${run.resources.authority} · Doctrine ${run.doctrine} · Relics ${run.relics.length}</p>
        <div class="run-diagnostics">
          <span>${this.difficultyLabel(run.difficulty)}</span>
          <span>Seed ${run.seed}</span>
          <span>${run.estimatedMinutes} min estimate</span>
          <span>Risk ${balance?.riskCounts.low ?? 0}/${balance?.riskCounts.standard ?? 0}/${balance?.riskCounts.high ?? 0}</span>
          <span>${Math.round((balance?.dominantRiskShare ?? 0) * 100)}% top risk share</span>
          <span>${run.challengeModifiers.length} challenge${run.challengeModifiers.length === 1 ? '' : 's'}</span>
        </div>
      </section>
      <section class="route-progress" aria-label="Route progress">
        ${run.route
          .map((tier, index) => {
            const completed = completedNodes[index];
            const isCurrent = index === run.currentTier;
            const label = completed ? completed.title : isCurrent ? `${tier.length} districts available` : 'Unscouted';
            return `<div class="${completed ? 'complete' : isCurrent ? 'current' : 'future'}"><span>${index + 1}</span><strong>${label}</strong><small>${completed ? `${completed.district} captured` : isCurrent ? 'Awaiting imperial order' : 'Future pressure'}</small></div>`;
          })
          .join('')}
      </section>
      <section class="route-map"></section>
      <section class="route-intel">
        <div>
          <span class="eyebrow">Carried pressure</span>
          <strong>${run.challengeModifiers.length > 0 ? run.challengeModifiers.map((challenge) => challenge.replace('_', ' ')).join(', ') : 'No active challenge'}</strong>
          <small>${run.relics.length} relics · ${run.upgrades.length} upgrades · ${run.eventHistory.length} events resolved</small>
        </div>
        <div>
          <span class="eyebrow">Archive note</span>
          <strong>${run.codexEntries.at(-1) ?? 'No district codex written yet.'}</strong>
          <small>${completedNodes.length}/${run.route.length} districts secured on this route.</small>
        </div>
      </section>
    `;

    const map = shell.querySelector('.route-map');
    for (const node of available) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `route-node ${node.risk}`;
      button.innerHTML = `
        <span class="eyebrow">${node.district} · ${node.risk} risk</span>
        <strong>${node.title}</strong>
        <small>${this.routeObjectiveLabel(node)}</small>
        <span class="route-node-meta"><b>${this.routeRiskLabel(node.risk)}</b><b>${this.routeRewardHint(node)}</b></span>
        <em>${node.codex}</em>
      `;
      button.addEventListener('click', () => empireStore.dispatch({ type: 'chooseRouteNode', nodeId: node.id }));
      map?.appendChild(button);
    }

    this.root.appendChild(shell);
  }

  private createUnitPanel(): HTMLElement {
    const panel = this.panel('Forces');
    const battle = this.latest?.battle;
    if (!battle) {
      return panel;
    }

    for (const unit of battle.units) {
      const row = document.createElement(unit.faction === 'court' && !unit.downed ? 'button' : 'div');
      row.className = `unit-row ${unit.faction} ${unit.id === battle.activeUnitId ? 'active' : ''} ${unit.downed ? 'downed' : ''}`;
      row.innerHTML = `
        <span>
          ${unit.name}
          <small>${unit.archetype.replace('_', ' ')}${unit.statuses.length > 0 ? ` · ${unit.statuses.map((status) => status.label).join(', ')}` : ''}</small>
        </span>
        <strong>${unit.hp}/${unit.maxHp}</strong>
      `;
      if (unit.faction === 'court' && !unit.downed) {
        row.type = 'button';
        row.addEventListener('click', () => empireStore.dispatch({ type: 'selectUnit', unitId: unit.id }));
      }
      panel.appendChild(row);
    }

    return panel;
  }

  private createCommandPanel(): HTMLElement {
    const panel = this.panel('Commands');
    const battle = this.latest?.battle;
    if (!battle) {
      return panel;
    }

    const commandMap: Array<{ label: string; action: PlayerActionType; hotkey: string }> = [
      { label: 'Move', action: 'move', hotkey: '1' },
      { label: 'Attack', action: 'attack', hotkey: '2' },
      { label: 'Special', action: 'special', hotkey: '4' },
      { label: 'Interact', action: 'interact', hotkey: '5' },
      ...(this.latest?.run?.relics.length ? [{ label: 'Relic', action: 'relic' as PlayerActionType, hotkey: 'R' }] : []),
      { label: 'Guard', action: 'guard', hotkey: '3' },
      { label: 'End Turn', action: 'endTurn', hotkey: 'Spc' },
    ];

    const row = document.createElement('div');
    row.className = 'command-grid';

    for (const command of commandMap) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = battle.selectedAction === command.action ? 'active' : '';
      button.innerHTML = `<span>${command.hotkey}</span>${command.label}`;
      button.disabled = battle.phase !== 'player' || (command.action === 'relic' && battle.relicPowerUsed);
      button.addEventListener('click', () => {
        if (command.action === 'guard') {
          empireStore.dispatch({ type: 'guard' });
        } else if (command.action === 'endTurn') {
          empireStore.dispatch({ type: 'endTurn' });
        } else if (command.action === 'relic' && battle.selectedAction === 'relic') {
          empireStore.dispatch({ type: 'useRelic' });
        } else {
          empireStore.dispatch({ type: 'selectAction', action: command.action });
        }
      });
      row.appendChild(button);
    }

    const cycle = document.createElement('button');
    cycle.type = 'button';
    cycle.innerHTML = '<span>Tab</span>Cycle Unit';
    cycle.disabled = battle.phase !== 'player';
    cycle.addEventListener('click', () => empireStore.dispatch({ type: 'cycleUnit' }));
    row.appendChild(cycle);

    const active = battle.units.find((unit) => unit.id === battle.activeUnitId);
    const hint = document.createElement('p');
    hint.className = 'command-hint';
    const ability = battle.selectedAction === 'special' ? active?.abilities[1] : active?.abilities[0];
    hint.textContent =
      battle.selectedAction === 'attack' || battle.selectedAction === 'special'
        ? `Click an enemy with a gold ring to use ${ability?.name ?? 'the active attack'}.`
        : battle.selectedAction === 'move'
          ? `Click a blue tile to move ${active?.name ?? 'the active unit'}.`
          : battle.selectedAction === 'interact'
            ? `Click ${active?.name ?? 'the active unit'} on a ritual or relic cache tile to interact.`
            : battle.selectedAction === 'relic'
              ? `Click Relic again or press R to invoke ${snapshotRelicName(this.latest)}.`
            : `${active?.name ?? 'The court'} is waiting for orders.`;

    panel.append(row, hint);
    return panel;
  }

  private createTacticalPreviewPanel(): HTMLElement {
    const panel = this.panel('Tactical Preview');
    const battle = this.latest?.battle;
    if (!battle) {
      return panel;
    }

    const active = battle.units.find((unit) => unit.id === battle.activeUnitId);
    if (!active) {
      const empty = document.createElement('p');
      empty.className = 'preview-empty';
      empty.textContent = 'No active court unit.';
      panel.appendChild(empty);
      return panel;
    }

    const summary = document.createElement('div');
    summary.className = 'preview-active';
    summary.innerHTML = `
      <strong>${active.name}</strong>
      <span>AP ${active.actionPoints}/${active.maxActionPoints} · Move ${active.moveRange} · Armor ${active.armor}</span>
    `;
    panel.appendChild(summary);

    const chips = document.createElement('div');
    chips.className = 'preview-chips';
    const statusText =
      active.statuses.length > 0 ? active.statuses.map((status) => `${status.label} ${status.turns}`).join(', ') : 'No status';
    const ability = battle.selectedAction === 'special' ? active.abilities[1] : active.abilities[0];
    chips.innerHTML = `
      <span>${battle.selectedAction}</span>
      <span>${battle.selectedAction === 'interact' ? 'Board Interact' : battle.selectedAction === 'relic' ? snapshotRelicName(this.latest) : ability.name}</span>
      <span>${statusText}</span>
    `;
    panel.appendChild(chips);

    if (battle.selectedAction === 'relic') {
      const detail = this.relicDetail(active, battle);
      const preview = document.createElement('div');
      preview.className = `interaction-preview ${detail.available ? 'available' : ''}`;
      preview.innerHTML = `
        <strong>${detail.title}</strong>
        <small>${detail.description}</small>
      `;
      panel.appendChild(preview);
      return panel;
    }

    if (battle.selectedAction === 'attack' || battle.selectedAction === 'special') {
      if (!ability) {
        const empty = document.createElement('p');
        empty.className = 'preview-empty';
        empty.textContent = `${active.name} has no active ability for this command.`;
        panel.appendChild(empty);
        return panel;
      }

      const targets = battle.units.filter(
        (unit) =>
          unit.faction === 'dawn' &&
          !unit.downed &&
          unit.hp > 0 &&
          this.gridDistance(active.position, unit.position) <= ability.range,
      );

      if (targets.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'preview-empty';
        empty.textContent = `${ability.name} has no target in range ${ability.range}.`;
        panel.appendChild(empty);
        return panel;
      }

      for (const target of targets) {
        const hasSight = hasLineOfSight(battle, active.position, target.position, ability.range);
        if (!hasSight) {
          const row = document.createElement('div');
          row.className = 'preview-target blocked';
          row.innerHTML = `
            <span>
              <strong>${target.name}</strong>
              <small>Line blocked · Range ${this.gridDistance(active.position, target.position)}/${ability.range}</small>
            </span>
            <em>No sightline</em>
          `;
          panel.appendChild(row);
          continue;
        }

        const attackPreview = getAttackDamagePreview(battle, active.id, target.id, ability.damage, ability.range);
        const damage = attackPreview?.damage ?? 1;
        const remaining = Math.max(0, target.hp - damage);
        const row = document.createElement('div');
        row.className = `preview-target ${remaining === 0 ? 'lethal' : ''}`;
        row.innerHTML = `
          <span>
            <strong>${target.name}</strong>
            <small>${target.armor > 0 ? `Armor ${target.armor}` : 'No armor'}${this.isInCover(target, battle) ? ' · Cover' : ''}${attackPreview?.flankBonus ? ' · Flanked' : ''}${target.statuses.length > 0 ? ` · ${target.statuses.map((status) => status.label).join(', ')}` : ''}</small>
          </span>
          <em>Damage ${damage} · HP ${target.hp}->${remaining}${attackPreview?.flankBonus ? ' · +1 flank' : ''}</em>
        `;
        panel.appendChild(row);
      }

      return panel;
    }

    if (battle.selectedAction === 'interact') {
      const detail = this.interactionDetail(active, battle);
      const preview = document.createElement('div');
      preview.className = `interaction-preview ${detail.available ? 'available' : ''}`;
      preview.innerHTML = `
        <strong>${detail.title}</strong>
        <small>${detail.description}</small>
      `;
      panel.appendChild(preview);
      return panel;
    }

    if (battle.selectedAction === 'move') {
      const reachable = empireStore.reachableTiles();
      const move = document.createElement('p');
      move.className = 'preview-empty';
      move.textContent = active.hasMoved
        ? `${active.name} has already moved this turn.`
        : `${reachable.length} legal tile${reachable.length === 1 ? '' : 's'} in movement preview.`;
      panel.appendChild(move);
      return panel;
    }

    const guard = document.createElement('p');
    guard.className = 'preview-empty';
    guard.textContent =
      battle.selectedAction === 'guard'
        ? 'Guard reduces the next incoming hit by 2 before armor and warding.'
        : 'Ending the turn resolves visible dawn intent in order.';
    panel.appendChild(guard);
    return panel;
  }

  private createIntentPanel(): HTMLElement {
    const panel = this.panel('Enemy Intent');
    const battle = this.latest?.battle;
    if (!battle) {
      return panel;
    }

    if (battle.objective.type === 'hold_ritual') {
      const progress = document.createElement('p');
      progress.className = 'objective-progress';
      progress.textContent = `Ritual held ${battle.objective.heldTurns}/${battle.objective.requiredTurns} turns.`;
      panel.appendChild(progress);
    } else if (battle.objective.type === 'capture_relic') {
      const progress = document.createElement('p');
      progress.className = 'objective-progress';
      progress.textContent = battle.objective.captured ? 'Relic ledger secured.' : 'Relic ledger still exposed.';
      panel.appendChild(progress);
    } else if (battle.objective.type === 'survive_dawn') {
      const progress = document.createElement('p');
      progress.className = 'objective-progress';
      progress.textContent = `Dawn waves endured ${battle.objective.survivedTurns}/${battle.objective.requiredTurns}.`;
      panel.appendChild(progress);
    } else if (battle.objective.type === 'escape_route') {
      const progress = document.createElement('p');
      progress.className = 'objective-progress';
      progress.textContent = `Escaped ${battle.objective.escapedUnitIds.length}/${battle.objective.requiredEscapes} court units.`;
      panel.appendChild(progress);
    } else if (battle.objective.type === 'protect_unit') {
      const protectedUnit = battle.units.find((unit) => unit.id === battle.objective.protectedUnitId);
      const progress = document.createElement('p');
      progress.className = 'objective-progress';
      progress.textContent = `${protectedUnit?.name ?? 'Protected unit'} guarded ${battle.objective.protectedTurns}/${battle.objective.requiredTurns} turns.`;
      panel.appendChild(progress);
    }

    for (const intent of battle.enemyIntents) {
      const item = document.createElement('p');
      item.className = `intent ${intent.action}`;
      item.textContent = intent.description;
      panel.appendChild(item);
    }

    return panel;
  }

  private createLogPanel(): HTMLElement {
    const panel = this.panel('Chronicle');
    const battle = this.latest?.battle;
    if (!battle) {
      return panel;
    }

    for (const event of battle.events) {
      const item = document.createElement('p');
      item.className = `log ${event.tone}`;
      item.textContent = event.message;
      panel.appendChild(item);
    }

    return panel;
  }

  private createFeedbackStrip(message: string): HTMLElement {
    const strip = document.createElement('section');
    strip.className = 'feedback-strip';
    strip.textContent = message;
    return strip;
  }

  private createResultPanel(snapshot: BattleSnapshot): HTMLElement {
    const result = document.createElement('section');
    const battle = snapshot.battle;
    const won = battle?.result === 'victory';
    const run = snapshot.run;
    const selectedNode = run?.route.flat().find((node) => node.id === run.selectedNodeId);
    const court = battle?.units.filter((unit) => unit.faction === 'court') ?? [];
    const enemies = battle?.units.filter((unit) => unit.faction === 'dawn') ?? [];
    const survivors = court.filter((unit) => !unit.downed && unit.hp > 0);
    const defeated = enemies.filter((unit) => unit.downed || unit.hp <= 0);
    const objective = !battle
      ? 'No battle record available'
      : battle.objective.type === 'hold_ritual'
        ? `${battle.objective.heldTurns}/${battle.objective.requiredTurns} ritual turns held`
        : battle.objective.type === 'capture_relic'
          ? battle.objective.captured
            ? 'Relic ledger seized'
            : 'Relic ledger left exposed'
          : battle.objective.type === 'survive_dawn'
            ? `${battle.objective.survivedTurns}/${battle.objective.requiredTurns} dawn waves endured`
            : battle.objective.type === 'escape_route'
              ? `${battle.objective.escapedUnitIds.length}/${battle.objective.requiredEscapes} court units escaped`
              : battle.objective.type === 'protect_unit'
              ? `${battle.objective.protectedTurns}/${battle.objective.requiredTurns} protected turns held`
              : `${battle.units.find((unit) => unit.id === battle.objective.commanderId)?.name ?? 'Commander'} neutralized`;
    const outcome = this.battleOutcomeCopy(battle, won, selectedNode);
    result.className = `result-panel ${won ? 'victory' : 'defeat'}`;
    result.innerHTML = `
      <span class="eyebrow">${outcome.eyebrow}</span>
      <h2>${outcome.title}</h2>
      <p>${outcome.description}</p>
      <div class="result-stats" aria-label="Battle outcome">
        <span><strong>${survivors.length}/${court.length}</strong><small>survivors</small></span>
        <span><strong>${defeated.length}/${enemies.length}</strong><small>dawn broken</small></span>
        <span><strong>${battle?.dawn.value ?? 0}/${battle?.dawn.max ?? 0}</strong><small>dawn meter</small></span>
      </div>
      <div class="result-ledger">
        <div>
          <span class="eyebrow">Objective ledger</span>
          <strong>${objective}</strong>
          <small>${run ? `${this.leaderLabel(run.leader)} - ${this.difficultyLabel(run.difficulty)} - seed ${run.seed}` : 'Standalone deterministic encounter'}</small>
        </div>
        <div>
          <span class="eyebrow">Spoils pending</span>
          <strong>${won && run ? 'Reward choice unlocked' : won ? 'Victory recorded' : 'No spoils claimed'}</strong>
          <small>${run ? `${run.relics.length} relics, ${run.upgrades.length} upgrades, ${run.challengeModifiers.length} challenges carried` : 'Use the command table to start a campaign route.'}</small>
        </div>
      </div>
    `;

    const controls = document.createElement('div');
    controls.className = 'result-actions';
    if (won && snapshot.run) {
      const next = document.createElement('button');
      next.type = 'button';
      next.textContent = 'Claim Reward';
      next.addEventListener('click', () => empireStore.dispatch({ type: 'continueAfterBattle' }));
      controls.appendChild(next);
    }
    const restart = document.createElement('button');
    restart.type = 'button';
    restart.textContent = 'Restart Battle';
    restart.addEventListener('click', () => empireStore.dispatch({ type: 'restartBattle' }));
    const menu = document.createElement('button');
    menu.type = 'button';
    menu.textContent = 'Command Table';
    menu.addEventListener('click', () => empireStore.dispatch({ type: 'returnToMenu' }));
    controls.append(restart, menu);
    result.appendChild(controls);
    return result;
  }

  private battleOutcomeCopy(
    battle: BattleSnapshot['battle'],
    won: boolean,
    selectedNode: RouteNode | undefined,
  ): { eyebrow: string; title: string; description: string } {
    if (!battle) {
      return {
        eyebrow: 'Battle lost',
        title: 'The dawn claims the field.',
        description: 'The court has been broken on the field. Restart the encounter or return to the command table with the same deterministic rules.',
      };
    }

    const district = selectedNode?.district ?? 'district';
    const title = selectedNode?.title ?? 'The district';

    if (!won) {
      const protectedUnit =
        battle.objective.type === 'protect_unit'
          ? battle.units.find((unit) => unit.id === battle.objective.protectedUnitId)
          : undefined;

      if (battle.objective.type === 'protect_unit' && (!protectedUnit || protectedUnit.downed || protectedUnit.hp <= 0)) {
        return {
          eyebrow: `${district} ward broken`,
          title: `${protectedUnit?.name ?? 'The protected unit'} falls.`,
          description: `${title} collapses because the court could not protect its fragile anchor.`,
        };
      }

      if (battle.dawn.value >= battle.dawn.max) {
        return {
          eyebrow: 'Dawn exposure',
          title: 'The dawn meter is full.',
          description: `${title} is exposed before the court can finish the objective. Restart the encounter or return to the command table.`,
        };
      }

      const courtAlive = battle.units.some((unit) => unit.faction === 'court' && !unit.downed && unit.hp > 0);
      if (!courtAlive) {
        return {
          eyebrow: 'Court broken',
          title: 'The court falls.',
          description: `${title} is lost because no court unit can still command the field.`,
        };
      }

      return {
        eyebrow: 'Battle lost',
        title: 'The dawn claims the field.',
        description: 'The court has been broken on the field. Restart the encounter or return to the command table with the same deterministic rules.',
      };
    }

    const claim = `${title} is secured. Claim a reward, then decide what pressure the empire can survive next.`;

    switch (battle.objective.type) {
      case 'hold_ritual':
        return {
          eyebrow: `${district} rite secured`,
          title: 'Night banners rise.',
          description: claim,
        };
      case 'eliminate_commander': {
        const commander = battle.units.find((unit) => unit.id === battle.objective.commanderId);
        return {
          eyebrow: `${district} command broken`,
          title: `${commander?.name ?? 'The commander'} falls.`,
          description: `${title} loses its dawn command. The court can press deeper into the route.`,
        };
      }
      case 'capture_relic':
        return {
          eyebrow: `${district} relic secured`,
          title: 'The ledger is in imperial hands.',
          description: `${title} yields its hidden archive. The court carries new leverage into the next district.`,
        };
      case 'survive_dawn':
        return {
          eyebrow: `${district} pyre endured`,
          title: 'The dawn wave breaks.',
          description: `${title} burns out before the court does. The route remains open under ash and smoke.`,
        };
      case 'escape_route':
        return {
          eyebrow: `${district} escape complete`,
          title: 'The fog bridge closes behind the court.',
          description: `${title} loses the trail. The empire keeps its momentum without a pitched finish.`,
        };
      case 'protect_unit': {
        const protectedUnit = battle.units.find((unit) => unit.id === battle.objective.protectedUnitId);
        return {
          eyebrow: `${district} ward held`,
          title: `${protectedUnit?.name ?? 'The protected unit'} survives.`,
          description: `${title} is secured because the court protected its fragile anchor.`,
        };
      }
    }
  }

  private renderRewardScreen(snapshot: BattleSnapshot): void {
    const shell = document.createElement('div');
    const run = snapshot.run;
    shell.className = 'reward-shell';
    shell.innerHTML = `
      <section class="reward-header">
        <span class="eyebrow">Battle Reward</span>
        <h1>Choose what the empire keeps.</h1>
        <p>${run ? `${this.leaderLabel(run.leader)} · Doctrine ${run.doctrine} · Blood ${run.resources.blood} · Authority ${run.resources.authority}` : 'Standalone battle victory'}</p>
      </section>
      <section class="reward-ledger" aria-label="Reward ledger">
        <span><strong>${run?.relics.length ?? 0}</strong><small>relics bound</small></span>
        <span><strong>${run?.upgrades.length ?? 0}</strong><small>unit upgrades</small></span>
        <span><strong>${run?.challengeModifiers.length ?? 0}</strong><small>challenges carried</small></span>
      </section>
      <section class="reward-grid"></section>
    `;

    const grid = shell.querySelector('.reward-grid');
    for (const reward of snapshot.rewards) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `reward-option ${reward.type}`;
      button.innerHTML = `
        <span class="eyebrow">${reward.type}</span>
        <strong>${reward.title}</strong>
        <small>${reward.description}</small>
        ${reward.activeDetail ? `<span class="reward-active">${reward.activeDetail}</span>` : ''}
        <em>${reward.comparison}</em>
      `;
      button.addEventListener('click', () => empireStore.dispatch({ type: 'chooseReward', rewardId: reward.id }));
      grid?.appendChild(button);
    }

    this.root.appendChild(shell);
  }

  private renderRouteEvent(snapshot: BattleSnapshot): void {
    const event = snapshot.routeEvent;
    const run = snapshot.run;
    if (!event || !run) {
      return;
    }

    const shell = document.createElement('div');
    shell.className = 'event-shell';
    shell.innerHTML = `
      <section class="event-header">
        <span class="eyebrow">${event.district} event · district ${event.tier + 1}</span>
        <h1>${event.title}</h1>
        <p>${event.description}</p>
        <div class="event-stakes">
          <span>Blood ${run.resources.blood}</span>
          <span>Authority ${run.resources.authority}</span>
          <span>Doctrine ${run.doctrine}</span>
          <span>${run.challengeModifiers.length} challenge${run.challengeModifiers.length === 1 ? '' : 's'}</span>
        </div>
      </section>
      <section class="event-grid"></section>
    `;

    const grid = shell.querySelector('.event-grid');
    for (const choice of event.choices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `event-option ${choice.effects.challenge ? 'challenge' : 'boon'}`;
      button.innerHTML = `
        <span class="eyebrow">${choice.effects.challenge ? 'Challenge bargain' : 'Imperial maneuver'}</span>
        <strong>${choice.title}</strong>
        <small>${choice.description}</small>
        ${choice.activeDetail ? `<span class="reward-active">${choice.activeDetail}</span>` : ''}
        <em>${choice.comparison}</em>
      `;
      button.addEventListener('click', () => empireStore.dispatch({ type: 'chooseRouteEvent', choiceId: choice.id }));
      grid?.appendChild(button);
    }

    this.root.appendChild(shell);
  }

  private renderRunSummary(snapshot: BattleSnapshot): void {
    const run = snapshot.run;
    if (!run) {
      return;
    }

    const shell = document.createElement('div');
    shell.className = 'summary-shell';
    const completedNodes = run.completedNodeIds
      .map((nodeId) => run.route.flat().find((node) => node.id === nodeId))
      .filter((node): node is NonNullable<typeof node> => Boolean(node));
    const routeRows = completedNodes
      .map(
        (node, index) =>
          `<li><span>${index + 1}</span><strong>${node.title}</strong><small>${node.district} - ${node.risk} risk</small></li>`,
      )
      .join('');
    const spoils = [
      ...run.relics.map((relic) => `<li><strong>${relic}</strong><small>Relic bound</small></li>`),
      ...run.upgrades.map((upgrade) => `<li><strong>${upgrade}</strong><small>Unit upgrade</small></li>`),
      ...run.challengeModifiers.map((challenge) => `<li><strong>${challenge.replace('_', ' ')}</strong><small>Challenge survived</small></li>`),
    ].join('');
    const codex = run.codexEntries
      .slice(-4)
      .map((entry) => `<li><strong>${entry}</strong></li>`)
      .join('');
    shell.innerHTML = `
      <section class="summary-panel">
        <span class="eyebrow">${run.result === 'victory' ? 'Capital approach secured' : 'Run ended'}</span>
        <h1>${run.result === 'victory' ? 'The night empire advances.' : 'The dawn holds the field.'}</h1>
        <p>${this.leaderLabel(run.leader)} - ${this.difficultyLabel(run.difficulty)} - Seed ${run.seed} - ${run.estimatedMinutes} minute run target</p>
        <div class="summary-stats" aria-label="Campaign ledger">
          <span><strong>${run.victories}/${run.route.length}</strong><small>districts won</small></span>
          <span><strong>${run.resources.blood}</strong><small>blood</small></span>
          <span><strong>${run.resources.authority}</strong><small>authority</small></span>
          <span><strong>${run.doctrine}</strong><small>doctrine</small></span>
          <span><strong>${snapshot.meta.victories}/${snapshot.meta.completedRuns}</strong><small>meta record</small></span>
        </div>
        <div class="summary-ledger">
          <section>
            <span class="eyebrow">Route conquered</span>
            <ol>${routeRows || '<li><span>0</span><strong>No districts captured</strong><small>The run ended before a route victory.</small></li>'}</ol>
          </section>
          <section>
            <span class="eyebrow">Spoils and pressure</span>
            <ul>${spoils || '<li><strong>No spoils carried</strong><small>Claim rewards to build future runs.</small></li>'}</ul>
          </section>
        </div>
        <div class="summary-codex">
          <span class="eyebrow">Codex written</span>
          <ul>${codex || '<li><strong>No codex entries recorded.</strong></li>'}</ul>
        </div>
        <button type="button" class="primary-menu-action">Start New Run</button>
      </section>
    `;
    shell.querySelector('button')?.addEventListener('click', () => empireStore.dispatch({ type: 'startRun' }));
    this.root.appendChild(shell);
  }

  private renderUtilityBar(snapshot: BattleSnapshot): void {
    const bar = document.createElement('nav');
    bar.className = 'utility-bar';
    const actions: Array<{ label: string; drawer: typeof this.drawer }> = [
      { label: snapshot.currentScreen === 'battle' || snapshot.currentScreen === 'result' ? 'Pause' : 'Menu', drawer: 'pause' },
      { label: 'History', drawer: 'history' },
      { label: 'Settings', drawer: 'settings' },
    ];

    for (const action of actions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = action.label;
      button.className = this.drawer === action.drawer ? 'active' : '';
      button.addEventListener('click', () => {
        this.drawer = this.drawer === action.drawer ? 'none' : action.drawer;
        this.latest && this.render(this.latest);
      });
      bar.appendChild(button);
    }

    this.root.appendChild(bar);
  }

  private renderDrawer(snapshot: BattleSnapshot): void {
    if (this.drawer === 'none') {
      return;
    }

    const drawer = document.createElement('aside');
    drawer.className = `utility-drawer ${this.drawer}`;

    if (this.drawer === 'pause') {
      drawer.innerHTML = `
        <span class="eyebrow">Command Pause</span>
        <h2>${snapshot.currentScreen === 'battle' || snapshot.currentScreen === 'result' ? 'Battle paused' : 'Command table'}</h2>
        <p>Use 1/2/3 for move, attack, guard; Tab cycles units; Space ends turn; Esc returns to the command table.</p>
        <button type="button" data-action="resume">Resume</button>
        <button type="button" data-action="menu">Command Table</button>
      `;
      drawer.querySelector('[data-action="resume"]')?.addEventListener('click', () => {
        this.drawer = 'none';
        this.latest && this.render(this.latest);
      });
      drawer.querySelector('[data-action="menu"]')?.addEventListener('click', () => {
        this.drawer = 'none';
        empireStore.dispatch({ type: 'returnToMenu' });
      });
    }

    if (this.drawer === 'settings') {
      drawer.innerHTML = `
        <span class="eyebrow">Settings</span>
        <h2>Table Preferences</h2>
        <label><input type="checkbox" data-setting="muted" ${snapshot.settings.muted ? 'checked' : ''} /> Mute game audio</label>
        <label><input type="checkbox" data-setting="reducedMotion" ${snapshot.settings.reducedMotion ? 'checked' : ''} /> Reduce UI motion</label>
      `;
      drawer.querySelectorAll<HTMLInputElement>('input[data-setting]').forEach((input) => {
        input.addEventListener('change', () => {
          const key = input.dataset.setting;
          if (key !== 'muted' && key !== 'reducedMotion') {
            return;
          }
          empireStore.dispatch({
            type: 'updateSettings',
            settings: {
              [key]: input.checked,
            },
          });
        });
      });
    }

    if (this.drawer === 'history') {
      const rows = snapshot.meta.runHistory
        .slice(0, 5)
        .map(
          (entry) =>
            `<li><strong>${entry.result}</strong><span>${entry.victories} wins · ${this.leaderLabel(entry.leader ?? 'nocturne_regent')} · ${entry.doctrine} · ${entry.relics} relics · ${entry.challenges ?? 0} challenges · ${entry.difficulty ?? 'standard'} · ${entry.seed ?? 'night-0001'}</span></li>`,
        )
        .join('');
      drawer.innerHTML = `
        <span class="eyebrow">Run History</span>
        <h2>Imperial Record</h2>
        <p>${snapshot.meta.victories} victories across ${snapshot.meta.completedRuns} completed runs.</p>
        <ul>${rows || '<li><strong>No runs recorded</strong><span>Complete a run to write the archive.</span></li>'}</ul>
      `;
    }

    this.root.appendChild(drawer);
  }

  private difficultyLabel(difficulty: DifficultyBand): string {
    switch (difficulty) {
      case 'standard':
        return 'Standard';
      case 'hard':
        return 'Hard';
      case 'nightmare':
        return 'Nightmare';
    }
  }

  private leaderLabel(leader: LeaderId): string {
    return this.latest?.content.leaders.find((candidate) => candidate.id === leader)?.title ?? 'Nocturne Regent';
  }

  private completedRouteNodes(route: RouteNode[][], completedNodeIds: string[]): RouteNode[] {
    return completedNodeIds
      .map((nodeId) => route.flat().find((node) => node.id === nodeId))
      .filter((node): node is RouteNode => Boolean(node));
  }

  private routeObjectiveLabel(node: RouteNode): string {
    if (node.encounterId === 'market-relic') {
      return 'Capture relic ledger';
    }

    if (node.encounterId === 'chapel-pyre') {
      return 'Survive dawn waves';
    }

    if (node.encounterId === 'canal-smugglers') {
      return 'Escape fog bridge';
    }

    if (node.encounterId === 'wall-siege') {
      return 'Protect breach ward';
    }

    if (node.encounterId.includes('rite') || node.encounterId.includes('siege') || node.encounterId.includes('pyre')) {
      return 'Hold ritual site';
    }

    return node.encounterId.includes('gate') || node.encounterId.includes('inquisitor') ? 'Eliminate commander' : 'Break patrol';
  }

  private routeRiskLabel(risk: RouteNode['risk']): string {
    switch (risk) {
      case 'low':
        return 'Stable approach';
      case 'standard':
        return 'Contested district';
      case 'high':
        return 'Elite threat';
    }
  }

  private routeRewardHint(node: RouteNode): string {
    switch (node.district) {
      case 'crypt':
        return 'Blood economy';
      case 'market':
        return 'Relic leverage';
      case 'chapel':
        return 'Terror pressure';
      case 'canal':
        return 'Pact routes';
      case 'wall':
        return 'Armor breach';
      case 'palace':
        return 'Crown finish';
    }
  }

  private interactionDetail(
    active: NonNullable<BattleSnapshot['battle']>['units'][number],
    battle: NonNullable<BattleSnapshot['battle']>,
  ): { available: boolean; title: string; description: string } {
    const tile = battle.tiles.find((candidate) => candidate.x === active.position.x && candidate.y === active.position.y);
    const tileKey = `${active.position.x},${active.position.y}`;
    const onRitual =
      battle.objective.type === 'hold_ritual' &&
      battle.objective.ritualTiles.some((ritual) => ritual.x === active.position.x && ritual.y === active.position.y);
    const onRelicObjective =
      battle.objective.type === 'capture_relic' &&
      battle.objective.relicTiles.some((relic) => relic.x === active.position.x && relic.y === active.position.y);
    const onEscape =
      battle.objective.type === 'escape_route' &&
      battle.objective.exitTiles.some((exit) => exit.x === active.position.x && exit.y === active.position.y);

    if (onRelicObjective && !battle.objective.captured) {
      return {
        available: active.actionPoints > 0,
        title: 'Seize Relic Ledger',
        description: 'Spend 1 AP to capture the auction ledger, restore 2 health, and win the encounter.',
      };
    }

    if (onEscape && battle.objective.type === 'escape_route' && !battle.objective.escapedUnitIds.includes(active.id)) {
      return {
        available: active.actionPoints > 0,
        title: 'Escape Fog Bridge',
        description: `Spend 1 AP to escape this unit (${Math.min(
          battle.objective.requiredEscapes,
          battle.objective.escapedUnitIds.length + 1,
        )}/${battle.objective.requiredEscapes}).`,
      };
    }

    if (tile?.hazard === 'relic_cache' && !battle.claimedRelicCaches.includes(tileKey)) {
      return {
        available: active.actionPoints > 0,
        title: 'Open Relic Cache',
        description: 'Spend 1 AP to restore 2 health and gain a stronger ward from this cache.',
      };
    }

    if (onRitual) {
      if (active.hasMoved) {
        return {
          available: false,
          title: 'Ritual Channel Blocked',
          description: 'A court unit must begin on the ritual tile before spending AP to channel it.',
        };
      }

      return {
        available: active.actionPoints > 0,
        title: 'Channel Ritual',
        description:
          battle.objective.type === 'hold_ritual'
            ? `Spend 1 AP to advance the ritual to ${Math.min(
                battle.objective.requiredTurns,
                battle.objective.heldTurns + 1,
              )}/${battle.objective.requiredTurns}.`
            : 'Spend 1 AP to channel the objective.',
      };
    }

    return {
      available: false,
      title: 'No Interaction',
      description: 'Move onto a ritual site or unclaimed relic cache to use the interact command.',
    };
  }

  private relicDetail(
    active: NonNullable<BattleSnapshot['battle']>['units'][number],
    battle: NonNullable<BattleSnapshot['battle']>,
  ): { available: boolean; title: string; description: string } {
    const relic = snapshotRelicName(this.latest);
    if (!this.latest?.run?.relics.length) {
      return {
        available: false,
        title: 'No Bound Relic',
        description: 'Claim a relic reward during a campaign run to unlock active relic power.',
      };
    }

    if (battle.relicPowerUsed) {
      return {
        available: false,
        title: `${relic} Spent`,
        description: 'The active relic command can be invoked once per battle.',
      };
    }

    if (relic === 'Canal Mirror') {
      return {
        available: active.actionPoints > 0,
        title: 'Invoke Canal Mirror',
        description: `Spend ${active.name}'s AP to reopen movement and gain Warded 2.`,
      };
    }

    if (relic === 'Market Mask') {
      return {
        available: active.actionPoints > 0,
        title: 'Raise Market Mask',
        description: 'Spend AP to reopen movement for the whole court and ward the invoker.',
      };
    }

    if (relic === 'Bell Ash Reliquary') {
      return {
        available: active.actionPoints > 0,
        title: 'Ring Bell Ash Reliquary',
        description: 'Spend AP to daze the dawn front for 2 turns.',
      };
    }

    if (relic === 'Wall-Key of Thorns') {
      return {
        available: active.actionPoints > 0,
        title: 'Turn Wall-Key of Thorns',
        description: 'Spend AP to gain armor, guard, and a ward for this battle.',
      };
    }

    if (relic === 'Palace Nightglass') {
      return {
        available: active.actionPoints > 0,
        title: 'Turn Palace Nightglass',
        description: 'Spend AP to reduce dawn pressure and briefly ward the court.',
      };
    }

    return {
      available: active.actionPoints > 0,
      title: `Invoke ${relic}`,
      description: 'Spend AP to restore 3 health and gain Warded 2.',
    };
  }

  private gridDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private isInCover(target: { position: { x: number; y: number } }, battle: { tiles: Array<{ x: number; y: number; terrain: string }> }): boolean {
    return battle.tiles.some((tile) => tile.terrain === 'cover' && tile.x === target.position.x && tile.y === target.position.y);
  }

  private panel(title: string): HTMLElement {
    const section = document.createElement('section');
    section.className = 'hud-panel';
    const heading = document.createElement('h2');
    heading.textContent = title;
    section.appendChild(heading);
    return section;
  }
}
