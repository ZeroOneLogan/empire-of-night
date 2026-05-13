import type {
  BalanceSummary,
  DifficultyBand,
  LeaderDefinition,
  LeaderId,
  RewardOption,
  RouteEventState,
  RouteNode,
  RunState,
} from '../simulation/types';

export const relicCatalog = [
  'Moon-Splinter Crown',
  'Canal Mirror',
  'Bell Ash Reliquary',
  'Wall-Key of Thorns',
  'Market Mask',
  'Palace Nightglass',
] as const;

const relicActiveDetails: Record<(typeof relicCatalog)[number], string> = {
  'Moon-Splinter Crown': 'Active: spend AP to restore 3 health and gain Warded 2 once per battle.',
  'Canal Mirror': 'Active: spend AP to reopen this unit movement and gain Warded 2 once per battle.',
  'Bell Ash Reliquary': 'Active: spend AP to daze the first two dawn enemies for 2 turns once per battle.',
  'Wall-Key of Thorns': 'Active: spend AP to gain armor, guard, and a ward once per battle.',
  'Market Mask': 'Active: spend AP to reopen movement for the whole court once per battle.',
  'Palace Nightglass': 'Active: spend AP to reduce dawn pressure and ward the court once per battle.',
};

const relicActiveDetail = (relic: string | undefined): string | undefined =>
  relic && relic in relicActiveDetails ? relicActiveDetails[relic as (typeof relicCatalog)[number]] : undefined;

export const doctrineCatalog = ['crown', 'terror', 'shadow', 'blood', 'pact'] as const;

export const leaderCatalog: LeaderDefinition[] = [
  {
    id: 'nocturne_regent',
    title: 'Nocturne Regent',
    doctrine: 'crown',
    description: 'The default imperial court: balanced authority, durable command, and steady route control.',
    effect: 'Start with +1 authority. The Regent gains extra durability through crown command.',
  },
  {
    id: 'grave_marshal',
    title: 'Grave Marshal',
    doctrine: 'terror',
    description: 'A siege commander who turns every district into a disciplined advance.',
    effect: 'Start in terror doctrine. The Grave Knight gains armor and health in battles.',
  },
  {
    id: 'veil_oracle',
    title: 'Veil Oracle',
    doctrine: 'shadow',
    description: 'A secretive leader who wins by obscuring the court and extending occult reach.',
    effect: 'Start in shadow doctrine. The Veil Occultist gains range and an opening ward.',
  },
];

const doctrineByDistrict: Record<RouteNode['district'], RunState['doctrine']> = {
  crypt: 'blood',
  market: 'shadow',
  chapel: 'terror',
  canal: 'pact',
  wall: 'terror',
  palace: 'crown',
};

