import type { RulesetId, RulesetModule } from './types';
import dnd5e from './dnd5e';
import daggerheart from './daggerheart';
import tftl from './tftl';
import vaesen from './vaesen';
import coc7e from './coc7e';

export const RULESETS: Record<RulesetId, RulesetModule> = {
  dnd5e,
  daggerheart,
  tftl,
  vaesen,
  coc7e,
};

export const RULESET_LIST: RulesetModule[] = Object.values(RULESETS);

export type { RulesetId, RulesetModule } from './types';
