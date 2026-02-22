// spellSlots.js — Maximum spell level available per class per character level

const SPELL_SLOT_TABLE = {
  // Full casters: Bard, Cleric, Druid, Sorcerer, Wizard
  fullCaster: {
    1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4,
    9: 5, 10: 5, 11: 6, 12: 6, 13: 7, 14: 7, 15: 8,
    16: 8, 17: 9, 18: 9, 19: 9, 20: 9
  },
  // Half casters: Paladin, Ranger (Paladin starts at level 2)
  halfCaster: {
    1: 0, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2, 7: 2, 8: 2,
    9: 3, 10: 3, 11: 3, 12: 3, 13: 3, 14: 3, 15: 4,
    16: 4, 17: 4, 18: 4, 19: 4, 20: 5
  },
  // Ranger: starts at level 2 as well but same table
  ranger: {
    1: 0, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2, 7: 2, 8: 2,
    9: 3, 10: 3, 11: 3, 12: 3, 13: 3, 14: 3, 15: 4,
    16: 4, 17: 4, 18: 4, 19: 4, 20: 5
  },
  // Warlock: pact magic, max slot level 1-5
  warlock: {
    1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4,
    9: 5, 10: 5, 11: 5, 12: 5, 13: 5, 14: 5, 15: 5,
    16: 5, 17: 5, 18: 5, 19: 5, 20: 5
  }
};

const CLASS_TYPE = {
  Bard: 'fullCaster',
  Cleric: 'fullCaster',
  Druid: 'fullCaster',
  Sorcerer: 'fullCaster',
  Wizard: 'fullCaster',
  Paladin: 'halfCaster',
  Ranger: 'ranger',
  Warlock: 'warlock'
};

function getMaxSpellLevel(className, characterLevel) {
  const type = CLASS_TYPE[className];
  if (!type) return 0;
  return SPELL_SLOT_TABLE[type][characterLevel] || 0;
}

function isSpellAvailable(spell, className, characterLevel) {
  // Cantrips (level 0) always available if class has access
  if (spell.level === 0) return spell.classes.includes(className);
  // Check class has access and max spell level
  if (!spell.classes.includes(className)) return false;
  const maxLevel = getMaxSpellLevel(className, characterLevel);
  return spell.level <= maxLevel;
}
