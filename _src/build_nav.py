#!/usr/bin/env python3
"""
build_nav.py — Injects the centralised nav component into every HTML page.

Usage:
    python3 _src/build_nav.py

How it works:
  1. Reads _src/components/nav.html  (single source of truth for navigation)
  2. For each .html page in the repo root:
       a. Strips the old inline <div class="nav-overlay">…</nav> block
       b. Injects the fresh nav component
       c. Marks the correct nav item as `active` based on the page filename
  3. Writes the result back in-place

Adding a new page to the nav:
  - Edit _src/components/nav.html only
  - Re-run this script
  - All pages are updated automatically
"""

import os
import re
import sys

# ── Paths ────────────────────────────────────────────────────────────────────
ROOT      = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC       = os.path.join(ROOT, '_src')
NAV_FILE  = os.path.join(SRC, 'components', 'nav.html')

# HTML pages to process (root-level only)
PAGES = [
    'index.html',
    'spelltome.html',
    'conditions.html',
    'wildshape.html',
    'monsters.html',
    'magic-items.html',
    'skills-feats.html',
    'quick-reference.html',
    'combat-tracker.html',
    'dice-roller.html',
    'level-up-guide.html',
    'campaign-tracker.html',
    'campaign-log-builder.html',
]

# ── Helpers ──────────────────────────────────────────────────────────────────
def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()

def write(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def strip_old_nav(html):
    """
    Remove the existing inline nav block:
      <div class="nav-overlay" …></div>
      <nav class="nav-drawer" …> … </nav>
    Handles variations in whitespace and attribute ordering.
    """
    # Match from nav-overlay div through closing </nav> tag
    pattern = re.compile(
        r'<div\s+class="nav-overlay"[^>]*>.*?</div>\s*\n\s*<nav\s+class="nav-drawer"[^>]*>.*?</nav>',
        re.DOTALL
    )
    stripped, n = pattern.subn('', html)
    if n == 0:
        # Fallback: try just the <nav> alone (some pages may differ)
        pattern2 = re.compile(
            r'<nav\s+class="nav-drawer"[^>]*>.*?</nav>',
            re.DOTALL
        )
        stripped, n = pattern2.subn('', html)
    return stripped, n > 0

def inject_nav(html, nav_html, page_filename):
    """
    Insert nav_html immediately after <body> (or after <body …>).
    """
    return re.sub(
        r'(<body[^>]*>)',
        r'\1\n' + nav_html,
        html,
        count=1
    )

def set_active(nav_html, page_filename):
    """
    Add class="nav-item active" to the nav item whose data-page matches
    the current page filename.
    """
    # First clear any existing active classes from all items
    nav_html = nav_html.replace('class="nav-item active"', 'class="nav-item"')

    # Then set active on the matching item
    target = f'data-page="{page_filename}"'
    nav_html = nav_html.replace(
        f'class="nav-item" {target}',
        f'class="nav-item active" {target}'
    )
    return nav_html

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    if not os.path.exists(NAV_FILE):
        print(f'ERROR: nav component not found at {NAV_FILE}')
        sys.exit(1)

    nav_template = read(NAV_FILE)
    print(f'Nav component loaded ({len(nav_template)} chars)\n')

    results = {'updated': [], 'skipped': [], 'errors': []}

    for page in PAGES:
        path = os.path.join(ROOT, page)

        if not os.path.exists(path):
            results['skipped'].append(f'{page} (file not found)')
            continue

        try:
            original = read(path)

            # 1. Strip old nav
            stripped, found = strip_old_nav(original)
            if not found:
                results['skipped'].append(f'{page} (no nav block detected — skipping to avoid data loss)')
                continue

            # 2. Set active state for this page
            nav_for_page = set_active(nav_template, page)

            # 3. Inject updated nav after <body>
            updated = inject_nav(stripped, nav_for_page, page)

            # 4. Write back
            write(path, updated)
            size_kb = os.path.getsize(path) // 1024
            results['updated'].append(f'{page} ({size_kb} KB)')

        except Exception as e:
            results['errors'].append(f'{page}: {e}')

    # ── Report ────────────────────────────────────────────────────────────
    print('-' * 50)
    print(f'[OK]  Updated  ({len(results["updated"])})')
    for r in results['updated']:
        print(f'      {r}')

    if results['skipped']:
        print(f'\n[--]  Skipped  ({len(results["skipped"])})')
        for r in results['skipped']:
            print(f'      {r}')

    if results['errors']:
        print(f'\n[!!]  Errors   ({len(results["errors"])})')
        for r in results['errors']:
            print(f'      {r}')
        sys.exit(1)

    total = len(results['updated'])
    print(f'\nNav injected into {total} page{"s" if total != 1 else ""}.')
    print('Edit _src/components/nav.html to update navigation sitewide.')

if __name__ == '__main__':
    main()
