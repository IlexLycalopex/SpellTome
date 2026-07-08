import { z } from 'zod';
import type { RulesetModule } from '../types';

const abilityScore = z.number().int().min(1).max(30);

const sheetSchema = z.object({
  class: z.string(),
  subclass: z.string().optional(),
  level: z.number().int().min(1).max(20),
  race: z.string().optional(),
  background: z.string().optional(),
  abilities: z.object({
    str: abilityScore, dex: abilityScore, con: abilityScore,
    int: abilityScore, wis: abilityScore, cha: abilityScore,
  }),
  ac: z.number().int(),
  hp: z.object({ max: z.number().int(), current: z.number().int(), temp: z.number().int().default(0) }),
  speed: z.string().default('30 ft'),
  proficiencies: z.array(z.string()).default([]),
  spellSlots: z.record(z.string(), z.number().int()).optional(),
  notes: z.string().default(''),
});

const dnd5e: RulesetModule = {
  id: 'dnd5e',
  name: 'D&D 5e',
  skin: 'dnd5e',
  dice: { kind: 'd20' },
  conditions: [
    { name: 'Blinded', effect: 'Cannot see; attack rolls against it have advantage, its own have disadvantage.' },
    { name: 'Charmed', effect: 'Cannot attack the charmer; charmer has advantage on social checks.' },
    { name: 'Deafened', effect: 'Cannot hear; automatically fails hearing-based checks.' },
    { name: 'Exhausted', effect: 'Cumulative levels of penalty, ending in death at level 6.' },
    { name: 'Frightened', effect: 'Disadvantage while the source is in sight; cannot approach it.' },
    { name: 'Grappled', effect: 'Speed 0 until the grapple ends.' },
    { name: 'Incapacitated', effect: 'No actions or reactions.' },
    { name: 'Invisible', effect: 'Unseen; attacks against it have disadvantage, its own have advantage.' },
    { name: 'Paralysed', effect: 'Incapacitated, auto-fails Str/Dex saves; melee hits are crits.' },
    { name: 'Petrified', effect: 'Turned to stone; incapacitated, resistance to all damage.' },
    { name: 'Poisoned', effect: 'Disadvantage on attack rolls and ability checks.' },
    { name: 'Prone', effect: 'Melee attacks against it have advantage, ranged have disadvantage.' },
    { name: 'Restrained', effect: 'Speed 0; attacks against it have advantage, its own disadvantage.' },
    { name: 'Stunned', effect: 'Incapacitated, auto-fails Str/Dex saves.' },
    { name: 'Unconscious', effect: 'Incapacitated, prone; melee hits are crits.' },
  ],
  sheetSchema,
  logTemplate: [
    { id: 'recap', label: 'Session Recap', placeholder: 'What happened, in order…' },
    { id: 'events', label: 'Key Events' },
    { id: 'npcs', label: 'NPCs Encountered' },
    { id: 'locations', label: 'Locations Visited' },
    { id: 'threads', label: 'Open Threads' },
    { id: 'milestones', label: 'Milestones' },
  ],
  compendiumTypes: [
    { type: 'spell', label: 'Spells', public: true },
    { type: 'monster', label: 'Monsters', public: true },
    { type: 'magic-item', label: 'Magic Items', public: true },
    { type: 'condition', label: 'Conditions', public: true },
  ],
};

export default dnd5e;
