import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
// @ts-expect-error plain-JS module shared with the import script
import { parsePlaylog, cleanBody, cleanInline } from '../../scripts/playlog-parse.mjs';

const logDir = join(__dirname, '../../playlog');

describe('playlog parser', () => {
  const files = readdirSync(logDir).filter((f) => f.endsWith('.md')).sort();

  it('finds all 17 SKT session files', () => {
    expect(files).toHaveLength(17);
  });

  it('parses every file with sane fields', () => {
    const seen = new Set<number>();
    for (const f of files) {
      const row = parsePlaylog(readFileSync(join(logDir, f), 'utf8'), f);
      expect(row.campaign).toBe("Storm King's Thunder");
      expect(row.published).toBe(true);
      expect(row.session_number).toBeGreaterThanOrEqual(0);
      expect(seen.has(row.session_number)).toBe(false);
      seen.add(row.session_number);
      expect(row.body_md).toContain('## Session Recap');
      // no Obsidian syntax survives
      expect(row.body_md).not.toMatch(/\[\[/);
      expect(row.body_md).not.toMatch(/\[!\w+\]/);
      expect(row.gm).not.toMatch(/\[\[/);
      for (const p of row.players_present) expect(p).not.toMatch(/\[\[/);
    }
    expect(seen.size).toBe(17);
  });

  it('converts wikilinks and callouts', () => {
    expect(cleanBody('met [[Cookie]] at [[The Inn|the inn]]')).toBe('met **Cookie** at **the inn**');
    expect(cleanBody('> [!important] Milestone\n> It is started!')).toBe(
      '> **Important — Milestone**\n> It is started!',
    );
    expect(cleanInline('"[[Matthew Rogers]]"')).toBe('Matthew Rogers');
  });

  it('session dates are ISO-parseable when present', () => {
    for (const f of files) {
      const row = parsePlaylog(readFileSync(join(logDir, f), 'utf8'), f);
      if (row.session_date) {
        expect(Number.isNaN(Date.parse(row.session_date))).toBe(false);
      }
    }
  });
});
