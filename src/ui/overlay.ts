import { empireStore } from '../game/app';
import type { BattleSnapshot, DifficultyBand, LeaderId, PlayerActionType } from '../game/simulation/types';

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
      <section class="route-map"></section>
    `;

    const map = shell.querySelector('.route-map');
    for (const node of available) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `route-node ${node.risk}`;
      button.innerHTML = `
        <span class="eyebrow">${node.district} · ${node.risk} risk</span>
        <strong>${node.title}</strong>
        <small>${node.encounterId.includes('rite') ? 'Hold ritual site' : 'Eliminate commander'}</small>
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
      button.disabled = battle.phase !== 'player';
      button.addEventListener('click', () => {
        if (command.action === 'guard') {
          empireStore.dispatch({ type: 'guard' });
        } else if (command.action === 'endTurn') {
          empireStore.dispatch({ type: 'endTurn' });
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
    const ability = active?.abilities[0];
    hint.textContent =
      battle.selectedAction === 'attack'
        ? `Click an enemy with a gold ring to use ${ability?.name ?? 'the active attack'}.`
        : battle.selectedAction === 'move'
          ? `Click a blue tile to move ${active?.name ?? 'the active unit'}.`
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
    const ability = active?.abilities[0];
    if (!active || !ability) {
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
    chips.innerHTML = `
      <span>${battle.selectedAction}</span>
      <span>${ability.name}</span>
      <span>${statusText}</span>
    `;
    panel.appendChild(chips);

    if (battle.selectedAction === 'attack') {
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
        const damage = this.previewDamage(ability.damage, target);
        const remaining = Math.max(0, target.hp - damage);
        const row = document.createElement('div');
        row.className = `preview-target ${remaining === 0 ? 'lethal' : ''}`;
        row.innerHTML = `
          <span>
            <strong>${target.name}</strong>
            <small>${target.armor > 0 ? `Armor ${target.armor}` : 'No armor'}${target.statuses.length > 0 ? ` · ${target.statuses.map((status) => status.label).join(', ')}` : ''}</small>
          </span>
          <em>Damage ${damage} · HP ${target.hp}->${remaining}</em>
        `;
        panel.appendChild(row);
      }

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
    result.className = 'result-panel';
    const battle = snapshot.battle;
    const won = battle?.result === 'victory';
    result.innerHTML = `
      <span class="eyebrow">${won ? 'District captured' : 'Run ended'}</span>
      <h2>${won ? 'The crypt gate kneels.' : 'The dawn claims the field.'}</h2>
      <p>${won ? 'The squad objective is complete: the court moved, held ground, read enemy intent, and survived pressure.' : 'The loss state is active and the battle can be restarted immediately for deterministic testing.'}</p>
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

  private renderRewardScreen(snapshot: BattleSnapshot): void {
    const shell = document.createElement('div');
    shell.className = 'reward-shell';
    shell.innerHTML = `
      <section class="reward-header">
        <span class="eyebrow">Battle Reward</span>
        <h1>Choose what the empire keeps.</h1>
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
        <p>Blood ${run.resources.blood} · Authority ${run.resources.authority} · Doctrine ${run.doctrine} · Challenges ${run.challengeModifiers.length}</p>
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
    shell.innerHTML = `
      <section class="summary-panel">
        <span class="eyebrow">${run.result === 'victory' ? 'Capital approach secured' : 'Run ended'}</span>
        <h1>${run.result === 'victory' ? 'The night empire advances.' : 'The dawn holds the field.'}</h1>
        <p>${this.leaderLabel(run.leader)} · ${this.difficultyLabel(run.difficulty)} · Seed ${run.seed} · ${run.estimatedMinutes} minute run target</p>
        <p>Encounters won: ${run.victories}/${run.route.length} · Blood ${run.resources.blood} · Authority ${run.resources.authority}</p>
        <p>Doctrine ${run.doctrine} · Relics ${run.relics.length} · Upgrades ${run.upgrades.length} · Challenges ${run.challengeModifiers.length} · Events ${run.eventHistory.length}</p>
        <p>Codex entries: ${run.codexEntries.length}</p>
        <p>Meta progress: ${snapshot.meta.victories} victories across ${snapshot.meta.completedRuns} completed runs.</p>
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
        <label><input type="checkbox" data-setting="muted" ${snapshot.settings.muted ? 'checked' : ''} /> Mute placeholder audio</label>
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

  private gridDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private previewDamage(baseDamage: number, target: { armor: number; guarded: boolean; statuses: Array<{ id: string }> }): number {
    const guardReduction = target.guarded ? 2 : 0;
    const wardReduction = target.statuses.some((status) => status.id === 'warded') ? 1 : 0;
    return Math.max(1, baseDamage - target.armor - guardReduction - wardReduction);
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