const routeEventCatalog: Array<Omit<RouteEventState, 'tier' | 'district'> & { districts: RouteNode['district'][] }> = [
  {
    id: 'dawn-edict',
    title: 'Dawn Edict Posted',
    districts: ['crypt', 'chapel', 'wall', 'palace'],
    description: 'A proclamation brands the court as famine and plague. Answering it can buy time or invite harsher patrols.',
    choices: [
      {
        id: 'burn-edict',
        title: 'Burn the edict in public',
        description: 'Gain authority by proving the court can still command the streets.',
        comparison: '+2 authority. Safer strategic tempo without changing combat pressure.',
        effects: {
          authority: 2,
          codex: 'The court burned a dawn edict and reclaimed public command.',
        },
      },
      {
        id: 'answer-with-blood',
        title: 'Answer with blood tithes',
        description: 'Harvest blood now, but every remaining dawn patrol carries a harsher writ.',
        comparison: '+3 blood and adds Sun Edict: dawn patrols hit harder.',
        effects: {
          blood: 3,
          challenge: 'sun_edict',
          codex: 'A blood answer empowered the court and hardened future dawn patrols.',
        },
      },
    ],
  },
  {
    id: 'moon-market-pact',
    title: 'Moon Market Pact',
    districts: ['market', 'canal', 'palace'],
    description: 'Masked brokers offer a shortcut through the city ledger. Their price is influence over the throne.',
    choices: [
      {
        id: 'buy-the-map',
        title: 'Buy the hidden map',
        description: 'Pay authority through favors and turn the route toward pact doctrine.',
        comparison: '+1 blood, +1 authority, and shifts doctrine to pact.',
        effects: {
          blood: 1,
          authority: 1,
          doctrine: 'pact',
          codex: 'Moon market brokers opened a pact route through hidden canals.',
        },
      },
      {
        id: 'steal-the-ledger',
        title: 'Steal the broker ledger',
        description: 'Take a relic lead and earn a debt that follows the court into later fights.',
        comparison: 'Gain Market Mask and adds Oath Debt: court units start under extra dawn pressure.',
        effects: {
          relic: 'Market Mask',
          challenge: 'oath_debt',
          codex: 'The court stole a broker ledger and inherited an oath debt.',
        },
      },
    ],
  },
  {
    id: 'blood-moon',
    title: 'Blood Moon Overpass',
    districts: ['crypt', 'canal', 'wall'],
    description: 'The moon reddens above the march. The court can consecrate the omen or hide from it.',
    choices: [
      {
        id: 'consecrate-omen',
        title: 'Consecrate the omen',
        description: 'Shift toward blood doctrine and empower the Regent through sacrifice.',
        comparison: '+2 blood, doctrine becomes blood, and adds Blood Moon: dawn rises faster.',
        effects: {
          blood: 2,
          doctrine: 'blood',
          challenge: 'blood_moon',
          codex: 'A blood moon oath sharpened the court but hastened dawn pressure.',
        },
      },
      {
        id: 'veil-the-column',
        title: 'Veil the marching column',
        description: 'Spend the omen on an occultist focus instead of open terror.',
        comparison: 'Gain Occultist Focus. No added challenge modifier.',
        effects: {
          upgrade: 'Occultist Focus',
          codex: 'The column vanished beneath a veil and preserved occult momentum.',
        },
      },
    ],
  },
  {
    id: 'ash-choir',
    title: 'Ash Chapel Choir',
    districts: ['chapel', 'crypt', 'palace'],
    description: 'A choir of ash-stained converts offers to sing the court through a dawn checkpoint.',
    choices: [
      {
        id: 'bind-the-choir',
        title: 'Bind the choir',
        description: 'Take their reliquary and let the first dawn ranks falter in later fights.',
        comparison: 'Gain Bell Ash Reliquary. Future battles can daze early dawn enemies.',
        effects: {
          relic: 'Bell Ash Reliquary',
          codex: 'The ash choir was bound into a reliquary of broken hymns.',
        },
      },
      {
        id: 'silence-the-choir',
        title: 'Silence the choir',
        description: 'Make an example of the converts and deepen terror doctrine.',
        comparison: '+2 authority, doctrine becomes terror, and adds Sun Edict pressure.',
        effects: {
          authority: 2,
          doctrine: 'terror',
          challenge: 'sun_edict',
          codex: 'The court silenced a dawn choir and spread terror through the chapel alleys.',
        },
      },
    ],
  },
  {
    id: 'thorn-gate-toll',
    title: 'Thorn Gate Toll',
    districts: ['wall', 'canal', 'market'],
    description: 'A thorn-wreathed gatekeeper demands either a royal token or a debt of future violence.',
    choices: [
      {
        id: 'claim-the-key',
        title: 'Claim the thorn key',
        description: 'Take the wall key and harden the Grave Knight for future breaches.',
        comparison: 'Gain Wall-Key of Thorns. Knight gains armor and strike damage in later battles.',
        effects: {
          relic: 'Wall-Key of Thorns',
          codex: 'A thorn key opened future wall paths at the cost of bloodied hands.',
        },
      },
      {
        id: 'promise-the-debt',
        title: 'Promise the debt',
        description: 'Pass without payment, but the oath follows the court.',
        comparison: '+2 blood and adds Oath Debt: dawn units become tougher.',
        effects: {
          blood: 2,
          challenge: 'oath_debt',
          codex: 'The court promised a thorn debt that strengthened future dawn patrols.',
        },
      },
    ],
  },
  {
    id: 'nightglass-audience',
    title: 'Nightglass Audience',
    districts: ['palace', 'market', 'chapel'],
    description: 'A fractured mirror under the palace shows the throne already conquered, if the court can pay the reflection.',
    choices: [
      {
        id: 'take-the-nightglass',
        title: 'Take the nightglass',
        description: 'Bind the palace mirror and create more room before dawn exposes the court.',
        comparison: 'Gain Palace Nightglass. Future battles gain a larger dawn meter.',
        effects: {
          relic: 'Palace Nightglass',
          codex: 'The court accepted a nightglass reflection of its future throne.',
        },
      },
      {
        id: 'shatter-the-reflection',
        title: 'Shatter the reflection',
        description: 'Refuse prophecy and turn broken glass into immediate blood leverage.',
        comparison: '+3 blood, +1 authority, and adds Blood Moon pressure.',
        effects: {
          blood: 3,
          authority: 1,
          challenge: 'blood_moon',
          codex: 'The nightglass was shattered into a blood moon omen.',
        },
      },
    ],
  },
];

