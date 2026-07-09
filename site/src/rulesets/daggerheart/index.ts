import { z } from 'zod';
import type { RulesetModule } from '../types';

const trait = z.number().int().min(-2).max(6);

const sheetSchema = z.object({
  class: z.string(),
  subclass: z.string().optional(),
  heritage: z.string().optional(),
  level: z.number().int().min(1).max(10),
  traits: z.object({
    agility: trait, strength: trait, finesse: trait,
    instinct: trait, presence: trait, knowledge: trait,
  }),
  evasion: z.number().int(),
  armor: z.object({ max: z.number().int(), current: z.number().int() }),
  hp: z.object({ max: z.number().int(), current: z.number().int() }),
  stress: z.object({ max: z.number().int(), current: z.number().int() }),
  hope: z.number().int().min(0).max(6).default(2),
  domains: z.array(z.string()).default([]),
  domainCards: z.array(z.string()).default([]),
  experiences: z.array(z.object({ name: z.string(), bonus: z.number().int() })).default([]),
  notes: z.string().default(''),
});

const daggerheart: RulesetModule = {
  id: 'daggerheart',
  name: 'Daggerheart',
  skin: 'daggerheart',
  dice: { kind: 'duality' },
  conditions: [
    { name: 'Hidden', effect: 'Unseen — rolls against you have disadvantage until you are spotted.' },
    { name: 'Restrained', effect: 'Cannot move; still acts.' },
    { name: 'Vulnerable', effect: 'Rolls against you have advantage.' },
  ],
  sheetSchema,
  logTemplate: [
    { id: 'recap', label: 'Session Recap' },
    { id: 'events', label: 'Key Events' },
    { id: 'hopefear', label: 'Hope & Fear Moments' },
    { id: 'npcs', label: 'NPCs Encountered' },
    { id: 'locations', label: 'Locations' },
    { id: 'threads', label: 'Open Threads' },
    { id: 'advancement', label: 'Advancement' },
  ],
  compendiumTypes: [
    { type: 'domain-card', label: 'Domain Cards', public: true },
    { type: 'adversary', label: 'Adversaries', public: true },
    { type: 'equipment', label: 'Equipment', public: true },
    { type: 'environment', label: 'Environments', public: true },
  ],
};

export default daggerheart;
