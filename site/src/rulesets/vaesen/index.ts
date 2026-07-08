import { z } from 'zod';
import type { RulesetModule } from '../types';

const rating = z.number().int().min(1).max(6);

const sheetSchema = z.object({
  archetype: z.string(),
  age: z.string().optional(),
  motivation: z.string().default(''),
  trauma: z.string().default(''),
  darkSecret: z.string().default(''),
  attributes: z.object({
    physique: rating, precision: rating, logic: rating, empathy: rating,
  }),
  skills: z.record(z.string(), z.number().int().min(0).max(5)).default({}),
  resources: z.number().int().min(1).max(8).default(2),
  capital: z.number().int().min(0).default(0),
  physicalConditions: z.array(z.string()).default([]),
  mentalConditions: z.array(z.string()).default([]),
  broken: z.boolean().default(false),
  advantages: z.string().default(''),
  equipment: z.string().default(''),
  notes: z.string().default(''),
});

const vaesen: RulesetModule = {
  id: 'vaesen',
  name: 'Vaesen',
  skin: 'vaesen',
  dice: { kind: 'pool', keepBanesOnPush: true },
  conditions: [
    { name: 'Exhausted', effect: 'Physical condition — −1 die to physical rolls.' },
    { name: 'Battered', effect: 'Physical condition — −1 die to physical rolls.' },
    { name: 'Wounded', effect: 'Physical condition — −1 die to physical rolls.' },
    { name: 'Angry', effect: 'Mental condition — −1 die to mental rolls.' },
    { name: 'Frightened', effect: 'Mental condition — −1 die to mental rolls.' },
    { name: 'Hopeless', effect: 'Mental condition — −1 die to mental rolls.' },
    { name: 'Broken', effect: 'All three conditions of one kind marked — out of action until recovered.' },
  ],
  sheetSchema,
  logTemplate: [
    { id: 'mystery', label: 'The Mystery', placeholder: 'The invitation, the omen, the letter…' },
    { id: 'recap', label: 'Session Recap' },
    { id: 'clues', label: 'Clues Uncovered' },
    { id: 'vaesen', label: 'Vaesen Encountered' },
    { id: 'npcs', label: 'People Met' },
    { id: 'castle', label: 'Castle Gyllencreutz' },
    { id: 'threads', label: 'Open Threads' },
  ],
  compendiumTypes: [
    { type: 'vaesen', label: 'Vaesen (creatures)', public: false },
    { type: 'mystery', label: 'Mysteries', public: false },
    { type: 'npc', label: 'NPCs', public: false },
    { type: 'upgrade', label: 'HQ Upgrades', public: false },
  ],
};

export default vaesen;