export const routeEventTitles = routeEventCatalog.map((event) => event.title);

const routePool: RouteNode[][] = [
  [
    {
      id: 'crypt-rite',
      tier: 0,
      title: 'Seal the Crypt Rite',
      district: 'crypt',
      encounterId: 'crypt-rite',
      risk: 'low',
      codex: 'Crypt districts reward blood economy and early ritual control.',
    },
    {
      id: 'crypt-inquisitor',
      tier: 0,
      title: 'Break the Gate Inquisitor',
      district: 'crypt',
      encounterId: 'crypt-inquisitor',
      risk: 'standard',
      codex: 'Inquisitors are commander targets; ending them ends the fight.',
    },
    {
      id: 'market-ambush',
      tier: 0,
      title: 'Cut Through the Moon Market',
      district: 'market',
      encounterId: 'market-ambush',
      risk: 'standard',
      codex: 'Market routes offer shadow doctrine and relic tempo.',
    },
  ],
  [
    {
      id: 'market-relic',
      tier: 1,
      title: 'Seize the Mask Auction',
      district: 'market',
      encounterId: 'market-relic',
      risk: 'standard',
      codex: 'Relic caches can protect a unit that reaches them first.',
    },
    {
      id: 'chapel-bell',
      tier: 1,
      title: 'Silence the Chapel Bell',
      district: 'chapel',
      encounterId: 'chapel-bell',
      risk: 'high',
      codex: 'Bell wardens punish passive court turns with durable bodies.',
    },
    {
      id: 'canal-rite',
      tier: 1,
      title: 'Bind the Canal Shrine',
      district: 'canal',
      encounterId: 'canal-rite',
      risk: 'low',
      codex: 'Canal rites favor pact doctrine and controlled positioning.',
    },
  ],
  [
    {
      id: 'chapel-pyre',
      tier: 2,
      title: 'Cross the Sun Pyre',
      district: 'chapel',
      encounterId: 'chapel-pyre',
      risk: 'high',
      codex: 'Sunflare hazards daze and damage units that step into them.',
    },
    {
      id: 'canal-smugglers',
      tier: 2,
      title: 'Take the Smuggler Canal',
      district: 'canal',
      encounterId: 'canal-smugglers',
      risk: 'standard',
      codex: 'Veil fog grants cover but makes paths tighter.',
    },
    {
      id: 'wall-siege',
      tier: 2,
      title: 'Climb the Palace Wall',
      district: 'wall',
      encounterId: 'wall-siege',
      risk: 'standard',
      codex: 'Wall routes test armor against marksmen and wardens.',
    },
  ],
  [
    {
      id: 'wall-inquisitor',
      tier: 3,
      title: 'Open the Thorn Gate',
      district: 'wall',
      encounterId: 'wall-inquisitor',
      risk: 'high',
      codex: 'High-risk commander fights accelerate terror doctrine.',
    },
    {
      id: 'palace-gate',
      tier: 3,
      title: 'Storm the Palace Gate',
      district: 'palace',
      encounterId: 'palace-gate',
      risk: 'high',
      codex: 'The palace gate is guarded by the Dawn Exarch, a boss commander with punishing decree pressure.',
    },
    {
      id: 'palace-rite',
      tier: 3,
      title: 'Crown the Nightglass Throne',
      district: 'palace',
      encounterId: 'palace-rite',
      risk: 'standard',
      codex: 'Final ritual routes reward balanced crown doctrine.',
    },
  ],
];

