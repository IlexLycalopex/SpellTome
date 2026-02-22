#!/usr/bin/env python3
"""
build.py — Rebuilds index.html from source files.
Run from the repo root: python3 _src/build.py

Edit source files in _src/ then run this to update index.html.
"""
import os, sys

# Run from repo root
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src  = os.path.join(root, '_src')

def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()

main_css  = read(os.path.join(src, 'styles', 'main.css'))
card_css  = read(os.path.join(src, 'styles', 'card.css'))
print_css = read(os.path.join(src, 'styles', 'print.css'))
spells_js = read(os.path.join(src, 'data',   'spells.js'))
app_js    = read(os.path.join(src, 'scripts','app.js'))

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Spell Tome \u2014 D&D 5e Spell Cards</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap" rel="stylesheet">
<style>
{main_css}
{card_css}
{print_css}
</style>
</head>
<body>
<header id="app-header">
  <div class="header-top">
    <div class="app-title">Spell Tome <span>D&amp;D 5e &middot; 2014</span></div>
    <div class="header-actions">
      <span class="selection-badge" id="selection-count">0 selected</span>
      <button class="btn btn-ghost" id="btn-clear" onclick="clearSelection()">Clear</button>
      <button class="btn btn-print" id="btn-print" disabled onclick="openPrintPreview()">&#128424; Print to PDF</button>
    </div>
  </div>
  <div class="filter-bar">
    <div class="filter-group">
      <span class="filter-label">Class</span>
      <select id="class-select" onchange="onClassChange()">
        <option value="">Select class...</option>
        <option>Bard</option><option>Cleric</option><option>Druid</option>
        <option>Paladin</option><option>Ranger</option><option>Sorcerer</option>
        <option>Warlock</option><option>Wizard</option>
      </select>
    </div>
    <div class="filter-group">
      <span class="filter-label">Level</span>
      <select id="level-select" disabled onchange="onLevelChange()">
        <option value="">Select level...</option>
        <option>1</option><option>2</option><option>3</option><option>4</option>
        <option>5</option><option>6</option><option>7</option><option>8</option>
        <option>9</option><option>10</option><option>11</option><option>12</option>
        <option>13</option><option>14</option><option>15</option><option>16</option>
        <option>17</option><option>18</option><option>19</option><option>20</option>
      </select>
    </div>
    <div class="filter-divider"></div>
    <div class="filter-group">
      <span class="filter-label">Spell Level</span>
      <div class="pill-filters" id="spell-level-pills"></div>
    </div>
    <div class="filter-divider"></div>
    <div class="filter-group">
      <span class="filter-label">School</span>
      <div class="pill-filters" id="school-pills"></div>
    </div>
    <div class="filter-divider"></div>
    <div class="filter-group">
      <span class="filter-label">Source</span>
      <div class="pill-filters" id="book-pills"></div>
    </div>
    <div class="filter-divider"></div>
    <input type="text" class="search-input" id="search-input" placeholder="Search spells..." oninput="renderGrid()">
  </div>
</header>

<div id="results-bar" style="display:none"></div>

<main>
  <div id="empty-state">
    <div class="rune">&#10022;</div>
    <h2>Choose Your Class &amp; Level</h2>
    <p>Select a class and character level to reveal your available spells.</p>
  </div>
  <div id="card-grid" style="display:none"></div>
</main>

<div id="print-preview-overlay">
  <div class="preview-header">
    <div style="display:flex;align-items:center;gap:8px;">
      <h2>Print Preview</h2>
      <span class="preview-note" id="preview-page-count"></span>
    </div>
    <div class="preview-actions">
      <button class="btn btn-ghost" onclick="closePrintPreview()">Cancel</button>
      <button class="btn btn-print" onclick="executePrint()">&#128424; Open Print Dialog</button>
    </div>
  </div>
  <div class="preview-warning">
    In Chrome\'s print dialog, enable <strong>Background graphics</strong> to preserve school colours in your PDF.
  </div>
  <div id="print-pages-container"></div>
</div>

<div id="print-output"></div>

<script>
{spells_js}
{app_js}
</script>
</body>
</html>'''

out = os.path.join(root, 'index.html')
with open(out, 'w', encoding='utf-8') as f:
    f.write(html)

print(f"Built index.html — {os.path.getsize(out)//1024} KB")
