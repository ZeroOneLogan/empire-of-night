# Empire of Night Plan

## Project Identity

**Empire of Night** is a browser-playable tactical roguelite about rebuilding a fallen nocturnal empire before the dawn kingdoms erase it. The player commands a small court of nightbound units across compact tactical maps, captures districts, collects relics, survives escalating daylight pressure, and decides how ruthless or restrained the empire becomes.

The game should feel readable, fast, and tactical rather than sprawling. Each run should last 20-40 minutes, with short battles, persistent unlocks, and a strong dark-fantasy board-game presentation.

## Current Repo State

The repo now contains the first playable tactical vertical slice:

- Vite + TypeScript app entry in `src/main.ts`
- Phaser 3 scene boundaries for boot, menu, and battle
- Pure TypeScript battle simulation under `src/game/simulation/`
- Authored opening encounter content under `src/game/content/`
- Phaser grid/unit rendering under `src/phaser/view/`
- DOM tactical HUD, commands, combat log, result overlay, and menu shell under `src/ui/`
- Development-only debug bridge `window.__empireOfNight`
- Three-unit court squad, three dawn enemy archetypes, readable enemy intent, statuses, downed units, and objective fail states
- Two objective implementations: hold ritual site and eliminate commander
- Campaign route map with three tiers of branching district choices
- Post-battle reward choices, run summary, restart flow, and versioned local meta progression
- Content pass with 12 route encounters, 6 relic rewards, 5 dawn enemy archetypes, 4 hazard types, 5 doctrine identities, district codex notes, and reward comparison UI
- Presentation pass with pause, settings, run history, event feedback strip, persistent audio/motion preferences, placeholder audio cues, and stronger tactical HUD feedback
- Tactical preview HUD that shows active unit AP, move, armor, status, selected ability, legal move count, and target-by-target projected attack damage
- Balance and replayability pass with deterministic seeded routes, standard/hard/nightmare difficulty bands, run estimates, route risk diagnostics, and seed/difficulty run history
- Browser hardening pass with explicit BattleScene input/render cleanup, shorter-laptop route layout support, wider desktop route/battle layouts, and repeated restart/transition coverage
- Long-roadmap gameplay expansion slices with selectable leaders, named relic synergies, deterministic reward effects, route narrative events, optional challenge modifiers, challenge-aware later battle setup, and a distinct Dawn Exarch boss commander
- Playwright smoke coverage for boot, debug state, content catalog breadth, seeded replay/difficulty balance, alternate leaders, settings persistence, commander objective, tactical preview readability, Dawn Exarch boss, deterministic victory/defeat, repeated restart/scene transitions, reward effects, route-event challenges, and a four-encounter campaign run with persisted history
- Vite dev server and Playwright base URL pinned to port `4173`

This plan becomes the source of truth for future implementation. If code and this plan disagree, update the plan intentionally or call out the mismatch before continuing.

## Product Goals

- Build a polished single-player tactical roguelite for desktop browsers first.
- Keep the first playable release small but complete: menu, run setup, tactical battle, rewards, progression, defeat, victory, and restart.
- Favor deterministic rules, clear combat previews, and visible consequences over hidden simulation.
- Use DOM overlays for dense UI and Phaser for world, units, effects, camera, and tactical map readability.
- Keep the game legally distinct from existing fantasy strategy IP.

## Non-Goals For V1

- No backend, accounts, multiplayer, cloud saves, or server authority.
- No OpenAI API dependency in runtime gameplay.
- No mobile-first redesign before the desktop loop is proven.
- No procedural content system that blocks shipping hand-authored tactical encounters.
- No large asset pipeline requirement before the vertical slice is playable.

## Core Fantasy

The player is the regent of a shattered night empire. Each run begins with a weakened throne, three loyal units, and a map of districts controlled by hostile dawn factions. The player chooses routes, wins tactical encounters, claims resources, recruits followers, binds relics, and decides whether to rule through terror, secrecy, or pacts.

## Core Loop

1. Choose a run origin, court leader, and starting doctrine.
2. View the campaign route map and pick the next district.
3. Enter a tactical encounter on a compact grid.
4. Spend action points to move, attack, cast, guard, interact, or use relics.
5. Resolve enemy turns with predictable intent previews.
6. Win by completing the map objective before dawn pressure overwhelms the squad.
7. Choose rewards: unit upgrade, relic, resource, doctrine shift, or map advantage.
8. Repeat until the player captures the capital district, dies, or abandons the run.
9. Persist meta progression locally for future starts.