const hashSeed = (seed: string): number => {
  let hash = 2166136261;
  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const seededRandom = (seed: string): (() => number) => {
  let state = hashSeed(seed) || 1;
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return ((state >>> 0) % 10000) / 10000;
  };
};

const shuffleTier = (tier: RouteNode[], random: () => number): RouteNode[] =>
  [...tier]
    .map((node) => ({ node, roll: random() }))
    .sort((a, b) => a.roll - b.roll)
    .map(({ node }) => node);

export const createRoute = (seed = 'night-0001'): RouteNode[][] => {
  const random = seededRandom(seed);
  return routePool.map((tier) => shuffleTier(tier, random));
};

const estimateMinutes = (difficulty: DifficultyBand): number => {
  switch (difficulty) {
    case 'standard':
      return 24;
    case 'hard':
      return 30;
    case 'nightmare':
      return 36;
  }
};

const leaderById = (leader: LeaderId): LeaderDefinition =>
  leaderCatalog.find((candidate) => candidate.id === leader) ?? leaderCatalog[0];

export const createRun = (
  seed = 'night-0001',
  difficulty: DifficultyBand = 'standard',
  leader: LeaderId = 'nocturne_regent',
): RunState => {
  const route = createRoute(seed);
  const leaderDefinition = leaderById(leader);
  return {
    id: `run-${seed}-${difficulty}-${leader}`,
    seed,
    leader,
    routeSignature: route.flat().map((node) => node.id).join('>'),
    difficulty,
    estimatedMinutes: estimateMinutes(difficulty),
    currentTier: 0,
    route,
    completedNodeIds: [],
    selectedNodeId: null,
    resources: {
      blood: 0,
      authority: leader === 'nocturne_regent' ? 1 : 0,
    },
    relics: [],
    upgrades: [],
    codexEntries: [],
    eventHistory: [],
    challengeModifiers: [],
    doctrine: leaderDefinition.doctrine,
    victories: 0,
    result: 'active',
  };
};

