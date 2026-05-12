# AGENTS.md

Guidance for Codex agents working in this repository.

## Project Context

Empire of Night is a browser-playable tactical roguelite built with Vite, TypeScript, Phaser 3, and Playwright. The current checkout is a minimal Phaser scaffold, but `PLAN.md` defines the intended game architecture, roadmap, and acceptance criteria.

Treat `PLAN.md` as the product and technical source of truth. If implementation and `PLAN.md` disagree, call out the mismatch before editing or update the plan intentionally as part of the same change.

## Working Principles

- Keep changes scoped to the requested milestone or feature slice.
- Preserve deterministic, local-only gameplay. Do not add backend, account, cloud-save, multiplayer, or runtime AI dependencies unless `PLAN.md` is explicitly revised.
- Favor testable simulation code outside Phaser scenes. Phaser should adapt simulation state into visuals and translate player input back into intents.
- Use DOM overlays for dense UI, menus, settings, tooltips, and text-heavy surfaces. Use Phaser for tactical visualization, units, effects, camera, grid, and previews.
- Keep the game legally distinct from existing fantasy strategy IP.

## Expected Architecture

When expanding beyond the scaffold, follow the target module boundaries from `PLAN.md`:

- `src/game/simulation/`: rules, run state, combat, AI intent, rewards, saveable data.
- `src/game/content/`: authored units, enemies, encounters, relics, doctrines, maps, route nodes.
- `src/game/input/`: action types, bindings, input translation.
- `src/game/assets/`: manifest keys and asset metadata.
- `src/phaser/scenes/`: boot, preload, menu, campaign map, battle, result, debug scenes.
- `src/phaser/view/`: grid renderer, unit sprites, effects, camera, previews.
- `src/ui/`: DOM HUD, menus, overlays, tooltips, codex, settings, run summary.

Do not store gameplay rules in sprite state, tweens, or scene-local mutation. Asset references should go through stable manifest keys once assets exist.

## Debug And Test Hooks

Add a development-only debug bridge named `window.__empireOfNight` when Milestone 0 work begins. It should support deterministic smoke tests and state inspection without exposing production-only shortcuts.

Keep Playwright tests deterministic through fixed seeds or explicit debug setup hooks.

## Commands

Use the existing npm scripts:

```bash
npm run build
npm run test:e2e
npm run dev
```

The Vite dev server and Playwright base URL are pinned to port `4173`.

## Verification Expectations

For meaningful code changes, run:

1. `npm run build`
2. `npm run test:e2e`
3. Browser verification through Playwright or the in-app browser for visible gameplay or UI changes.

For documentation-only changes, a build is usually unnecessary unless the docs claim behavior that should be checked.

## Code Style

- TypeScript should remain strict and explicit at module boundaries.
- Prefer small, pure reducers and data objects for gameplay rules.
- Keep Phaser scene classes thin and lifecycle-aware.
- Avoid broad refactors unless they directly support the requested slice.
- Add comments only where they clarify non-obvious game logic or lifecycle constraints.

## UI And Presentation

The game should feel like an imperial command table: readable, tactical, and dark-fantasy without becoming a flat dark-blue interface. Prioritize high-contrast silhouettes, clear grid language, visible combat previews, and non-overlapping desktop UI.

Do not build a marketing landing page as the primary screen. The first user-facing surface should be the actual game shell or main menu.