## Tactical Battle Rules

- Battles use a square or diamond grid with clear movement tiles, attack ranges, cover, hazards, and objectives.
- Each player unit gets a fixed action budget per turn: movement plus one major action by default.
- Enemy intent must be visible before the player commits: target, damage range, movement, and special effects.
- Combat should prioritize positioning, flanking, line of sight, terrain, and status effects.
- Victory objectives vary by encounter: eliminate commander, hold ritual site, escape, capture relic, survive dawn waves, or protect a fragile unit.
- Defeat occurs when all player units are downed, the objective fails, or the dawn meter reaches a hard fail state.

## Player Controls

- Mouse primary: select units, preview movement, choose actions, confirm targets.
- Keyboard shortcuts: `1-5` actions, `Tab` cycle units, `Space` end turn or confirm, `Esc` cancel/open menu.
- Camera: drag pan, wheel zoom, optional edge pan later.
- All tactical choices must have visible hover previews before committing.
- No critical action should require double-click timing or twitch reflexes.

## Progression

Run progression:

- Units gain temporary upgrades during a run.
- Relics alter rules in strong, readable ways.
- Doctrines shape the empire: terror, shadow, blood, pact, or crown.
- District rewards affect later route choices.

Meta progression:

- Save locally using `localStorage` or IndexedDB once the save model grows.
- Unlock leaders, starting relic pools, alternate doctrines, and cosmetic codex entries.
- Meta upgrades must expand options, not erase tactical difficulty.

## Visual Direction

- Dark fantasy tactical board with high-contrast silhouettes, readable grid language, restrained effects, and rich UI texture.
- Palette should combine black, moonlit blue, bone, crimson, tarnished gold, and cold fog without becoming a flat dark-blue UI.
- Units should be readable at tactical zoom through shape, color accent, base ring, and status icons.
- UI should feel like an imperial command table: functional first, ornate only where it does not reduce scan speed.
- Avoid oversized landing-page treatment; the first screen should be the actual game shell or main menu.

## Audio Direction

- V1 may ship with lightweight generated or open-license placeholders.
- Required sound categories: select, move, attack, hit, defeat, reward, turn start, dawn warning, menu confirm.
- Music should be loopable and subtle enough for repeated runs.

## Technical Architecture

Use the existing stack:

- Vite
- TypeScript strict mode
- Phaser 3
- Playwright for browser verification

Target module shape:

- `src/game/simulation/`: source of truth for rules, run state, combat, AI intent, rewards, and saveable data.
- `src/game/content/`: authored units, enemies, encounters, relics, doctrines, maps, and route nodes.
- `src/game/input/`: action types, bindings, and input translation.
- `src/game/assets/`: manifest keys and asset metadata.
- `src/phaser/scenes/`: boot, preload, menu, campaign map, battle, result, and debug scenes.
- `src/phaser/view/`: grid renderer, unit sprites, effects, camera, and previews.
- `src/ui/`: DOM HUD, menus, overlays, tooltips, codex, settings, and run summary.

Architecture rules:

- Gameplay state lives outside Phaser scenes.
- Phaser scenes adapt simulation state into visuals and send player intents back to the simulation.
- Avoid storing rules in sprite state, tweens, or scene-local mutation.
- Asset references should go through stable manifest keys.
- DOM overlays own dense text and settings; Phaser owns tactical visualization.
- Add a development-only debug bridge named `window.__empireOfNight` for smoke tests, state inspection, and deterministic setup.

## Data Model Targets

Core state should include:

- `RunState`: seed, route map, current node, resources, doctrine, relics, squad, flags, and result.
- `BattleState`: grid, units, turn queue, active unit, objectives, hazards, dawn meter, and event log.
- `UnitState`: id, faction, position, hp, armor, action points, abilities, statuses, and intent.
- `PlayerAction`: move, attack, ability, guard, interact, end turn, cancel.
- `EncounterDefinition`: map layout, enemy roster, objective, rewards, events, and difficulty tags.
- `SaveState`: versioned meta progression and settings.

All persisted state must be versioned from the first save implementation.

## Milestone Roadmap

### Milestone 0: Project Foundation

Status: Complete as of 2026-05-12.

- Replace the single-scene scaffold with a durable project structure.
- Add boot/preload/menu/battle scene boundaries.
- Add deterministic simulation state and a testable action reducer.
- Add `window.__empireOfNight` in development builds.
- Acceptance: build passes, smoke test loads canvas, debug bridge exposes version and current screen.

