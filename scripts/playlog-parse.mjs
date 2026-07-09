/**
 * Parser for the Obsidian-flavoured playlog markdown files (playlog/*.md).
 * Shared by the one-time import script and its tests.
 *
 * Handles: YAML frontmatter (the small subset these files use — no external
 * YAML dep needed), [[wikilinks]] → bold text, > [!callout] blocks →
 * blockquotes with a bold label.
 */

/** Strip Obsidian syntax from a markdown body for web rendering. */
export function cleanBody(md) {
  return (
    md
      // [[Target|Label]] → **Label**, [[Target]] → **Target**
      .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '**$2**')
      .replace(/\[\[([^\]]+)\]\]/g, '**$1**')
      // > [!important] Title → > **Important — Title**
      .replace(/^(\s*)>\s*\[!(\w+)\]\s*(.*)$/gm, (_, indent, kind, title) => {
        const label = kind.charAt(0).toUpperCase() + kind.slice(1);
        return `${indent}> **${label}${title ? ' — ' + title : ''}**`;
      })
      .trim()
  );
}

/** Strip wikilink syntax from a single frontmatter value. */
export function cleanInline(value) {
  return String(value ?? '')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/^"|"$/g, '')
    .trim();
}

/**
 * Parse one playlog file's text into a play_logs row shape.
 * The frontmatter here is deliberately minimal: `key: value` lines plus
 * `key:` followed by `- item` list lines — exactly what these files contain.
 */
export function parsePlaylog(text, filename = '') {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) throw new Error(`No frontmatter in ${filename}`);
  const [, fmText, body] = m;

  const fm = {};
  let listKey = null;
  for (const line of fmText.split(/\r?\n/)) {
    const listItem = /^\s*-\s+(.*)$/.exec(line);
    if (listItem && listKey) {
      fm[listKey].push(cleanInline(listItem[1]));
      continue;
    }
    const kv = /^(\w[\w_]*):\s*(.*)$/.exec(line);
    if (kv) {
      const [, key, rawValue] = kv;
      if (rawValue === '') {
        fm[key] = [];
        listKey = key;
      } else {
        fm[key] = cleanInline(rawValue);
        listKey = null;
      }
    }
  }

  const sessionNumber = parseInt(String(fm.session ?? '').replace(/\D/g, ''), 10);
  if (Number.isNaN(sessionNumber)) throw new Error(`Bad session number in ${filename}`);

  return {
    campaign: fm.campaign ?? '',
    ruleset: fm.ruleset ?? '',
    session_number: sessionNumber,
    title: fm.synopsis ?? `Session ${sessionNumber}`,
    session_date: fm.date || null,
    gm: fm.gm ?? '',
    players_present: Array.isArray(fm.players_present) ? fm.players_present : [],
    synopsis: fm.synopsis ?? '',
    body_md: cleanBody(body),
    published: String(fm.web_status ?? '').toLowerCase() === 'published',
  };
}
