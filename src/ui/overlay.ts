import { empireStore } from '../game/app';
import type { BattleSnapshot, PlayerActionType } from '../game/simulation/types';

export class EmpireOverlay {
  private readonly root: HTMLElement;
  private latest?: BattleSnapshot;

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

    if (snapshot.currentScreen === 'menu') {
      this.renderMenuShell();
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

    const side = document.createElement('aside');
    side.className = 'battle-panel';
    side.appendChild(this.createUnitPanel());
    side.appendChild(this.createCommandPanel());
    side.appendChild(this.createIntentPanel());
    side.appendChild(this.createLogPanel());
    frame.appendChild(side);

    if (snapshot.currentScreen === 'result') {
      frame.appendChild(this.createResultPanel(snapshot));
    }

    this.root.appendChild(frame);
  }

  private renderMenuShell(): void {
    const shell = document.createElement('div');
    shell.className = 'menu-shell';
    shell.innerHTML = `
      <div class="menu-status">
        <span class="eyebrow">Milestone 1 build</span>
        <strong>Empire of Night</strong>
        <p>Opening battle ready</p>
        <p>Start the run from the command table to enter the first deterministic tactical encounter.</p>
      </div>
    `;
    this.root.appendChild(shell);
  }

  private createUnitPanel(): HTMLElement {
    const panel = this.panel('Forces');
    const battle = this.latest?.battle;
    if (!battle) {
      return panel;
    }

    for (const unit of battle.units) {
      const row = document.createElement('div');
      row.className = `unit-row ${unit.faction}`;
      row.innerHTML = `
        <span>${unit.name}</span>
        <strong>${unit.hp}/${unit.maxHp}</strong>
      `;
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

    const active = battle.units.find((unit) => unit.id === battle.activeUnitId);
    const hint = document.createElement('p');
    hint.className = 'command-hint';
    hint.textContent =
      battle.selectedAction === 'attack'
        ? 'Click an enemy with a gold ring to strike.'
        : battle.selectedAction === 'move'
          ? 'Click a blue reachable tile to reposition.'
          : `${active?.name ?? 'The court'} is waiting for orders.`;

    panel.append(row, hint);
    return panel;
  }

  private createIntentPanel(): HTMLElement {
    const panel = this.panel('Enemy Intent');
    const battle = this.latest?.battle;
    if (!battle) {
      return panel;
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

  private createResultPanel(snapshot: BattleSnapshot): HTMLElement {
    const result = document.createElement('section');
    result.className = 'result-panel';
    const battle = snapshot.battle;
    const won = battle?.result === 'victory';
    result.innerHTML = `
      <span class="eyebrow">${won ? 'District captured' : 'Run ended'}</span>
      <h2>${won ? 'The crypt gate kneels.' : 'The dawn claims the field.'}</h2>
      <p>${won ? 'This first victory proves the command loop: move, strike, read intent, and survive pressure.' : 'The battle can be restarted immediately for deterministic testing.'}</p>
    `;

    const controls = document.createElement('div');
    controls.className = 'result-actions';
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

  private panel(title: string): HTMLElement {
    const section = document.createElement('section');
    section.className = 'hud-panel';
    const heading = document.createElement('h2');
    heading.textContent = title;
    section.appendChild(heading);
    return section;
  }
}
