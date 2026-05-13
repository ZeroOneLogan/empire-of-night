import type { UnitArchetype } from '../simulation/types';

export const assetManifest = {
  ui: {
    courtSigil: 'ui.court-sigil',
    dawnSigil: 'ui.dawn-sigil',
  },
  fx: {
    strike: 'fx.strike',
    dawnPulse: 'fx.dawn-pulse',
  },
  units: {
    regent: {
      key: 'unit.regent',
      path: '/assets/units/regent.svg',
    },
    knight: {
      key: 'unit.knight',
      path: '/assets/units/knight.svg',
    },
    occultist: {
      key: 'unit.occultist',
      path: '/assets/units/occultist.svg',
    },
    dawn_soldier: {
      key: 'unit.dawn-soldier',
      path: '/assets/units/dawn-soldier.svg',
    },
    sun_acolyte: {
      key: 'unit.sun-acolyte',
      path: '/assets/units/sun-acolyte.svg',
    },
    inquisitor: {
      key: 'unit.inquisitor',
      path: '/assets/units/inquisitor.svg',
    },
    lantern_marksman: {
      key: 'unit.lantern-marksman',
      path: '/assets/units/lantern-marksman.svg',
    },
    bell_warden: {
      key: 'unit.bell-warden',
      path: '/assets/units/bell-warden.svg',
    },
    dawn_exarch: {
      key: 'unit.dawn-exarch',
      path: '/assets/units/dawn-exarch.svg',
    },
  } satisfies Record<UnitArchetype, { key: string; path: string }>,
} as const;

export const unitTokenAssets = Object.values(assetManifest.units);

export const unitTokenKey = (archetype: UnitArchetype): string => assetManifest.units[archetype].key;
