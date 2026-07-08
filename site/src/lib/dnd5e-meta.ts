/** D&D 5e spellcasting metadata ported from the old spelltome.html. */

export const SCHOOLS: Record<string, string> = {
  Abjuration: '#4DC8D0',
  Enchantment: '#C4306A',
  Conjuration: '#6A3A8A',
  Illusion: '#3A4A8A',
  Transmutation: '#6AAA2A',
  Divination: '#BCAA20',
  Necromancy: '#7A3A2A',
  Evocation: '#2A8A6A',
};

export const SOURCE_BOOKS: Record<string, { label: string; color: string }> = {
  PHB: { label: "Player's Handbook", color: '#8B2FC9' },
  XGE: { label: "Xanathar's Guide", color: '#1e7a6e' },
  TCE: { label: "Tasha's Cauldron", color: '#c97020' },
  SCAG: { label: 'Sword Coast Adv. Guide', color: '#2a5f8a' },
  FTD: { label: "Fizban's Treasury", color: '#8a2020' },
  SCC: { label: 'Strixhaven', color: '#3a6e8a' },
};

export const ALL_CLASSES = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'];

export const LEVEL_LABELS = ['Cantrip', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];

const SPELL_SLOT_TABLE: Record<string, Record<number, number>> = {
  fullCaster: { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4, 9: 5, 10: 5, 11: 6, 12: 6, 13: 7, 14: 7, 15: 8, 16: 8, 17: 9, 18: 9, 19: 9, 20: 9 },
  halfCaster: { 1: 0, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2, 7: 2, 8: 2, 9: 3, 10: 3, 11: 3, 12: 3, 13: 3, 14: 3, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 5 },
  warlock: { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4, 9: 5, 10: 5, 11: 5, 12: 5, 13: 5, 14: 5, 15: 5, 16: 5, 17: 5, 18: 5, 19: 5, 20: 5 },
};

const CLASS_TYPE: Record<string, keyof typeof SPELL_SLOT_TABLE> = {
  Bard: 'fullCaster', Cleric: 'fullCaster', Druid: 'fullCaster',
  Sorcerer: 'fullCaster', Wizard: 'fullCaster',
  Paladin: 'halfCaster', Ranger: 'halfCaster', Warlock: 'warlock',
};

/** Highest spell level accessible to a class at a character level. */
export function maxSpellLevel(cls: string, charLevel: number): number {
  const type = CLASS_TYPE[cls];
  if (!type) return 9;
  return SPELL_SLOT_TABLE[type]?.[charLevel] ?? 0;
}

export interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  range: string;
  duration: string;
  casting_time: string;
  components: string[];
  material?: string;
  ritual: boolean;
  concentration: boolean;
  classes: string[];
  description: string;
  higher_levels?: string;
  flavor?: string;
  source: string;
}

export const spellBook = (s: Spell) => s.source.split(' ')[0] ?? '';
