/** Single source of truth for the site's navigation IA. */

export interface NavItem {
  label: string;
  path: string;
}
export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Home',
    items: [
      { label: 'Hub', path: '/' },
      { label: 'Chronicle', path: '/chronicle' },
    ],
  },
  {
    label: 'Compendium — D&D 5e',
    items: [
      { label: 'Spells', path: '/compendium/dnd5e/spells' },
      { label: 'Monsters', path: '/compendium/dnd5e/monsters' },
      { label: 'Conditions', path: '/compendium/dnd5e/conditions' },
      { label: 'Magic Items', path: '/compendium/dnd5e/magic-items' },
      { label: 'Equipment', path: '/compendium/dnd5e/equipment' },
      { label: 'Skills & Feats', path: '/compendium/dnd5e/feats' },
      { label: 'Backgrounds & Races', path: '/compendium/dnd5e/backgrounds' },
      { label: 'Wildshape & Familiars', path: '/compendium/dnd5e/wildshape' },
      { label: 'Quick Reference', path: '/reference/dnd5e/quick-reference' },
      { label: 'Level Up Guide', path: '/reference/dnd5e/level-up' },
    ],
  },
  {
    label: 'Compendium — Other Systems',
    items: [
      { label: 'Daggerheart', path: '/compendium/daggerheart' },
      { label: 'Vaesen', path: '/compendium/vaesen' },
      { label: 'Tales from the Loop', path: '/compendium/tftl' },
      { label: 'Call of Cthulhu', path: '/compendium/coc7e' },
    ],
  },
  {
    label: 'Table Tools',
    items: [
      { label: 'Dice Roller', path: '/tools/dice' },
      { label: 'Combat Tracker', path: '/tools/combat' },
      { label: 'Encounter Builder', path: '/tools/encounter-builder' },
      { label: 'NPC Generator', path: '/tools/npc' },
      { label: 'Loot Generator', path: '/tools/loot' },
    ],
  },
  {
    label: 'Campaigns',
    items: [
      { label: 'Campaigns', path: '/campaigns' },
      { label: 'Session Log Editor', path: '/campaigns/logs' },
      { label: 'Party & Characters', path: '/party' },
      { label: 'Campaign Map', path: '/map' },
      { label: 'Content Admin', path: '/admin/content' },
    ],
  },
];

/** Condensed set shown in the desktop top bar. */
export const TOP_NAV: NavItem[] = [
  { label: 'Compendium', path: '/compendium/dnd5e/spells' },
  { label: 'Tools', path: '/tools/dice' },
  { label: 'Chronicle', path: '/chronicle' },
  { label: 'Campaigns', path: '/campaigns' },
];