export const createRewardsForNode = (node: RouteNode): RewardOption[] => {
  const relic = relicCatalog[(node.tier * 3 + node.title.length) % relicCatalog.length];
  const doctrine = doctrineByDistrict[node.district];
  const resourceBlood = node.risk === 'high' ? 3 : 2;
  const authority = node.risk === 'low' ? 2 : 1;
  const relicComparison: Record<(typeof relicCatalog)[number], string> = {
    'Moon-Splinter Crown': 'Relic synergy. Regent gains health and command damage in later battles.',
    'Canal Mirror': 'Relic synergy. Occultist gains movement and longer blood hex reach in later battles.',
    'Bell Ash Reliquary': 'Relic synergy. Early dawn enemies start dazed in later battles.',
    'Wall-Key of Thorns': 'Relic synergy. Knight gains armor and strike damage in later battles.',
    'Market Mask': 'Relic synergy. Court units gain movement tempo in later battles.',
    'Palace Nightglass': 'Relic synergy. Dawn meter capacity expands sharply in later battles.',
  };

  return [
    {
      id: `${node.id}-blood`,
      type: 'resource',
      title: 'Blood Tithe',
      description: `Gain +${resourceBlood} blood and +${authority} authority for later district bargaining.`,
      comparison: 'Immediate economy. Best when the run needs safer future choices.',
    },
    {
      id: `${node.id}-relic`,
      type: 'relic',
      title: relic,
      description: `Bind a ${node.district} relic into the local imperial archive.`,
      comparison: relicComparison[relic],
      activeDetail: relicActiveDetail(relic),
    },
    {
      id: `${node.id}-doctrine`,
      type: 'doctrine',
      title: `${doctrine[0].toUpperCase()}${doctrine.slice(1)} Doctrine`,
      description: `Shift the empire toward ${doctrine} after the ${node.district} victory.`,
      comparison: `Strategic identity. Current doctrine can diverge by route; choosing this sets ${doctrine}.`,
    },
    {
      id: `${node.id}-upgrade`,
      type: 'upgrade',
      title: node.risk === 'high' ? 'Knight Oathmark' : 'Occultist Focus',
      description:
        node.risk === 'high'
          ? 'Mark the Grave Knight as the run anchor for hard fights.'
          : 'Mark the Veil Occultist as the run anchor for safer objective play.',
      comparison: 'Squad identity. Logged for the run summary and future tactical tuning.',
    },
  ];
};

export const createRouteEventForRun = (run: RunState): RouteEventState => {
  const nextDistrict = run.route[run.currentTier]?.[0]?.district ?? 'palace';
  const eligible = routeEventCatalog.filter((event) => event.districts.includes(nextDistrict));
  const pool = eligible.length > 0 ? eligible : routeEventCatalog;
  const index = hashSeed(`${run.seed}:${run.currentTier}:${run.victories}:${run.routeSignature}`) % pool.length;
  const event = pool[index];

  return {
    id: `${event.id}-${run.currentTier}`,
    title: event.title,
    district: nextDistrict,
    tier: run.currentTier,
    description: event.description,
    choices: [
      ...event.choices.map((choice) => ({
        ...choice,
        id: `${event.id}-${run.currentTier}-${choice.id}`,
        activeDetail: relicActiveDetail(choice.effects.relic),
      })),
      {
        id: `${event.id}-${run.currentTier}-hold-formation`,
        title: 'Hold formation',
        description: 'Decline the bargain and keep the route stable.',
        comparison: 'No immediate gain. Best when the current build already has enough risk.',
        effects: {
          codex: `The court held formation through ${event.title.toLowerCase()}.`,
        },
      },
    ],
  };
};

export const summarizeBalance = (run: RunState): BalanceSummary => {
  const route = run.route.flat();
  const rewardTypes = new Set<RewardOption['type']>();
  const doctrineOptions = new Set<RunState['doctrine']>();
  const riskCounts: BalanceSummary['riskCounts'] = {
    low: 0,
    standard: 0,
    high: 0,
  };

  for (const node of route) {
    riskCounts[node.risk] += 1;
    for (const reward of createRewardsForNode(node)) {
      rewardTypes.add(reward.type);
      if (reward.type === 'doctrine') {
        doctrineOptions.add(reward.title.split(' ')[0]?.toLowerCase() as RunState['doctrine']);
      }
    }
  }

  const largestRiskBucket = Math.max(...Object.values(riskCounts));
  return {
    difficulty: run.difficulty,
    seed: run.seed,
    routeSignature: run.routeSignature,
    estimatedMinutes: run.estimatedMinutes,
    riskCounts,
    rewardTypes: [...rewardTypes],
    doctrineOptions: [...doctrineOptions],
    dominantRiskShare: largestRiskBucket / route.length,
  };
};
