import { z } from 'zod';
import type { RulesetModule } from '../types';

const characteristic = z.number().int().min(0).max(99);

const sheetSchema = z.object({
  occupation: z.string(),
  era: z.string().default('1920s'),
  birthplace: z.string().optional(),
  characteristics: z.object({
    str: characteristic, con: characteristic, siz: characteristic, dex: characteristic,
    app: characteristic, int: characteristic, pow: characteristic, edu: characteristic,
  }),
  hp: z.object({ max: z.number().int(), current: z.number().int() }),
  sanity: z.object({ max: z.number().int(), current: z.number().int(), start: z.number().int() }),
  luck: z.number().int().min(0).max(99),
  magicPoints: z.object({ max: z.number().int(), current: z.number().int() }),
  skills: z.record(z.string(), z.number().int().min(0).max(99)).default({}),
  majorWound: z.boolean().default(false),
  temporaryInsanity: z.boolean().default(false),
  indefiniteInsanity: z.boolean().default(false),
  backstory: z.string().default(''),
  notes: z.string().default(''),
});

const coc7e: RulesetModule = {
  id: 'coc7e',
  name: 'Call of Cthulhu 7e',
  skin: 'coc7e',
  dice: { kind: 'percentile' },
  conditions: [
    { name: 'Major Wound', effect: 'Half max HP lost in one hit — CON roll or fall unconscious; dying if at 0 HP.' },
    { name: 'Temporary Insanity', effect: '5+ Sanity lost at once — a bout of madness follows.' },
    { name: 'Indefinite Insanity', effect: 'A fifth of Sanity lost in a day — long-term care needed.' },
    { name: 'Unconscious', effect: 'Out cold; helpless until revived.' },
    { name: 'Dying', effect: '0 HP with a major wound — CON roll each round without first aid.' },
  ],
  sheetSchema,
  logTemplate: [
    { id: 'recap', label: 'Session Recap' },
    { id: 'clues', label: 'Clues & Evidence' },
    { id: 'sanity', label: 'Sanity & Losses' },
    { id: 'npcs', label: 'Persons of Interest' },
    { id: 'locations', label: 'Locations Investigated' },
    { id: 'mythos', label: 'Mythos Encountered' },
    { id: 'threads', label: 'Open Leads' },
  ],
  compendiumTypes: [
    { type: 'entity', label: 'Mythos Entities', public: false },
    { type: 'tome', label: 'Tomes & Artifacts', public: false },
    { type: 'spell', label: 'Spells', public: false },
    { type: 'npc', label: 'NPCs', public: false },
  ],
};

export default coc7e;
