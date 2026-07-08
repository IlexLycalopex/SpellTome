#!/usr/bin/env node
/**
 * One-time (but repeatable) extraction of the inline `const X = [...]` data
 * blocks from the old static HTML pages into JSON files consumed by the new
 * Astro site's content collections.
 *
 * Usage: node scripts/extract-data.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outRoot = join(root, 'site/src/data/dnd5e');

/**
 * Some data consts reference sibling consts defined earlier in the same
 * inline script (icon maps, shared trait bases). List them here so they are
 * evaluated into the vm context first.
 */
const DEPS = {
  'conditions.html': ['SVG'],
  'backgrounds.html': ['DWARF_BASE', 'ELF_BASE', 'HALFLING_BASE', 'GNOME_BASE'],
};

/** [sourceFile, constName, outputFile] */
const TARGETS = [
  ['spelltome.html', 'SPELLS', 'spells-2014.json'],
  ['spelltome.html', 'SPELLS_2024', 'spells-2024.json'],
  ['assets/js/monsters-data.js', 'MONSTERS', 'monsters.json'],
  ['magic-items.html', 'ITEMS', 'magic-items.json'],
  ['equipment.html', 'EQUIPMENT', 'equipment.json'],
  ['conditions.html', 'CONDITIONS', 'conditions.json'],
  ['skills-feats.html', 'SKILLS', 'skills.json'],
  ['skills-feats.html', 'FEATS', 'feats.json'],
  ['backgrounds.html', 'BACKGROUNDS', 'backgrounds.json'],
  ['backgrounds.html', 'RACES', 'races.json'],
  ['wildshape.html', 'BEASTS', 'beasts.json'],
  ['wildshape.html', 'FAMILIARS', 'familiars.json'],
  ['npc-generator.html', 'RACES', 'tables/npc-races.json'],
  ['npc-generator.html', 'OCCUPATIONS', 'tables/npc-occupations.json'],
  ['npc-generator.html', 'TRAITS', 'tables/npc-traits.json'],
  ['loot-generator.html', 'INDIVIDUAL_TABLES', 'tables/loot-individual.json'],
  ['loot-generator.html', 'HOARD_TABLES', 'tables/loot-hoard.json'],
];

/**
 * Slice `const NAME = <literal>;` out of source text by walking brackets.
 * The data blocks are plain array/object literals (strings may contain
 * brackets, so track string/escape state too).
 */
function sliceConst(src, name, file) {
  const decl = new RegExp(`const\\s+${name}\\s*=\\s*`);
  const m = decl.exec(src);
  if (!m) throw new Error(`const ${name} not found in ${file}`);
  const start = m.index + m[0].length;
  const open = src[start];
  if (open !== '[' && open !== '{') {
    throw new Error(`const ${name} in ${file} is not an array/object literal`);
  }
  const close = open === '[' ? ']' : '}';
  let depth = 0;
  let inStr = null; // quote char when inside a string
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    const prev = src[i - 1];
    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (prev === '*' && c === '/') inBlockComment = false;
      continue;
    }
    if (inStr) {
      if (c === '\\') {
        i++; // skip escaped char
      } else if (c === inStr) {
        inStr = null;
      }
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      inStr = c;
      continue;
    }
    if (c === '/' && src[i + 1] === '/') {
      inLineComment = true;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      inBlockComment = true;
      continue;
    }
    if (c === open || (open === '[' && c === '{') || (open === '{' && c === '[')) {
      if (c === open) depth++;
      continue;
    }
    if (c === close || (open === '[' && c === '}') || (open === '{' && c === ']')) {
      if (c === close) {
        depth--;
        if (depth === 0) return src.slice(start, i + 1);
      }
      continue;
    }
  }
  throw new Error(`Unterminated literal for const ${name} in ${file}`);
}

let failures = 0;
const counts = {};
for (const [file, constName, outFile] of TARGETS) {
  try {
    const src = readFileSync(join(root, file), 'utf8');
    const context = {};
    for (const dep of DEPS[file] ?? []) {
      context[dep] = vm.runInNewContext(`(${sliceConst(src, dep, file)})`, context, { timeout: 5000 });
    }
    const literal = sliceConst(src, constName, file);
    const value = vm.runInNewContext(`(${literal})`, context, { timeout: 5000 });
    const outPath = join(outRoot, outFile);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, JSON.stringify(value, null, 1) + '\n');
    const n = Array.isArray(value) ? value.length : Object.keys(value).length;
    counts[outFile] = n;
    console.log(`✓ ${file} :: ${constName} → dnd5e/${outFile} (${n} entries)`);
  } catch (err) {
    failures++;
    console.error(`✗ ${file} :: ${constName} — ${err.message}`);
  }
}

if (failures) {
  console.error(`\n${failures} extraction(s) failed`);
  process.exit(1);
}
writeFileSync(join(outRoot, 'extraction-counts.json'), JSON.stringify(counts, null, 1) + '\n');
console.log('\nAll extractions complete.');
