import { z } from 'zod';
import type { RulesetModule } from '../types';

const rating = z.number().int().min(1).max(5);

const sheetSchema = z.object({
  type: z.string(), // kid archetype
  age: z.number().int().min(10).max(15),
  luckPoints: z.number().int().min(0).max(5).default(3),
  drive: z.string().default(''),
  anchor: z.string().default(''),
  problem: z.string().default(''),
  pride: z.string().default(''),
  attributes: z.object({
    body: rating, tech: rating, heart: rating, mind: rating,
  }),
  skills: z.record(z.string(), z.number().int().min(0).max(5)).default({}),
  conditions: z.array(z.string()).default([]),
  brokenState: z.boolean().default(false),
  items: z.string().default(''),
  hideout: z.string().default(''),
  notes: z.string().default(''),
});

const tftl: RulesetModule = {
  id: 'tftl',
  name: 'Tales from the Loop',
  skin: 'tftl',
  dice: { kind: 'pool', keepBanesOnPush: false },
  conditions: [
    { name: 'Upset', effect: '−1 die to all rolls.' },
    { name: 'Scared', effect: '−1 die to all rolls.' },
    { name: 'Exhausted', effect: '−1 die to all rolls.' },
    { name: 'Injured', effect: '−1 die to all rolls.' },
    { name: 'Broken', effect: 'All conditions marked — the kid is out until someone helps.' },
  ],
  sheetSchema,
  logTemplate: [
    { id: 'mystery', label: 'The Mystery', placeholder: 'What strange thing started it all…' },
    { id: 'recap', label: 'Session Recap' },
    { id: 'everyday', label: 'Everyday Life' },
    { id: 'discoveries', label: 'Discoveries' },
    { id: 'npcs', label: 'People & Machines' },
    { id: 'trouble', label: 'Trouble' },
    { id: 'threads', label: 'Open Threads' },
  ],
  compendiumTypes: [
    { type: 'mystery', label: 'Mysteries', public: false },
    { type: 'machine', label: 'Machines & Creatures', public: false },
    { type: 'npc', label: 'NPCs', public: false },
    { type: 'location', label: 'Locations', public: false },
  ],
};

export default tftl;