### Milestone 1: Tactical Grid Vertical Slice

Status: Complete as of 2026-05-12 for the opening one-unit encounter.

- Render a tactical grid with obstacles and deployment positions.
- Add one player unit, one enemy, movement previews, attack previews, and turn ending.
- Implement deterministic enemy intent and simple enemy turn resolution.
- Acceptance: player can move, attack, end turn, defeat an enemy, and see battle result.

### Milestone 2: Squad Combat And Objectives

Status: Complete as of 2026-05-12.

- Add three player unit archetypes: regent, knight, and occultist.
- Add at least three enemy archetypes with readable intent.
- Add two objective types: eliminate commander and hold ritual site.
- Add HP, armor, statuses, downed units, and objective fail states.
- Acceptance: complete battle can be won or lost without console errors.

### Milestone 3: Campaign Route And Rewards

Status: Complete as of 2026-05-12.

- Add campaign route map with branching district choices.
- Add battle rewards: unit upgrade, relic, resource, doctrine shift.
- Add run summary, restart flow, and basic meta unlock persistence.
- Acceptance: player can complete at least three encounters in one run and restart with saved meta progress.

### Milestone 4: Content Pass

Status: Complete as of 2026-05-12.

- Add 8-12 encounters, 6 relics, 5 enemy types, 4 hazards, and 3 doctrines.
- Add district identity: crypt, market, chapel, canal, wall, palace.
- Add tooltips, codex entries, and reward comparison UI.
- Acceptance: two runs can differ meaningfully by route, rewards, and doctrine.

### Milestone 5: Presentation And UX

Status: Complete as of 2026-05-12.

- Add main menu, pause menu, settings, run history, tactical HUD, and readable combat log.
- Add effects for movement, impact, status, objective progress, and dawn pressure.
- Add placeholder audio pass.
- Acceptance: all major actions have visible feedback, no essential text overlaps at desktop viewport sizes.

### Milestone 6: Balance And Replayability

Status: Complete as of 2026-05-12.

- Tune action economy, enemy pressure, reward frequency, and dawn meter.
- Add seed support for deterministic replay/debugging.
- Add difficulty bands and route risk indicators.
- Acceptance: first full run target is 20-40 minutes, with no dominant single tactic in smoke playtests.

### Milestone 7: Browser Hardening

Status: Complete as of 2026-05-12.

- Optimize render/update loops, texture usage, event cleanup, and scene transitions.
- Add responsive desktop layouts for common laptop and wide monitor sizes.
- Expand Playwright coverage for battle, route, save/load, and restart flows.
- Acceptance: stable under repeated restart and scene-transition tests.

### Milestone 8: Long Roadmap Expansion

Status: Complete as of 2026-05-12.

- Add additional leaders, faction bosses, elite encounters, relic synergies, narrative events, and optional challenge modifiers.
- Consider optional AI-assisted content tooling outside runtime gameplay, but keep shipped gameplay deterministic and local unless the plan is explicitly revised.
- Acceptance: expansion work only begins after v1 loop is complete and tested.

## Testing And Verification

Required checks for meaningful changes:

- `npm run build`
- `npm run test:e2e`
- Browser verification through Playwright or the in-app browser for visible gameplay changes.
- Add focused unit tests once simulation modules exist.
- Keep smoke tests deterministic by using fixed seeds or debug setup hooks.

Playwright should verify:

- App boots and canvas renders.
- Main menu starts a run.
- Battle scene supports move, attack, end turn, and win/loss result.
- Route map advances after victory.
- Save state survives reload once persistence exists.
- No console errors during core flows.

## Logging And Evidence

Create `.logs/` entries for completed milestones or substantial slices. Each log should include:

- Date
- Scope completed
- Files changed summary
- Commands run
- Browser verification performed
- Known follow-ups

## V1 Definition Of Done

V1 is complete when a player can start from the main menu, choose a route, complete multiple tactical battles, earn rewards, unlock meta progression, win or lose a run, restart cleanly, and pass build plus Playwright verification without console errors.

## Operating Rules For Future Agents

- Treat this file as the roadmap authority.
- Keep changes scoped to the current milestone unless explicitly asked to broaden.
- Prefer working gameplay over speculative systems.
- Do not add backend services, accounts, cloud saves, multiplayer, or OpenAI runtime calls unless this plan is updated first.
- Preserve deterministic simulation boundaries and test seams.
- For visual work, verify in a real browser, not only through TypeScript or build success.
