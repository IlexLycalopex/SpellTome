import type { ZodTypeAny } from 'zod';

/**
 * Everything system-specific hangs off one RulesetModule. Adding a system =
 * one directory here + one skin CSS file + one row in the rulesets table.
 *
 * Modules may contain MECHANICAL scaffolding only (dice systems, sheet
 * structures, condition/skill name lists). Expressive publisher content for
 * gated systems lives in Supabase (compendium_entries), never in the bundle.
 */

export type RulesetId = 'dnd5e' | 'daggerheart' | 'tftl' | 'vaesen' | 'coc7e';

/** Which dice UI and engine the system uses. */
export type DiceKind =
  | { kind: 'd20' }
  | { kind: 'pool'; keepBanesOnPush: boolean }
  | { kind: 'percentile' }
  | { kind: 'duality' };

export interface ConditionDef {
  name: string;
  /** short mechanical effect summary (our wording) */
  effect: string;
}

export interface LogSection {
  id: string;
  label: string;
  placeholder?: string;
}

export interface CompendiumTypeDef {
  type: string;
  label: string;
  /** true → may ship in the public bundle (SRD); false → Supabase-gated */
  public: boolean;
}

export interface RulesetModule {
  id: RulesetId;
  name: string;
  /** value for html[data-skin] */
  skin: RulesetId;
  dice: DiceKind;
  conditions: ConditionDef[];
  /** zod schema validating characters.sheet jsonb for this system */
  sheetSchema: ZodTypeAny;
  /** section skeleton the log editor offers for new sessions */
  logTemplate: LogSection[];
  compendiumTypes: CompendiumTypeDef[];
}
