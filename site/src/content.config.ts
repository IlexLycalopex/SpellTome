import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

/**
 * Content collections over the JSON extracted from the old site by
 * scripts/extract-data.mjs. The zod schemas double as the extraction
 * contract — a shape change in the source data fails the build loudly.
 *
 * ONLY freely licensed content (D&D SRD-scope data the site already
 * shipped, later the Daggerheart SRD) may live in src/data — gated
 * ruleset content is served from Supabase, never bundled.
 */

const spellSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number().int().min(0).max(9),
  school: z.string(),
  range: z.string(),
  duration: z.string(),
  casting_time: z.string(),
  components: z.array(z.enum(['V', 'S', 'M'])),
  material: z.string().optional(),
  ritual: z.boolean(),
  concentration: z.boolean(),
  classes: z.array(z.string()),
  description: z.string(),
  higher_levels: z.string().optional(),
  flavor: z.string().optional(),
  source: z.string(),
});

const monsterSchema = z.object({
  name: z.string(),
  size: z.string(),
  type: z.string(),
  cr: z.union([z.number(), z.string()]),
  ac: z.union([z.number(), z.string()]),
  hp: z.union([z.number(), z.string()]),
  speed: z.string(),
  str: z.number(), dex: z.number(), con: z.number(),
  int: z.number(), wis: z.number(), cha: z.number(),
  senses: z.string().optional(),
  dmgImmune: z.array(z.string()).optional(),
  abilities: z.array(z.object({ n: z.string(), t: z.string() })).optional(),
  actions: z.array(z.object({ n: z.string(), t: z.string() })).optional(),
});

const named = <T extends z.ZodRawShape>(shape: T) => z.object({ name: z.string(), ...shape }).passthrough();

export const collections = {
  spells2014: defineCollection({
    loader: file('src/data/dnd5e/spells-2014.json'),
    schema: spellSchema,
  }),
  spells2024: defineCollection({
    loader: file('src/data/dnd5e/spells-2024.json'),
    schema: spellSchema,
  }),
  monsters: defineCollection({
    loader: file('src/data/dnd5e/monsters.json', {
      parser: (text) => JSON.parse(text).map((m: { name: string }) => ({ id: m.name, ...m })),
    }),
    schema: monsterSchema.extend({ id: z.string() }),
  }),
  magicItems: defineCollection({
    loader: file('src/data/dnd5e/magic-items.json', {
      parser: (text) => JSON.parse(text).map((m: { name: string }) => ({ id: m.name, ...m })),
    }),
    schema: named({
      rarity: z.string(),
      type: z.string(),
      desc: z.string(),
      attune: z.union([z.boolean(), z.string()]),
    }),
  }),
  equipment: defineCollection({
    loader: file('src/data/dnd5e/equipment.json', {
      parser: (text) => JSON.parse(text).map((m: { name: string }, i: number) => ({ id: `${m.name}-${i}`, ...m })),
    }),
    schema: named({ cat: z.string() }),
  }),
  conditions: defineCollection({
    loader: file('src/data/dnd5e/conditions.json'),
    schema: named({
      id: z.string(),
      // exhaustion carries `levels` instead of `effects` (passthrough keeps it)
      effects: z.array(z.string()).optional(),
      icon: z.string(),
      color: z.string(),
      type: z.string(),
    }),
  }),
  feats: defineCollection({
    loader: file('src/data/dnd5e/feats.json'),
    schema: named({ id: z.string(), benefit: z.string(), prereq: z.string(), type: z.string() }),
  }),
  skills: defineCollection({
    loader: file('src/data/dnd5e/skills.json'),
    schema: named({ id: z.string(), ability: z.string(), description: z.string() }),
  }),
  backgrounds: defineCollection({
    loader: file('src/data/dnd5e/backgrounds.json', {
      parser: (text) => JSON.parse(text).map((m: { name: string }) => ({ id: m.name, ...m })),
    }),
    schema: named({ skills: z.union([z.string(), z.array(z.string())]), feature: z.union([z.string(), z.object({ name: z.string(), desc: z.string() })]) }),
  }),
  races: defineCollection({
    loader: file('src/data/dnd5e/races.json', {
      parser: (text) => JSON.parse(text).map((m: { name: string }) => ({ id: m.name, ...m })),
    }),
    schema: named({ size: z.string(), speed: z.union([z.number(), z.string()]) }),
  }),
  beasts: defineCollection({
    loader: file('src/data/dnd5e/beasts.json', {
      parser: (text) => JSON.parse(text).map((m: { name: string }, i: number) => ({ id: `${m.name}-${i}`, ...m })),
    }),
    schema: named({ cr: z.union([z.number(), z.string()]) }),
  }),
  familiars: defineCollection({
    loader: file('src/data/dnd5e/familiars.json', {
      parser: (text) => JSON.parse(text).map((m: { name: string }) => ({ id: m.name, ...m })),
    }),
    schema: named({}),
  }),
};
